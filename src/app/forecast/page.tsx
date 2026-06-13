"use client";

import { ForecastChart } from "@/components/forecast/forecast-chart";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/fetch-client";
import { formatEuro } from "@/lib/format";
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

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [narrative, setNarrative] = useState("");

  useEffect(() => {
    fetchJson<ForecastData>("/api/forecast", {
      chart: [],
      totalPipeline: 0,
      weightedPipeline: 0,
      stalled: [],
    }).then(setData);
  }, []);

  async function regenerate() {
    if (!data) return;
    const res = await fetch("/api/ai/forecast-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: {
          totalPipeline: data.totalPipeline,
          weightedPipeline: data.weightedPipeline,
          stalled: data.stalled.length,
        },
      }),
    });
    const json = await res.json();
    setNarrative(json.narrative ?? "");
  }

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

  if (!data) return <div className="p-6 text-muted">Loading forecast…</div>;

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
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted">Total pipeline</p>
          <p className="font-mono text-2xl tabular-nums">{formatEuro(data.totalPipeline)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted">Weighted pipeline</p>
          <p className="font-mono text-2xl tabular-nums text-accent">
            {formatEuro(data.weightedPipeline)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted">Stalled deals</p>
          <p className="font-mono text-2xl tabular-nums text-warning">{data.stalled.length}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">AI pipeline narrative</h2>
          <button
            type="button"
            onClick={regenerate}
            className="text-xs text-accent hover:underline"
          >
            Regenerate
          </button>
        </div>
        <p className="text-sm text-muted">
          {narrative || "Click regenerate for an AI summary of pipeline health."}
        </p>
      </div>

      <ForecastChart data={data.chart} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Pending finance approvals</h2>
        <p className="text-sm text-muted">
          Approve discounted offers from the deals pipeline or manager dashboard.
        </p>
      </section>
    </div>
  );
}
