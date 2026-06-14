import { db } from "@/db";
import type { QuarterlyForecastEntry } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api";
import { dealTotalValue } from "@/lib/deals";
import { aggregateChartRows } from "@/lib/forecast-periods";

export async function GET() {
  try {
    const rows = await db.query.deals.findMany({
      with: { account: true, owner: true },
    });

    const allEntries: QuarterlyForecastEntry[] = [];
    for (const deal of rows) {
      if (deal.stage === "lost") continue;
      allEntries.push(...((deal.quarterlyForecast ?? []) as QuarterlyForecastEntry[]));
    }

    const monthlyChart = aggregateChartRows(allEntries, "month");
    const quarterlyChart = aggregateChartRows(allEntries, "quarter");

    const totalPipeline = rows
      .filter((d) => d.stage !== "lost")
      .reduce((sum, d) => sum + dealTotalValue(d.quarterlyForecast), 0);

    const openDeals = rows.filter((d) => d.stage !== "won" && d.stage !== "lost").length;

    const stalled = rows.filter((d) => {
      const days = Math.floor(
        (Date.now() - new Date(d.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return days >= 14 && d.stage !== "won" && d.stage !== "lost";
    });

    return apiSuccess({
      monthlyChart,
      quarterlyChart,
      totalPipeline,
      openDeals,
      stalled,
      deals: rows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch forecast";
    return apiError(message);
  }
}
