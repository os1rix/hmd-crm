import { InfoTip } from "@/components/ui/info-tip";
import { formatEuro } from "@/lib/format";

export function CardMoney({
  amount,
  label,
  hint,
  size = "sm",
  align = "left",
  className = "",
}: {
  amount: number | string | null | undefined;
  label: string;
  hint: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  className?: string;
}) {
  const sizeClass = size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm";

  return (
    <div className={`${align === "right" ? "text-right" : ""} ${className}`}>
      <div
        className={`mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted ${
          align === "right" ? "justify-end" : ""
        }`}
      >
        <span>{label}</span>
        <InfoTip text={hint} />
      </div>
      <p className={`font-mono font-semibold tabular-nums text-accent ${sizeClass}`}>
        {formatEuro(amount)}
      </p>
    </div>
  );
}
