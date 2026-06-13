export function formatEuro(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelative(value: Date | string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    sales_rep: "Sales Rep",
    tam: "TAM",
    sales_manager: "Sales Manager",
    finance: "Finance",
  };
  return labels[role] ?? role;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
