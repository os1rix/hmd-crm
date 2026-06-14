/** Parse YYYY-MM-DD from filter inputs as UTC day boundaries. */
export function parseFilterDateStart(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function parseFilterDateEnd(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
