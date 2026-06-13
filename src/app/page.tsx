import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { accounts, cases, deals, offerApprovals } from "@/db/schema";
import { STAGE_LABELS, dealTotalValue, isDealAtRisk } from "@/lib/deals";
import { formatEuro } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-10">
        <div className="max-w-lg text-center">
          <h2 className="mb-3 text-2xl font-semibold">HMD Secure CRM</h2>
          <p className="text-muted">
            Select a demo user from the top bar to explore role-based views.
          </p>
        </div>
      </div>
    );
  }

  const myAccounts =
    user.role === "sales_rep"
      ? await db.query.accounts.findMany({
          where: eq(accounts.ownerId, user.id),
          with: {
            deals: { orderBy: [desc(deals.updatedAt)] },
          },
          orderBy: [desc(accounts.updatedAt)],
        })
      : [];

  const stalled = await db.query.deals.findMany({
    with: { account: true, owner: true },
    orderBy: [desc(deals.lastActivityAt)],
  });
  const atRisk = stalled.filter(isDealAtRisk);

  const myCases =
    user.role === "tam"
      ? await db.query.cases.findMany({
          where: (c, { eq: eqFn }) => eqFn(c.assigneeId, user.id),
          with: { account: true },
          orderBy: (c, { desc: descFn }) => [descFn(c.updatedAt)],
          limit: 6,
        })
      : [];

  const pendingApprovals =
    user.role === "sales_manager" || user.role === "finance"
      ? await db.query.offerApprovals.findMany({
          where: (a, { and, eq: eqFn }) =>
            and(eqFn(a.status, "pending"), eqFn(a.approverRole, user.role)),
          with: { offer: { with: { account: true, deal: true } } },
        })
      : [];

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="mb-8 text-muted">Role dashboard — {user.role.replaceAll("_", " ")}</p>

      {user.role === "sales_rep" && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">My accounts & deal status</h2>
            <Link href="/deals" className="text-sm text-accent hover:underline">
              Open pipeline →
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-sidebar text-xs uppercase text-muted">
                <tr>
                  <th className="p-3">Account</th>
                  <th className="p-3">Open deals</th>
                  <th className="p-3">Top stage</th>
                  <th className="p-3 font-mono">Pipeline</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {myAccounts.map((account) => {
                  const openDeals = account.deals.filter(
                    (d) => d.stage !== "won" && d.stage !== "lost",
                  );
                  const topDeal = openDeals[0];
                  const pipeline = openDeals.reduce(
                    (sum, d) => sum + dealTotalValue(d.quarterlyForecast),
                    0,
                  );
                  const risky = openDeals.some((d) => isDealAtRisk(d));

                  return (
                    <tr key={account.id} className="border-t border-border hover:bg-card/50">
                      <td className="p-3">
                        <Link
                          href={`/accounts/${account.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {account.name}
                        </Link>
                        <p className="text-xs text-muted">
                          {account.segment} · {account.region}
                        </p>
                      </td>
                      <td className="p-3">{openDeals.length}</td>
                      <td className="p-3">
                        {topDeal ? (
                          <Link href={`/deals?deal=${topDeal.id}`} className="hover:text-accent">
                            {STAGE_LABELS[topDeal.stage]}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 font-mono tabular-nums">{formatEuro(pipeline)}</td>
                      <td className="p-3">
                        {risky ? (
                          <Badge variant="warning">At risk</Badge>
                        ) : (
                          <Badge variant="success">On track</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {user.role === "tam" && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-medium">Assigned cases</h2>
          <div className="space-y-2">
            {myCases.map((c) => (
              <Link
                key={c.id}
                href={`/cases?case=${c.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-accent"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted">{c.account.name}</p>
                </div>
                <Badge variant={c.priority === "critical" ? "danger" : "warning"}>
                  {c.priority}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(user.role === "sales_manager" || user.role === "finance") && (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-medium">Stalled deals (14+ days)</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {atRisk.slice(0, 6).map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals?deal=${deal.id}`}
                  className="rounded-xl border border-warning/30 bg-card p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="warning">At risk</Badge>
                    <span className="text-sm text-muted">{deal.account.name}</span>
                  </div>
                  <p className="font-medium">{deal.title}</p>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium">Approval queue</h2>
            <div className="space-y-2">
              {pendingApprovals.map((a) => (
                <div key={a.id} className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="font-medium">{a.offer.deal?.title ?? "Offer"}</p>
                  <p className="text-sm text-muted">{a.offer.account.name}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {user.role === "finance" && (
        <section className="mt-8">
          <Link
            href="/forecast"
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
          >
            Open 3-year forecast chart →
          </Link>
        </section>
      )}
    </div>
  );
}
