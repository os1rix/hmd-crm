import { db } from "@/db";
import { accounts, cases, deals } from "@/db/schema";
import { apiSuccess } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { ilike, or } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiSuccess({ results: [] });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) return apiSuccess({ results: [] });

  const pattern = `%${q}%`;

  const [accountRows, dealRows, caseRows] = await Promise.all([
    db.query.accounts.findMany({
      where: or(
        ilike(accounts.name, pattern),
        ilike(accounts.region, pattern),
        ilike(accounts.segment, pattern),
      ),
      limit: 8,
    }),
    db.query.deals.findMany({
      where: ilike(deals.title, pattern),
      with: { account: true },
      limit: 8,
    }),
    db.query.cases.findMany({
      where: ilike(cases.title, pattern),
      with: { account: true },
      limit: 8,
    }),
  ]);

  const results = [
    ...accountRows.map((a) => ({
      type: "account" as const,
      id: a.id,
      title: a.name,
      subtitle: `${a.segment ?? ""} · ${a.region ?? ""}`.trim(),
      href: `/accounts/${a.id}`,
    })),
    ...dealRows.map((d) => ({
      type: "deal" as const,
      id: d.id,
      title: d.title,
      subtitle: d.account.name,
      href: `/deals?deal=${d.id}`,
    })),
    ...caseRows.map((c) => ({
      type: "case" as const,
      id: c.id,
      title: c.title,
      subtitle: c.account.name,
      href: `/cases?case=${c.id}`,
    })),
  ].slice(0, 12);

  return apiSuccess({ results });
}
