export function SectionHeader({
  children,
  action,
  className = "",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      <h2 className="text-[13px] font-medium uppercase tracking-widest text-section">{children}</h2>
      {action}
    </div>
  );
}
