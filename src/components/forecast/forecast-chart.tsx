"use client";

import { formatEuro } from "@/lib/format";
import { groupQuartersByYear } from "@/lib/quarters";

type ChartRow = {
  quarter: string;
  device: number;
  service: number;
  weightedDevice: number;
  weightedService: number;
};

export function ForecastChart({ data }: { data: ChartRow[] }) {
  const groups = groupQuartersByYear(data);
  const max = Math.max(...data.map((d) => d.weightedDevice + d.weightedService), 1);

  return (
    <div className="rounded-lg border border-card-border p-6">
      <div className="overflow-x-auto pb-2">
        {groups.map((group) => (
          <div key={group.year} className="mb-6 last:mb-0">
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-section">
              {group.year}
            </p>
            <div className="flex items-end gap-2">
              {group.rows.map((row) => {
                const deviceH = (row.weightedDevice / max) * 200;
                const serviceH = (row.weightedService / max) * 200;
                return (
                  <div key={row.quarter} className="flex min-w-[48px] flex-col items-center gap-2">
                    <div className="flex h-[200px] items-end gap-0.5">
                      <div
                        className="w-5 rounded-t bg-accent"
                        style={{ height: `${deviceH}px` }}
                        title={`Device ${formatEuro(row.weightedDevice)}`}
                      />
                      <div
                        className="w-5 rounded-t border border-dirty-white/40 bg-transparent"
                        style={{ height: `${serviceH}px` }}
                        title={`Service ${formatEuro(row.weightedService)}`}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      {row.quarter.replace(` ${group.year}`, "")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-accent" /> Device (weighted)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded border border-dirty-white/40" /> Service (weighted)
        </span>
      </div>
    </div>
  );
}
