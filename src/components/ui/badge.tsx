export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "danger" | "accent";
}) {
  const styles = {
    default: "bg-card border-border text-muted",
    warning: "bg-warning/15 text-warning border-warning/30",
    success: "bg-success/15 text-success border-success/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    accent: "bg-accent-muted text-accent border-accent/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
