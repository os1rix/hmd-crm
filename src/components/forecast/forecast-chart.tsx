"use client";

import { type PeriodChartRow, groupMonthsByYear, shortMonthLabel } from "@/lib/forecast-periods";
import {
  type RegressionResult,
  formatSlopePerMonth,
  linearRegression,
  regressionLine,
} from "@/lib/forecast-stats";
import { formatEuro } from "@/lib/format";
import { Fragment, useMemo } from "react";

export type TrendMetric = "total" | "device" | "service";

const CHART_HEIGHT = 240;
const BAR_WIDTH = 8;
const MONTH_GAP = 2;
const QUARTER_GAP = BAR_WIDTH;
const YEAR_GAP = BAR_WIDTH;

const COLORS = {
  device: "#e4ff00",
  service: "#06b6d4",
  trendTotal: "#f97316",
  trendDevice: "#e4ff00",
  trendService: "#06b6d4",
};

function rowValue(row: PeriodChartRow, metric: TrendMetric): number {
  if (metric === "device") return row.device;
  if (metric === "service") return row.service;
  return row.device + row.service;
}

export function ForecastChart({
  data,
  showTrends = false,
  trendMetrics = ["total"],
}: {
  data: PeriodChartRow[];
  showTrends?: boolean;
  trendMetrics?: TrendMetric[];
}) {
  const yearGroups = useMemo(() => groupMonthsByYear(data), [data]);
  const flatRows = useMemo(
    () => yearGroups.flatMap((y) => y.quarters.flatMap((q) => q.rows)),
    [yearGroups],
  );

  const max = useMemo(() => {
    const values = flatRows.map((row) => row.device + row.service);
    return Math.max(...values, 1);
  }, [flatRows]);

  const regressions = useMemo(() => {
    const result: Partial<Record<TrendMetric, RegressionResult>> = {};
    for (const metric of trendMetrics) {
      const points = flatRows.map((row, i) => ({
        x: i,
        y: rowValue(row, metric),
      }));
      result[metric] = linearRegression(points);
    }
    return result;
  }, [flatRows, trendMetrics]);

  const trendPaths = useMemo(() => {
    if (!showTrends) return [];
    const n = flatRows.length;

    return trendMetrics
      .map((metric) => {
        const reg = regressions[metric];
        if (!reg) return null;
        const line = regressionLine(n, reg);
        const color =
          metric === "total"
            ? COLORS.trendTotal
            : metric === "device"
              ? COLORS.trendDevice
              : COLORS.trendService;

        const points = line
          .map((value, i) => {
            const x = i + 0.5;
            const y = CHART_HEIGHT - (Math.max(0, value) / max) * CHART_HEIGHT;
            return `${x},${y}`;
          })
          .join(" ");

        return { metric, color, points, reg };
      })
      .filter(Boolean) as Array<{
      metric: TrendMetric;
      color: string;
      points: string;
      reg: RegressionResult;
    }>;
  }, [showTrends, flatRows.length, trendMetrics, regressions, max]);

  return (
    <div className="border border-card-border bg-surface/20 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-section">
          Monthly revenue projection
        </h3>
        <div className="flex flex-wrap gap-4 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.device }} />
            Device
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.service }} />
            Service
          </span>
        </div>
      </div>

      {/* Year headers */}
      <div className="mb-1 flex w-full">
        {yearGroups.map((yearGroup, yi) => (
          <Fragment key={yearGroup.year}>
            {yi > 0 && <div className="shrink-0" style={{ width: YEAR_GAP }} aria-hidden />}
            <div
              className={`flex min-w-0 flex-1 items-center justify-center py-1 text-[11px] font-medium uppercase tracking-widest text-section ${
                yi > 0 ? "border-l border-border/50" : ""
              }`}
            >
              FY {yearGroup.year}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Quarter sub-headers */}
      <div className="mb-2 flex w-full">
        {yearGroups.map((yearGroup, yi) => (
          <Fragment key={yearGroup.year}>
            {yi > 0 && <div className="shrink-0" style={{ width: YEAR_GAP }} aria-hidden />}
            <div className="flex min-w-0 flex-1">
              {yearGroup.quarters.map((quarterGroup, qi) => (
                <Fragment key={`${yearGroup.year}-Q${quarterGroup.quarter}`}>
                  {qi > 0 && (
                    <div className="shrink-0" style={{ width: QUARTER_GAP }} aria-hidden />
                  )}
                  <div
                    className={`flex min-w-0 flex-1 items-center justify-center py-0.5 text-[10px] uppercase tracking-wide text-muted/80 ${
                      qi > 0 ? "border-l border-border/30" : ""
                    }`}
                  >
                    {quarterGroup.label}
                  </div>
                </Fragment>
              ))}
            </div>
          </Fragment>
        ))}
      </div>

      <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
        {showTrends && trendPaths.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox={`0 0 ${flatRows.length} ${CHART_HEIGHT}`}
            aria-hidden="true"
          >
            <title>Trend lines</title>
            {trendPaths.map(({ metric, color, points }) => (
              <polyline
                key={metric}
                fill="none"
                stroke={color}
                strokeWidth={0.08}
                strokeDasharray="0.25 0.18"
                vectorEffect="non-scaling-stroke"
                points={points}
              />
            ))}
          </svg>
        )}

        <div className="flex h-full w-full items-end">
          {yearGroups.map((yearGroup, yi) => (
            <Fragment key={yearGroup.year}>
              {yi > 0 && <div className="shrink-0" style={{ width: YEAR_GAP }} aria-hidden />}
              <div className="flex min-w-0 flex-1 items-end">
                {yearGroup.quarters.map((quarterGroup, qi) => (
                  <Fragment key={`${yearGroup.year}-bars-Q${quarterGroup.quarter}`}>
                    {qi > 0 && (
                      <div className="shrink-0" style={{ width: QUARTER_GAP }} aria-hidden />
                    )}
                    <div
                      className={`flex min-w-0 flex-1 items-end rounded-sm bg-surface/15 px-0.5 pt-1 ${
                        qi > 0 ? "border-l border-border/40" : ""
                      }`}
                      style={{ gap: MONTH_GAP, height: CHART_HEIGHT }}
                    >
                      {quarterGroup.rows.map((row) => {
                        const deviceH = (row.device / max) * (CHART_HEIGHT - 20);
                        const serviceH = (row.service / max) * (CHART_HEIGHT - 20);

                        return (
                          <div
                            key={row.period}
                            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                            title={`${row.period}: ${formatEuro(row.device + row.service)}`}
                          >
                            <div
                              className="flex w-full max-w-[14px] flex-col-reverse gap-px"
                              style={{ height: CHART_HEIGHT - 22 }}
                            >
                              <div
                                className="rounded-t-sm"
                                style={{
                                  height: deviceH,
                                  background: COLORS.device,
                                  minHeight: row.device > 0 ? 2 : 0,
                                }}
                              />
                              <div
                                className="rounded-t-sm"
                                style={{
                                  height: serviceH,
                                  background: COLORS.service,
                                  minHeight: row.service > 0 ? 2 : 0,
                                }}
                              />
                            </div>
                            <span className="truncate font-mono text-[9px] text-muted">
                              {shortMonthLabel(row.period)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {showTrends && trendPaths.length > 0 && (
        <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
          {trendPaths.map(({ metric, color, reg }) => (
            <div key={metric} className="text-xs">
              <span className="font-medium uppercase tracking-wide" style={{ color }}>
                {metric} trend
              </span>
              <p className="mt-0.5 font-mono tabular-nums text-muted">
                {formatSlopePerMonth(reg.slope)} · R² = {reg.r2.toFixed(3)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
