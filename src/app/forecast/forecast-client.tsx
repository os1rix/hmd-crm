"use client";

import { ApprovalQueue } from "@/components/dashboard/approval-queue";
import { NarrativeCard } from "@/components/dashboard/narrative-card";
import { ForecastChart, type TrendMetric } from "@/components/forecast/forecast-chart";
import { CardMoney } from "@/components/ui/card-money";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/fetch-client";
import { formatEuro } from "@/lib/format";
import { MONEY } from "@/lib/money-labels";
import { sortQuarters } from "@/lib/quarters";
import type { SessionUser } from "@/lib/session";
import { AlertTriangle, Briefcase, LineChart, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ForecastData = {
  monthlyChart: Array<{ period: string; device: number; service: number }>;
  quarterlyChart: Array<{ period: string; device: number; service: number }>;
  totalPipeline: number;
  openDeals: number;
  stalled: Array<{ id: string; title: string; account: { name: string } }>;
};

type Approval = {
  id: string;
  approverRole: string;
  status: string;
  offer: {
    id: string;
    total: string;
    discountPercent: string | null;
    account: { name: string };
    deal: { id: string; title: string } | null;
    createdBy: { name: string } | null;
  };
};

const TREND_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: "total", label: "Total revenue" },
  { value: "device", label: "Device" },
  { value: "service", label: "Service" },
];

export default function ForecastPageClient({
  userRole,
}: {
  userRole: SessionUser["role"] | null;
}) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [showTrends, setShowTrends] = useState(true);
  const [trendMetrics, setTrendMetrics] = useState<TrendMetric[]>(["total", "device"]);

  useEffect(() => {
    fetchJson<ForecastData>("/api/forecast", {
      monthlyChart: [],
      quarterlyChart: [],
      totalPipeline: 0,
      openDeals: 0,
      stalled: [],
    }).then(setData);

    fetch("/api/offers")
      .then((r) => r.json())
      .then((json) => {
        const rows = json.data ?? json;
        const pending = rows.flatMap(
          (o: {
            id: string;
            approvals: Array<{
              id: string;
              approverRole: string;
              status: string;
            }>;
            account: { name: string };
            deal: { id: string; title: string } | null;
            total: string;
            discountPercent: string | null;
            createdBy: { name: string } | null;
          }) =>
            o.approvals
              .filter((a) => a.status === "pending" && a.approverRole === userRole)
              .map((a) => ({
                id: a.id,
                approverRole: a.approverRole,
                status: a.status,
                offer: {
                  id: o.id,
                  total: o.total,
                  discountPercent: o.discountPercent,
                  account: o.account,
                  deal: o.deal,
                  createdBy: o.createdBy,
                },
              })),
        );
        setApprovals(pending);
      })
      .catch(() => setApprovals([]));
  }, [userRole]);

  const sortedQuarterly = useMemo(
    () =>
      data
        ? sortQuarters(
            data.quarterlyChart.map((r) => ({
              quarter: r.period,
              device: r.device,
              service: r.service,
            })),
          )
        : [],
    [data],
  );

  const yearTotals = useMemo(() => {
    const totals = new Map<number, number>();
    for (const row of sortedQuarterly) {
      const year = Number.parseInt(row.quarter.match(/(\d{4})/)?.[1] ?? "0", 10);
      totals.set(year, (totals.get(year) ?? 0) + row.device + row.service);
    }
    return [...totals.entries()].sort(([a], [b]) => a - b);
  }, [sortedQuarterly]);

  function toggleTrendMetric(metric: TrendMetric) {
    setTrendMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric],
    );
  }

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Quarter", "Device", "Service", "Total"],
      ...sortedQuarterly.map((r) => [r.quarter, r.device, r.service, r.device + r.service]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hmd-forecast.csv";
    a.click();
  }

  if (!data) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">3-year forecast</h1>
          <p className="mt-1 text-sm text-muted">
            Quarterly pipeline totals · monthly detail in chart above
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="border border-border px-4 py-2 text-sm hover:border-accent"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <KpiCard
          label={MONEY.teamPipeline.label}
          value={formatEuro(data.totalPipeline)}
          hint={MONEY.teamPipeline.hint}
          icon={TrendingUp}
        />
        <KpiCard label="Open deals" value={data.openDeals} icon={Briefcase} />
        <KpiCard
          label="Stalled deals"
          value={data.stalled.length}
          icon={AlertTriangle}
          trend="down"
        />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {yearTotals.map(([year, total]) => (
          <div key={year} className="border border-border bg-surface/30 px-4 py-3">
            <CardMoney
              amount={total}
              label={`${MONEY.fyPipeline.label} ${year}`}
              hint={MONEY.fyPipeline.hint}
              size="lg"
            />
          </div>
        ))}
      </div>

      <NarrativeCard
        summary={{
          totalPipeline: data.totalPipeline,
          openDeals: data.openDeals,
          stalled: data.stalled.length,
        }}
      />

      <div className="mb-4 mt-6 flex flex-wrap items-end gap-4 border border-border bg-surface/30 p-4">
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-section">
            Regression / trend
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTrends}
              onChange={(e) => setShowTrends(e.target.checked)}
              className="accent-accent"
            />
            <LineChart className="h-4 w-4 text-muted" />
            Show trend lines
          </label>
        </div>

        {showTrends && (
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-section">Trend series</p>
            <div className="flex flex-wrap gap-1">
              {TREND_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleTrendMetric(value)}
                  className={`border px-3 py-1.5 text-xs ${
                    trendMetrics.includes(value)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ml-auto text-right text-xs text-muted">
          <p>
            {data.monthlyChart.length} months · {sortedQuarterly.length} quarters · {data.openDeals}{" "}
            open deals
          </p>
        </div>
      </div>

      <ForecastChart data={data.monthlyChart} showTrends={showTrends} trendMetrics={trendMetrics} />

      <section className="mt-6">
        <SectionHeader>Quarterly breakdown</SectionHeader>
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/40 text-section">
                <th className="p-2 font-medium uppercase tracking-wide">Quarter</th>
                <th className="p-2 font-medium uppercase tracking-wide">Device</th>
                <th className="p-2 font-medium uppercase tracking-wide">Service</th>
                <th className="p-2 font-medium uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedQuarterly.map((row) => (
                <tr key={row.quarter} className="border-b border-border/60 font-mono tabular-nums">
                  <td className="p-2 text-foreground">{row.quarter}</td>
                  <td className="p-2 text-accent">{formatEuro(row.device)}</td>
                  <td className="p-2 text-[#06b6d4]">{formatEuro(row.service)}</td>
                  <td className="p-2 font-medium">{formatEuro(row.device + row.service)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(userRole === "sales_manager" || userRole === "finance") && (
        <section className="mt-8">
          <SectionHeader>
            {userRole === "sales_manager" ? "Pending approvals" : "Pending finance approvals"}
          </SectionHeader>
          <ApprovalQueue approvals={approvals} userRole={userRole} />
        </section>
      )}
    </div>
  );
}
