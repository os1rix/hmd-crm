import { db } from "@/db";
import { deals } from "@/db/schema";
import { callClaude } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";
import { daysSince } from "@/lib/deals";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { dealId } = (await request.json()) as { dealId: string };
  if (!dealId) return apiError("dealId required", 400);

  try {
    const deal = await db.query.deals.findFirst({
      where: eq(deals.id, dealId),
      with: {
        account: true,
        notes: { limit: 5, orderBy: (n, { desc }) => [desc(n.createdAt)] },
      },
    });
    if (!deal) return apiError("Deal not found", 404);

    const context = `Deal: ${deal.title}
Account: ${deal.account.name}
Stage: ${deal.stage}
Days since last update: ${daysSince(deal.lastActivityAt)}
Recent notes: ${deal.notes.map((n) => n.body).join(" | ")}`;

    const action = await callClaude(
      'You are a B2B sales coach for HMD Secure device security. Reply with JSON: {"action":"one sentence next step","email":"short outreach email under 120 words"}',
      [{ role: "user", content: context }],
    );

    try {
      const parsed = JSON.parse(action) as { action: string; email: string };
      return apiSuccess(parsed);
    } catch {
      return apiSuccess({ action, email: "" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
