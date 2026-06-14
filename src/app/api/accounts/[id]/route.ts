import { db } from "@/db";
import { accounts } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api";
import { eq } from "drizzle-orm";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, id),
      with: {
        owner: true,
        contacts: true,
        deals: { with: { owner: true, offers: { with: { approvals: true, createdBy: true } } } },
        cases: { with: { assignee: true, service: true } },
        offers: {
          with: { deal: true, createdBy: true, approvals: true },
          orderBy: (offers, { desc }) => [desc(offers.createdAt)],
        },
        notes: { with: { author: true }, orderBy: (notes, { desc }) => [desc(notes.createdAt)] },
      },
    });
    if (!account) return apiError("Not found", 404);

    const activity = await db.query.activityLog.findMany({
      orderBy: (log, { desc }) => [desc(log.createdAt)],
      limit: 50,
      with: { actor: true },
    });

    const accountActivity = activity.filter(
      (a) =>
        a.entityId === id ||
        account.deals.some((d) => d.id === a.entityId) ||
        account.cases.some((c) => c.id === a.entityId),
    );

    return apiSuccess({ ...account, activity: accountActivity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch account";
    return apiError(message);
  }
}
