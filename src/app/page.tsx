import { RoleSelector } from "@/components/auth/role-selector";
import { ApprovalQueue } from "@/components/dashboard/approval-queue";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TamCaseList } from "@/components/dashboard/tam-case-list";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusChip } from "@/components/ui/status-chip";
import { db } from "@/db";
import { accounts, activityLog, cases, deals, offerApprovals } from "@/db/schema";
import { STAGE_LABELS, dealTotalValue, isDealAtRisk, weightedValue } from "@/lib/deals";
import { daysSinceUpdate, formatEuro, formatRelative } from "@/lib/format";
import { getSessionUser } from "@/lib/session";
import { and, desc, eq } from "drizzle-orm";
import { AlertTriangle, Briefcase, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    return <RoleSelector />;
  }

  const allDeals = await db.query.deals.findMany({
    with: { account: true, owner: true },
    orderBy: [desc(deals.lastActivityAt)],
  });
  const openDeals = allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const atRiskDeals = allDeals.filter(isDealAtRisk);

  const myAccounts =
    user.role === "sales_rep"
      ? await db.query.accounts.findMany({
          where: eq(accounts.ownerId, user.id),
          with: { deals: { orderBy: [desc(deals.updatedAt)] } },
          orderBy: [desc(accounts.updatedAt)],
        })
      : [];

  const myCases =
    user.role === "tam"
      ? await db.query.cases.findMany({
          where: eq(cases.assigneeId, user.id),
          with: { account: true },
          orderBy: [desc(cases.updatedAt)],
        })
      : [];

  const pendingApprovals =
    user.role === "sales_manager" || user.role === "finance"
      ? await db.query.offerApprovals.findMany({
          where: and(
            eq(offerApprovals.status, "pending"),
            eq(offerApprovals.approverRole, user.role),
          ),
          with: {
            offer: {
              with: { account: true, deal: true, createdBy: true },
            },
          },
        })
      : [];

  const accountIds = myAccounts.map((a) => a.id);
  const recentActivity =
    user.role === "sales_rep" && accountIds.length > 0
      ? (
          await db.query.activityLog.findMany({
            orderBy: [desc(activityLog.createdAt)],
            limit: 30,
            with: { actor: true },
          })
        )
          .filter(
            (a) =>
              accountIds.includes(a.entityId) ||
              myAccounts.some(
                (acc) => acc.deals.some((d) => d.id === a.entityId) || acc.id === a.entityId,
              ),
          )
          .slice(0, 5)
      : [];

  const accountNameByEntity = new Map<string, string>();
  for (const acc of myAccounts) {
    accountNameByEntity.set(acc.id, acc.name);
    for (const d of acc.deals) accountNameByEntity.set(d.id, acc.name);
  }

  const repOpenDeals = myAccounts.flatMap((a) =>
    a.deals.filter((d) => d.stage !== "won" && d.stage !== "lost"),
  );
  const repPipeline = repOpenDeals.reduce((s, d) => s + dealTotalValue(d.quarterlyForecast), 0);
  const repAtRisk = repOpenDeals.filter(isDealAtRisk).length;

  const tamOpen = myCases.filter((c) => c.status !== "closed" && c.status !== "resolved");
  const tamHigh = myCases.filter((c) => c.priority === "high" || c.priority === "critical");
  const tamSla = myCases.filter((c) => {
    if (!c.slaDueAt) return false;
    const daysLeft = Math.ceil(
      (new Date(c.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysLeft <= 3 && daysLeft >= 0;
  });

  const teamPipeline = openDeals.reduce((s, d) => s + dealTotalValue(d.quarterlyForecast), 0);
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + weightedValue(d.quarterlyForecast, d.stage),
    0,
  );

  const headerStat = (() => {
    switch (user.role) {
      case "sales_rep":
        return { label: "Total pipeline", value: formatEuro(repPipeline) };
      case "tam":
        return { label: "Open cases", value: String(tamOpen.length) };
      case "sales_manager":
        return { label: "Stalled deals", value: String(atRiskDeals.length) };
      case "finance":
        return {
          label: "Weighted pipeline",
          value: formatEuro(weightedPipeline),
        };
      default:
        return { label: "", value: "" };
    }
  })();

  return (
    <div className="p-6">
      <DashboardHeader user={user} stat={headerStat} />

      {user.role === "sales_rep" && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <KpiCard
              label="Open deals"
              value={repOpenDeals.length}
              icon={Briefcase}
              trend="neutral"
            />
            <KpiCard
              label="Total pipeline"
              value={formatEuro(repPipeline)}
              icon={TrendingUp}
              trend="up"
            />
            <KpiCard
              label="At-risk deals"
              value={repAtRisk}
              icon={AlertTriangle}
              trend={repAtRisk > 0 ? "down" : "neutral"}
            />
          </div>

          <section className="mb-8">
            <SectionHeader
              action={
                <Link href="/deals" className="text-xs text-accent hover:underline">
                  Open pipeline →
                </Link>
              }
            >
              My accounts & deal status
            </SectionHeader>
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Account",
                      "Open deals",
                      "Top stage",
                      "Pipeline",
                      "Days since update",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="p-3 text-[13px] font-medium uppercase tracking-widest text-section"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myAccounts.map((account) => {
                    const accountOpen = account.deals.filter(
                      (d) => d.stage !== "won" && d.stage !== "lost",
                    );
                    const topDeal = accountOpen[0];
                    const pipeline = accountOpen.reduce(
                      (sum, d) => sum + dealTotalValue(d.quarterlyForecast),
                      0,
                    );
                    const risky = accountOpen.some((d) => isDealAtRisk(d));
                    const days = daysSinceUpdate(account.updatedAt);

                    return (
                      <tr
                        key={account.id}
                        className={`border-t border-border border-l-4 ${
                          risky ? "border-l-warning" : "border-l-success"
                        }`}
                      >
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
                        <td className="p-3 tabular-nums">{accountOpen.length}</td>
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
                        <td className="p-3 text-xs text-muted tabular-nums">{days}d</td>
                        <td className="p-3">
                          <StatusChip variant={risky ? "at-risk" : "on-track"}>
                            {risky ? "At risk" : "On track"}
                          </StatusChip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </section>

          {recentActivity.length > 0 && (
            <section>
              <SectionHeader>Recent activity</SectionHeader>
              <Card className="divide-y divide-border">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {accountNameByEntity.get(a.entityId) ?? "Account"}
                        </span>
                        <span className="text-muted"> · {a.action.replaceAll("_", " ")}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          )}
        </>
      )}

      {user.role === "tam" && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <KpiCard label="Open cases" value={tamOpen.length} icon={Briefcase} />
            <KpiCard
              label="High priority"
              value={tamHigh.length}
              icon={AlertTriangle}
              trend="down"
            />
            <KpiCard label="Approaching SLA" value={tamSla.length} icon={Clock} />
          </div>
          <TamCaseList cases={myCases} />
        </>
      )}

      {user.role === "sales_manager" && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <KpiCard
              label="Total team pipeline"
              value={formatEuro(teamPipeline)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Weighted pipeline"
              value={formatEuro(weightedPipeline)}
              icon={TrendingUp}
              trend="up"
            />
            <KpiCard
              label="Stalled deals"
              value={atRiskDeals.length}
              icon={AlertTriangle}
              trend="down"
            />
            <KpiCard label="Pending approvals" value={pendingApprovals.length} icon={Clock} />
          </div>

          <section className="mb-8">
            <SectionHeader>Stalled deals · 14+ days</SectionHeader>
            <div className="grid gap-3 md:grid-cols-2">
              {atRiskDeals.slice(0, 6).map((deal) => (
                <Link key={deal.id} href={`/deals?deal=${deal.id}`}>
                  <Card hover className="border-l-4 border-l-warning p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <StatusChip variant="at-risk">At risk</StatusChip>
                      <span className="text-sm text-muted">{deal.account.name}</span>
                    </div>
                    <p className="font-medium">{deal.title}</p>
                    <div className="mt-2 flex gap-4 text-xs text-muted">
                      <span className="font-mono tabular-nums">
                        {formatEuro(dealTotalValue(deal.quarterlyForecast))}
                      </span>
                      <span>Rep: {deal.owner.name}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader>Approval queue</SectionHeader>
            <ApprovalQueue approvals={pendingApprovals} />
          </section>
        </>
      )}

      {user.role === "finance" && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <KpiCard
              label="Total team pipeline"
              value={formatEuro(teamPipeline)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Weighted pipeline"
              value={formatEuro(weightedPipeline)}
              icon={TrendingUp}
              trend="up"
            />
            <KpiCard label="Stalled deals" value={atRiskDeals.length} icon={AlertTriangle} />
            <KpiCard label="Pending approvals" value={pendingApprovals.length} icon={Clock} />
          </div>

          <section className="mb-8">
            <SectionHeader
              action={
                <Link href="/forecast" className="text-xs text-accent hover:underline">
                  Open forecast →
                </Link>
              }
            >
              Stalled deals · 14+ days
            </SectionHeader>
            <div className="grid gap-3 md:grid-cols-2">
              {atRiskDeals.slice(0, 4).map((deal) => (
                <Link key={deal.id} href={`/deals?deal=${deal.id}`}>
                  <Card hover className="border-l-4 border-l-warning p-4">
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-sm text-muted">{deal.account.name}</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                      {formatEuro(dealTotalValue(deal.quarterlyForecast))}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader>Pending finance approvals</SectionHeader>
            <ApprovalQueue approvals={pendingApprovals} />
          </section>
        </>
      )}
    </div>
  );
}
