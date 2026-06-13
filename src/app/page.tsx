import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { cases, deals, offerApprovals } from "@/db/schema";
import { dealTotalValue, isDealAtRisk } from "@/lib/deals";
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
            Select a demo user from the top bar to explore role-based views with seeded data.
          </p>
        </div>
      </div>
    );
  }

  const myDeals =
    user.role === "sales_rep"
      ? await db.query.deals.findMany({
          where: eq(deals.ownerId, user.id),
          with: { account: true },
          orderBy: [desc(deals.updatedAt)],
          limit: 5,
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
          <h2 className="mb-4 text-lg font-medium">My pipeline highlights</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {myDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals?deal=${deal.id}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-accent"
              >
                <p className="font-medium">{deal.title}</p>
                <p className="text-sm text-muted">{deal.account.name}</p>
                <p className="mt-2 font-mono text-sm tabular-nums text-accent">
                  {formatEuro(dealTotalValue(deal.quarterlyForecast))}
                </p>
              </Link>
            ))}
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
