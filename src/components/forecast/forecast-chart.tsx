"use client";

import { formatEuro } from "@/lib/format";

type ChartRow = {
  quarter: string;
  device: number;
  service: number;
  weightedDevice: number;
  weightedService: number;
};

export function ForecastChart({ data }: { data: ChartRow[] }) {
  const max = Math.max(...data.map((d) => d.weightedDevice + d.weightedService), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-end gap-2 overflow-x-auto pb-2">
        {data.map((row) => {
          const deviceH = (row.weightedDevice / max) * 200;
          const serviceH = (row.weightedService / max) * 200;
          return (
            <div key={row.quarter} className="flex min-w-[56px] flex-col items-center gap-2">
              <div className="flex h-[200px] items-end gap-0.5">
                <div
                  className="w-5 rounded-t bg-accent"
                  style={{ height: `${deviceH}px` }}
                  title={`Device ${formatEuro(row.weightedDevice)}`}
                />
                <div
                  className="w-5 rounded-t bg-teal"
                  style={{ height: `${serviceH}px` }}
                  title={`Service ${formatEuro(row.weightedService)}`}
                />
              </div>
              <span className="font-mono text-[10px] text-muted">{row.quarter}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-accent" /> Device (weighted)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-teal" /> Service (weighted)
        </span>
      </div>
    </div>
  );
}
