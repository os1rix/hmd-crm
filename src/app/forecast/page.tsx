"use client";

import { ApprovalQueue } from "@/components/dashboard/approval-queue";
import { NarrativeCard } from "@/components/dashboard/narrative-card";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/fetch-client";
import { formatEuro } from "@/lib/format";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type ForecastData = {
  chart: Array<{
    quarter: string;
    device: number;
    service: number;
    weightedDevice: number;
    weightedService: number;
  }>;
  totalPipeline: number;
  weightedPipeline: number;
  stalled: Array<{ id: string; title: string; account: { name: string } }>;
};

type Approval = {
  id: string;
  offer: {
    id: string;
    total: string;
    discountPercent: string | null;
    account: { name: string };
    deal: { id: string; title: string } | null;
    createdBy: { name: string } | null;
  };
};

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    fetchJson<ForecastData>("/api/forecast", {
      chart: [],
      totalPipeline: 0,
      weightedPipeline: 0,
      stalled: [],
    }).then(setData);

    fetch("/api/offers")
      .then((r) => r.json())
      .then((json) => {
        const rows = json.data ?? json;
        const pending = rows.flatMap(
          (o: {
            id: string;
            approvals: Array<{ id: string; approverRole: string; status: string }>;
            account: { name: string };
            deal: { id: string; title: string } | null;
            total: string;
            discountPercent: string | null;
            createdBy: { name: string } | null;
          }) =>
            o.approvals
              .filter((a) => a.status === "pending" && a.approverRole === "finance")
              .map((a) => ({
                id: a.id,
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
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Quarter", "Device", "Service", "Weighted Device", "Weighted Service"],
      ...data.chart.map((r) => [
        r.quarter,
        r.device,
        r.service,
        r.weightedDevice,
        r.weightedService,
      ]),
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">3-year weighted forecast</h1>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <KpiCard label="Total pipeline" value={formatEuro(data.totalPipeline)} icon={TrendingUp} />
        <KpiCard
          label="Weighted pipeline"
          value={formatEuro(data.weightedPipeline)}
          icon={TrendingUp}
          trend="up"
        />
        <KpiCard
          label="Stalled deals"
          value={data.stalled.length}
          icon={AlertTriangle}
          trend="down"
        />
      </div>

      <NarrativeCard
        summary={{
          totalPipeline: data.totalPipeline,
          weightedPipeline: data.weightedPipeline,
          stalled: data.stalled.length,
        }}
      />

      <ForecastChart data={data.chart} />

      <section className="mt-8">
        <SectionHeader>Pending finance approvals</SectionHeader>
        <ApprovalQueue approvals={approvals} />
      </section>
    </div>
  );
}
