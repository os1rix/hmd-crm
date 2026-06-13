import { db } from "@/db";
import { activityLog, deals, notes } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { dealTotalValue } from "@/lib/deals";
import { getSessionUser } from "@/lib/session";
import { updateDealSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deal = await db.query.deals.findFirst({
      where: eq(deals.id, id),
      with: {
        account: true,
        owner: true,
        offers: { with: { approvals: true } },
        notes: { with: { author: true }, orderBy: (n, { desc }) => [desc(n.createdAt)] },
      },
    });
    if (!deal) return apiError("Not found", 404);
    return apiSuccess(deal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch deal";
    return apiError(message);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const parsed = await parseJsonBody(request, updateDealSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const existing = await db.query.deals.findFirst({ where: eq(deals.id, id) });
    if (!existing) return apiError("Not found", 404);

    const forecastTotal = parsed.data.quarterlyForecast
      ? dealTotalValue(parsed.data.quarterlyForecast)
      : undefined;

    const [deal] = await db
      .update(deals)
      .set({
        ...parsed.data,
        ...(forecastTotal !== undefined ? { threeYearForecast: forecastTotal.toFixed(2) } : {}),
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();

    if (parsed.data.stage && parsed.data.stage !== existing.stage) {
      await db.insert(activityLog).values({
        actorId: user.id,
        entityType: "deal",
        entityId: id,
        action: "stage_changed",
        metadata: { from: existing.stage, to: parsed.data.stage },
      });
      await db.insert(notes).values({
        authorId: user.id,
        accountId: existing.accountId,
        dealId: id,
        body: `Stage updated to ${parsed.data.stage.replaceAll("_", " ")}`,
      });
    }

    return apiSuccess(deal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update deal";
    return apiError(message);
  }
}
