/** Parse "Q1 2025" → sortable index. */
export function quarterSortKey(quarter: string): number {
  const match = quarter.match(/Q(\d)\s+(\d{4})/i);
  if (!match) return 0;
  const q = Number.parseInt(match[1], 10);
  const year = Number.parseInt(match[2], 10);
  return year * 10 + q;
}

export function sortQuarters<T extends { quarter: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => quarterSortKey(a.quarter) - quarterSortKey(b.quarter));
}

export function groupQuartersByYear<T extends { quarter: string }>(
  rows: T[],
): Array<{ year: number; rows: T[] }> {
  const sorted = sortQuarters(rows);
  const groups: Array<{ year: number; rows: T[] }> = [];
  for (const row of sorted) {
    const year = Number.parseInt(row.quarter.match(/(\d{4})/)?.[1] ?? "0", 10);
    const last = groups[groups.length - 1];
    if (last?.year === year) {
      last.rows.push(row);
    } else {
      groups.push({ year, rows: [row] });
    }
  }
  return groups;
}
