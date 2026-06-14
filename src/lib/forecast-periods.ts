import { quarterSortKey, sortQuarters } from "@/lib/quarters";

export type ForecastEntry = {
  quarter: string;
  deviceRevenue: number;
  serviceRevenue: number;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function isMonthlyPeriod(period: string): boolean {
  return MONTHS.some((m) => period.startsWith(`${m} `));
}

export function monthSortKey(period: string): number {
  const match = period.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/);
  if (!match) return 0;
  const month = MONTHS.indexOf(match[1] as (typeof MONTHS)[number]) + 1;
  const year = Number.parseInt(match[2], 10);
  return year * 100 + month;
}

export function periodToQuarter(period: string): string {
  if (!isMonthlyPeriod(period)) return period;
  const match = period.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/);
  if (!match) return period;
  const month = MONTHS.indexOf(match[1] as (typeof MONTHS)[number]) + 1;
  return `Q${Math.ceil(month / 3)} ${match[2]}`;
}

export function sortPeriods<T extends { period: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => periodSortKey(a.period) - periodSortKey(b.period));
}

function periodSortKey(period: string): number {
  if (isMonthlyPeriod(period)) return monthSortKey(period);
  return quarterSortKey(period) * 100;
}

export function aggregateToQuarters(entries: ForecastEntry[]): ForecastEntry[] {
  const totals = new Map<string, { device: number; service: number }>();
  for (const entry of entries) {
    const key = periodToQuarter(entry.quarter);
    const bucket = totals.get(key) ?? { device: 0, service: 0 };
    bucket.device += entry.deviceRevenue;
    bucket.service += entry.serviceRevenue;
    totals.set(key, bucket);
  }
  return sortQuarters(
    [...totals.entries()].map(([quarter, values]) => ({
      quarter,
      deviceRevenue: values.device,
      serviceRevenue: values.service,
    })),
  );
}

export type PeriodChartRow = {
  period: string;
  device: number;
  service: number;
};

export function aggregateChartRows(
  entries: ForecastEntry[],
  granularity: "month" | "quarter",
): PeriodChartRow[] {
  const totals = new Map<string, { device: number; service: number }>();
  for (const entry of entries) {
    const key = granularity === "quarter" ? periodToQuarter(entry.quarter) : entry.quarter;
    const bucket = totals.get(key) ?? { device: 0, service: 0 };
    bucket.device += entry.deviceRevenue;
    bucket.service += entry.serviceRevenue;
    totals.set(key, bucket);
  }

  return sortPeriods(
    [...totals.entries()].map(([period, values]) => ({
      period,
      device: values.device,
      service: values.service,
    })),
  );
}

export function groupMonthsByYear(rows: PeriodChartRow[]): Array<{
  year: number;
  quarters: Array<{ quarter: number; label: string; rows: PeriodChartRow[] }>;
}> {
  const sorted = sortPeriods(rows);
  const years = new Map<number, Map<number, PeriodChartRow[]>>();

  for (const row of sorted) {
    const match = row.period.match(
      /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/,
    );
    if (!match) continue;
    const year = Number.parseInt(match[1], 10);
    const month = monthSortKey(row.period) % 100;
    const q = Math.ceil(month / 3);
    if (!years.has(year)) years.set(year, new Map());
    const yearMap = years.get(year)!;
    if (!yearMap.has(q)) yearMap.set(q, []);
    yearMap.get(q)!.push(row);
  }

  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, quarterMap]) => ({
      year,
      quarters: [...quarterMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([quarter, qRows]) => ({
          quarter,
          label: `Q${quarter}`,
          rows: qRows,
        })),
    }));
}

export function expandQuarterlyToMonthly(entries: ForecastEntry[]): ForecastEntry[] {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const result: ForecastEntry[] = [];

  for (const entry of entries) {
    const match = entry.quarter.match(/^Q([1-4])\s+(\d{4})$/);
    if (!match) {
      result.push(entry);
      continue;
    }

    const quarter = Number.parseInt(match[1], 10);
    const year = match[2];
    const startMonth = (quarter - 1) * 3;
    const deviceParts = splitAmount(entry.deviceRevenue, 3);
    const serviceParts = splitAmount(entry.serviceRevenue, 3);

    for (let i = 0; i < 3; i++) {
      result.push({
        quarter: `${monthNames[startMonth + i]} ${year}`,
        deviceRevenue: deviceParts[i],
        serviceRevenue: serviceParts[i],
      });
    }
  }

  return result;
}

function splitAmount(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function shortMonthLabel(period: string): string {
  return period.slice(0, 3);
}
