import { db } from "@/db";
import { deals } from "@/db/schema";
import { callAi, isAiConfigured } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";
import type { DealStage } from "@/lib/deals";
import { daysSince } from "@/lib/deals";
import { demoNextAction } from "@/lib/demo-ai";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { dealId } = (await request.json()) as { dealId: string };
  if (!dealId) return apiError("dealId required", 400);

  try {
    const deal = await db.query.deals.findFirst({
      where: eq(deals.id, dealId),
      with: {
        account: { with: { contacts: true } },
        notes: { limit: 5, orderBy: (n, { desc }) => [desc(n.createdAt)] },
      },
    });
    if (!deal) return apiError("Deal not found", 404);

    const primaryContact =
      deal.account.contacts.find((c) => c.isPrimary) ?? deal.account.contacts[0];

    if (!isAiConfigured()) {
      return apiSuccess(
        demoNextAction({
          title: deal.title,
          accountName: deal.account.name,
          stage: deal.stage as DealStage,
          lastActivityAt: deal.lastActivityAt,
          contactHint: primaryContact?.name.split(" ")[0],
        }),
      );
    }

    const context = `Deal: ${deal.title}
Account: ${deal.account.name}
Stage: ${deal.stage}
Days since last update: ${daysSince(deal.lastActivityAt)}
Recent notes: ${deal.notes.map((n) => n.body).join(" | ")}`;

    const action = await callAi(
      'You are a B2B sales coach for HMD Secure device security. Reply with JSON: {"action":"one sentence next step","topics":["3 bullet topics"],"email":"short outreach email under 120 words"}',
      [{ role: "user", content: context }],
    );

    try {
      const parsed = JSON.parse(action) as { action: string; topics?: string[]; email: string };
      return apiSuccess({
        action: parsed.action,
        topics: parsed.topics ?? [],
        email: parsed.email ?? "",
      });
    } catch {
      return apiSuccess({ action, topics: [], email: "" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
