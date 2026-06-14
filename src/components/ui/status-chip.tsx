const VARIANTS = {
  "at-risk": "border-warning text-warning",
  "on-track": "border-success text-success",
  high: "border-danger text-danger",
  medium: "border-warning text-warning",
  normal: "border-border text-muted",
  escalated: "border-border text-dirty-white",
  won: "border-success bg-success/20 text-success",
  lost: "border-danger/50 bg-danger/10 text-danger/70",
  open: "border-accent text-accent",
  "in-progress": "border-accent text-accent",
  resolved: "border-success text-success",
  closed: "border-border text-muted",
} as const;

export type StatusChipVariant = keyof typeof VARIANTS;

export function StatusChip({
  children,
  variant = "normal",
}: {
  children: React.ReactNode;
  variant?: StatusChipVariant;
}) {
  const filled = variant === "escalated" || variant === "won" || variant === "lost";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
        filled ? "" : "bg-transparent"
      } border ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
