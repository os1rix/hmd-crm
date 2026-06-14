import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  className = "",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  const trendColor =
    trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted";

  return (
    <Card className={`relative p-4 ${className}`}>
      {Icon && <Icon className="absolute right-4 top-4 h-4 w-4 text-muted" />}
      <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
      {trend && (
        <span className={`mt-2 inline-block text-xs ${trendColor}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
        </span>
      )}
    </Card>
  );
}
