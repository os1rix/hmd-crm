import { db } from "@/db";
import { notifications, offerApprovals, offers } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { calcOfferTotals } from "@/lib/offer-totals";
import { getSessionUser } from "@/lib/session";
import { updateOfferSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const parsed = await parseJsonBody(request, updateOfferSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const existing = await db.query.offers.findFirst({
      where: eq(offers.id, id),
    });
    if (!existing) return apiError("Offer not found", 404);
    if (existing.status !== "draft" || existing.isLocked) {
      return apiError("Only draft offers can be edited", 409);
    }

    const { subtotal, total } = calcOfferTotals(parsed.data.lineItems, parsed.data.discountPercent);
    const submit = !parsed.data.submitAsDraft;

    const [updated] = await db
      .update(offers)
      .set({
        lineItems: parsed.data.lineItems,
        subtotal,
        discountPercent: parsed.data.discountPercent?.toFixed(2) ?? null,
        discountJustification: parsed.data.discountJustification ?? null,
        total,
        status: submit ? "submitted" : "draft",
        isLocked: submit,
      })
      .where(eq(offers.id, id))
      .returning();

    if (submit) {
      await db.insert(offerApprovals).values({
        offerId: updated.id,
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
          body: `${user.name} submitted offer v${updated.version} for review`,
          link: "/deals",
        });
      }
    }

    return apiSuccess(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update offer";
    return apiError(message);
  }
}
