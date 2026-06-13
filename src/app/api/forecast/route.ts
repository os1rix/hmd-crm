import { db } from "@/db";
import { deals } from "@/db/schema";
import type { QuarterlyForecastEntry } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api";
import { STAGE_PROBABILITY, dealTotalValue } from "@/lib/deals";

export async function GET() {
  try {
    const rows = await db.query.deals.findMany({
      with: { account: true, owner: true },
    });

    const quarters = new Map<
      string,
      { device: number; service: number; weightedDevice: number; weightedService: number }
    >();

    for (const deal of rows) {
      if (deal.stage === "lost") continue;
      const prob = STAGE_PROBABILITY[deal.stage];
      const forecast = (deal.quarterlyForecast ?? []) as QuarterlyForecastEntry[];
      for (const q of forecast) {
        const existing = quarters.get(q.quarter) ?? {
          device: 0,
          service: 0,
          weightedDevice: 0,
          weightedService: 0,
        };
        existing.device += q.deviceRevenue;
        existing.service += q.serviceRevenue;
        existing.weightedDevice += q.deviceRevenue * prob;
        existing.weightedService += q.serviceRevenue * prob;
        quarters.set(q.quarter, existing);
      }
    }

    const chart = [...quarters.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, values]) => ({ quarter, ...values }));

    const totalPipeline = rows.reduce((sum, d) => sum + dealTotalValue(d.quarterlyForecast), 0);
    const weightedPipeline = rows.reduce(
      (sum, d) => sum + dealTotalValue(d.quarterlyForecast) * STAGE_PROBABILITY[d.stage],
      0,
    );
    const stalled = rows.filter((d) => {
      const days = Math.floor(
        (Date.now() - new Date(d.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return days >= 14 && d.stage !== "won" && d.stage !== "lost";
    });

    return apiSuccess({ chart, totalPipeline, weightedPipeline, stalled, deals: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch forecast";
    return apiError(message);
  }
}
