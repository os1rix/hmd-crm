"use client";

import type { SessionUser } from "@/lib/session";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", roles: ["sales_rep", "tam", "sales_manager", "finance"] },
  { href: "/accounts", label: "Accounts", roles: ["sales_rep", "sales_manager"] },
  { href: "/deals", label: "Pipeline", roles: ["sales_rep", "sales_manager"] },
  { href: "/cases", label: "Cases", roles: ["tam", "sales_manager"] },
  { href: "/catalog", label: "Catalog", roles: ["finance", "sales_rep"] },
  { href: "/forecast", label: "Forecast", roles: ["finance", "sales_manager"] },
];

export function Sidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();

  if (!user) return null;

  const items = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">HMD Secure</p>
        <h1 className="text-lg font-semibold">CRM Command</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-accent-muted text-accent"
                  : "text-muted hover:bg-card hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
