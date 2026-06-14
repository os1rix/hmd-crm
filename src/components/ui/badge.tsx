import { StatusChip, type StatusChipVariant } from "./status-chip";

const BADGE_TO_CHIP: Record<string, StatusChipVariant> = {
  default: "normal",
  warning: "at-risk",
  success: "on-track",
  danger: "high",
  accent: "open",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "danger" | "accent";
}) {
  return <StatusChip variant={BADGE_TO_CHIP[variant]}>{children}</StatusChip>;
}
