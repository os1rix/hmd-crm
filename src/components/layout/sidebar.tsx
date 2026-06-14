"use client";

import { initials, roleLabel } from "@/lib/format";
import type { SessionUser } from "@/lib/session";
import { BarChart3, Building2, Grid3X3, Package, Ticket, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: Grid3X3,
    roles: ["sales_rep", "tam", "sales_manager", "finance"],
  },
  { href: "/accounts", label: "Accounts", icon: Building2, roles: ["sales_rep", "sales_manager"] },
  { href: "/deals", label: "Pipeline", icon: BarChart3, roles: ["sales_rep", "sales_manager"] },
  { href: "/cases", label: "Cases", icon: Ticket, roles: ["tam", "sales_manager"] },
  { href: "/catalog", label: "Catalog", icon: Package, roles: ["finance", "sales_rep"] },
  { href: "/forecast", label: "Forecast", icon: TrendingUp, roles: ["finance", "sales_manager"] },
];

export function Sidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();

  if (!user) return null;

  const items = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
        {items.map((item, i) => {
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const showDivider = i > 0 && item.href === "/cases";
          return (
            <div key={item.href}>
              {showDivider && <div className="my-2 border-t border-border" />}
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-r-lg border-l-2 px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-l-accent text-accent"
                    : "border-l-transparent text-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 text-xs font-semibold text-accent">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-[11px] text-muted">{roleLabel(user.role)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
