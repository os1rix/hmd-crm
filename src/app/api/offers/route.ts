import { db } from "@/db";
import { notifications, offerApprovals, offers } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { approveOfferSchema, createOfferSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

function calcTotal(lineItems: { quantity: number; unitPrice: string }[], discount?: number) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * Number.parseFloat(item.unitPrice),
    0,
  );
  const discountAmount = discount ? subtotal * (discount / 100) : 0;
  return { subtotal, total: subtotal - discountAmount };
}

export async function GET() {
  try {
    const rows = await db.query.offers.findMany({
      orderBy: [desc(offers.createdAt)],
      with: {
        account: true,
        deal: true,
        createdBy: true,
        approvals: { with: { approver: true } },
      },
    });
    return apiSuccess(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch offers";
    return apiError(message);
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, createOfferSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const { subtotal, total } = calcTotal(parsed.data.lineItems, parsed.data.discountPercent);

  try {
    const [offer] = await db
      .insert(offers)
      .values({
        accountId: parsed.data.accountId,
        dealId: parsed.data.dealId,
        createdById: user.id,
        lineItems: parsed.data.lineItems,
        subtotal: subtotal.toFixed(2),
        discountPercent: parsed.data.discountPercent?.toFixed(2),
        discountJustification: parsed.data.discountJustification,
        total: total.toFixed(2),
        isLocked: Boolean(parsed.data.discountPercent && parsed.data.discountPercent > 0),
      })
      .returning();

    if (offer.isLocked) {
      await db.insert(offerApprovals).values({
        offerId: offer.id,
        approverRole: "sales_manager",
        status: "pending",
      });
      const managers = await db.query.users.findMany({
        where: (u, { eq: eqFn }) => eqFn(u.role, "sales_manager"),
      });
      for (const manager of managers) {
        await db.insert(notifications).values({
          userId: manager.id,
          title: "Discount approval needed",
          body: `${user.name} submitted a discounted offer for review`,
          link: "/deals",
        });
      }
    }

    return apiSuccess(offer, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create offer";
    return apiError(message);
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, approveOfferSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const approval = await db.query.offerApprovals.findFirst({
      where: eq(offerApprovals.id, parsed.data.approvalId),
      with: { offer: true },
    });
    if (!approval) return apiError("Approval not found", 404);
    if (approval.approverRole !== user.role) return apiError("Forbidden", 403);

    await db
      .update(offerApprovals)
      .set({
        status: parsed.data.status,
        comment: parsed.data.comment,
        approverId: user.id,
        decidedAt: new Date(),
      })
      .where(eq(offerApprovals.id, parsed.data.approvalId));

    const offer = approval.offer;

    if (parsed.data.status === "approved" && user.role === "sales_manager") {
      await db.insert(offerApprovals).values({
        offerId: offer.id,
        approverRole: "finance",
        status: "pending",
      });
      const financeUsers = await db.query.users.findMany({
        where: (u, { eq: eqFn }) => eqFn(u.role, "finance"),
      });
      for (const fin of financeUsers) {
        await db.insert(notifications).values({
          userId: fin.id,
          title: "Finance approval needed",
          body: `Offer for ${offer.accountId} passed manager review`,
          link: "/forecast",
        });
      }
    }

    if (
      parsed.data.status === "rejected" ||
      (parsed.data.status === "approved" && user.role === "finance")
    ) {
      await db.insert(notifications).values({
        userId: offer.createdById,
        title: parsed.data.status === "approved" ? "Offer approved" : "Offer rejected",
        body: `Your offer was ${parsed.data.status} by ${user.name}`,
        link: "/deals",
      });
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process approval";
    return apiError(message);
  }
}
