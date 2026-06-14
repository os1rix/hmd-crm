import { db } from "@/db";
import { notifications, offerApprovals, offers } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { canDecideOfferApproval } from "@/lib/offer-approvals";
import { getSessionUser } from "@/lib/session";
import { approveOfferSchema, createOfferSchema } from "@/lib/validators";
import { and, desc, eq } from "drizzle-orm";

function calcTotal(lineItems: { quantity: number; unitPrice: string }[], discount?: number) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * Number.parseFloat(item.unitPrice),
    0,
  );
  const discountAmount = discount ? subtotal * (discount / 100) : 0;
  return { subtotal, total: subtotal - discountAmount };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");
  const dealId = url.searchParams.get("dealId");

  try {
    const rows = await db.query.offers.findMany({
      where: and(
        accountId ? eq(offers.accountId, accountId) : undefined,
        dealId ? eq(offers.dealId, dealId) : undefined,
      ),
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
  const isDraft = parsed.data.submitAsDraft;

  let version = 1;
  if (parsed.data.dealId) {
    const existing = await db.query.offers.findMany({
      where: eq(offers.dealId, parsed.data.dealId),
      orderBy: [desc(offers.version)],
      limit: 1,
    });
    if (existing[0]) version = existing[0].version + 1;
  }

  try {
    const [offer] = await db
      .insert(offers)
      .values({
        accountId: parsed.data.accountId,
        dealId: parsed.data.dealId,
        createdById: user.id,
        version,
        lineItems: parsed.data.lineItems,
        subtotal: subtotal.toFixed(2),
        discountPercent: parsed.data.discountPercent?.toFixed(2),
        discountJustification: parsed.data.discountJustification,
        total: total.toFixed(2),
        status: isDraft ? "draft" : "submitted",
        isLocked: !isDraft,
      })
      .returning();

    if (!isDraft) {
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
          title: "Offer approval needed",
          body: `${user.name} submitted offer v${version} for review`,
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
    if (approval.status !== "pending") return apiError("Approval already decided", 409);
    if (!canDecideOfferApproval(user.role, approval)) return apiError("Forbidden", 403);

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

    if (parsed.data.status === "approved" && approval.approverRole === "sales_manager") {
      const existingFinance = await db.query.offerApprovals.findFirst({
        where: and(
          eq(offerApprovals.offerId, offer.id),
          eq(offerApprovals.approverRole, "finance"),
        ),
      });
      if (!existingFinance) {
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
            body: `Offer v${offer.version} passed manager review`,
            link: "/forecast",
          });
        }
      }
    }

    if (parsed.data.status === "approved" && approval.approverRole === "finance") {
      await db.update(offers).set({ status: "approved" }).where(eq(offers.id, offer.id));
    }

    if (parsed.data.status === "rejected") {
      await db.update(offers).set({ status: "rejected" }).where(eq(offers.id, offer.id));
    }

    if (
      parsed.data.status === "rejected" ||
      (parsed.data.status === "approved" && approval.approverRole === "finance")
    ) {
      await db.insert(notifications).values({
        userId: offer.createdById,
        title: parsed.data.status === "approved" ? "Offer approved" : "Offer rejected",
        body: `Your offer v${offer.version} was ${parsed.data.status} by ${user.name}`,
        link: "/deals",
      });
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process approval";
    return apiError(message);
  }
}
