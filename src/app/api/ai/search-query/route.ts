import { db } from "@/db";
import { accounts, cases, deals } from "@/db/schema";
import { callAi, isAiConfigured } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";
import { STAGE_LABELS, isDealAtRisk } from "@/lib/deals";
import { getSessionUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const { query } = (await request.json()) as { query?: string };
  if (!query?.trim()) return apiSuccess({ answer: "", results: [] });

  try {
    const [allDeals, allAccounts, allCases] = await Promise.all([
      db.query.deals.findMany({ with: { account: true, owner: true } }),
      db.query.accounts.findMany(),
      db.query.cases.findMany({ with: { account: true } }),
    ]);

    const context = {
      deals: allDeals.map((d) => ({
        id: d.id,
        title: d.title,
        account: d.account.name,
        region: d.account.region,
        segment: d.account.segment,
        stage: STAGE_LABELS[d.stage],
        atRisk: isDealAtRisk(d),
        owner: d.owner.name,
      })),
      accounts: allAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        region: a.region,
        segment: a.segment,
      })),
      cases: allCases.map((c) => ({
        id: c.id,
        title: c.title,
        account: c.account.name,
        priority: c.priority,
        status: c.status,
      })),
    };

    let answer = "";
    if (isAiConfigured()) {
      answer = await callAi(
        `You are a CRM search assistant. Answer the user's query concisely (2-3 sentences) based on the CRM data provided. Mention specific account/deal names when relevant.`,
        [
          {
            role: "user",
            content: `CRM data:\n${JSON.stringify(context, null, 0)}\n\nQuery: ${query}`,
          },
        ],
        512,
      );
    } else {
      const atRisk = allDeals.filter(isDealAtRisk);
      answer = `Found ${atRisk.length} at-risk deals and ${allCases.filter((c) => c.status !== "closed").length} open cases in the pipeline.`;
    }

    const q = query.toLowerCase();
    const results: Array<{
      type: "account" | "deal" | "case";
      id: string;
      title: string;
      subtitle: string;
      href: string;
    }> = [];

    if (/at.?risk|stalled|risk/i.test(q)) {
      for (const d of allDeals.filter(isDealAtRisk).slice(0, 5)) {
        results.push({
          type: "deal",
          id: d.id,
          title: d.title,
          subtitle: `${d.account.name} · at risk`,
          href: `/deals?deal=${d.id}`,
        });
      }
    }

    if (/DACH|germany|austria|switzerland/i.test(q)) {
      for (const a of allAccounts
        .filter((a) => /DACH|Germany|Austria|Switzerland/i.test(a.region ?? ""))
        .slice(0, 5)) {
        results.push({
          type: "account",
          id: a.id,
          title: a.name,
          subtitle: a.region ?? "",
          href: `/accounts/${a.id}`,
        });
      }
    }

    if (/enterprise/i.test(q)) {
      for (const a of allAccounts.filter((a) => a.segment === "Enterprise").slice(0, 5)) {
        results.push({
          type: "account",
          id: a.id,
          title: a.name,
          subtitle: `${a.segment} · ${a.region}`,
          href: `/accounts/${a.id}`,
        });
      }
    }

    if (/case|support|sla/i.test(q)) {
      for (const c of allCases
        .filter((c) => c.status !== "closed" && c.status !== "resolved")
        .slice(0, 5)) {
        results.push({
          type: "case",
          id: c.id,
          title: c.title,
          subtitle: `${c.account.name} · ${c.priority}`,
          href: `/cases?case=${c.id}`,
        });
      }
    }

    if (results.length === 0) {
      const pattern = q.replace(/[^a-z0-9\s]/gi, "");
      for (const a of allAccounts) {
        if (a.name.toLowerCase().includes(pattern)) {
          results.push({
            type: "account",
            id: a.id,
            title: a.name,
            subtitle: a.region ?? "",
            href: `/accounts/${a.id}`,
          });
        }
      }
      for (const d of allDeals) {
        if (d.title.toLowerCase().includes(pattern)) {
          results.push({
            type: "deal",
            id: d.id,
            title: d.title,
            subtitle: d.account.name,
            href: `/deals?deal=${d.id}`,
          });
        }
      }
    }

    return apiSuccess({ answer, results: results.slice(0, 8) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return apiError(message);
  }
}
