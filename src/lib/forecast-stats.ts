export type RegressionResult = {
  slope: number;
  intercept: number;
  r2: number;
};

export function linearRegression(points: { x: number; y: number }[]): RegressionResult {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumYY = points.reduce((s, p) => s + p.y * p.y, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const ssTot = sumYY - (sumY * sumY) / n;
  const ssRes = points.reduce((s, p) => {
    const pred = slope * p.x + intercept;
    return s + (p.y - pred) ** 2;
  }, 0);
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

export function regressionLine(count: number, { slope, intercept }: RegressionResult): number[] {
  return Array.from({ length: count }, (_, i) => slope * i + intercept);
}

export function formatSlopePerQuarter(slope: number): string {
  const sign = slope >= 0 ? "+" : "−";
  return `${sign}${Math.abs(Math.round(slope)).toLocaleString("fi-FI")} €/qtr`;
}

export function formatSlopePerMonth(slope: number): string {
  const sign = slope >= 0 ? "+" : "−";
  return `${sign}${Math.abs(Math.round(slope)).toLocaleString("fi-FI")} €/mo`;
}
