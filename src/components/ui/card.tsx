export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`border border-card-border ${
        hover ? "transition-all duration-150 hover:-translate-y-px hover:border-card-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
