import { formatToday, roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/session";

export function DashboardHeader({
  user,
  stat,
}: {
  user: SessionUser;
  stat: { label: string; value: string };
}) {
  return (
    <div className="mb-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="mt-0.5 text-sm text-muted">{roleLabel(user.role)} dashboard</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{formatToday()}</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-accent">
            {stat.value}
          </p>
          <p className="text-[11px] text-muted">{stat.label}</p>
        </div>
      </div>
    </div>
  );
}
