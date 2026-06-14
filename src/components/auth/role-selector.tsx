"use client";

import { Card } from "@/components/ui/card";
import { roleLabel } from "@/lib/format";
import { BarChart3, Building2, Calculator, Headphones, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserOption = { id: string; name: string; role: string };

const ROLE_META: Record<string, { icon: LucideIcon; description: string }> = {
  sales_rep: {
    icon: Building2,
    description: "Manage accounts, pipeline deals, and customer relationships.",
  },
  tam: {
    icon: Headphones,
    description: "Handle support cases, SLAs, and technical account issues.",
  },
  sales_manager: {
    icon: BarChart3,
    description: "Oversee team pipeline, stalled deals, and offer approvals.",
  },
  finance: {
    icon: Calculator,
    description: "Review forecasts, weighted pipeline, and finance approvals.",
  },
};

const ROLE_ORDER = ["sales_rep", "tam", "sales_manager", "finance"];

export function RoleSelector() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  async function selectUser(userId: string) {
    setBusy(userId);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const byRole = ROLE_ORDER.map((role) => ({
    role,
    users: users.filter((u) => u.role === role),
    meta: ROLE_META[role],
  }));

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="mb-10 max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">Welcome to HMD Secure CRM</h1>
        <p className="text-sm text-muted">
          Select a role to explore the demo environment. Each view is tailored to that
          function&apos;s workflow.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {byRole.map(({ role, users: roleUsers, meta }) => {
          const Icon = meta.icon;
          return (
            <Card
              key={role}
              className="group border-card-border p-6 transition-all duration-200 hover:-translate-y-px hover:border-card-hover"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border">
                  <Icon className="h-5 w-5 text-muted transition-colors group-hover:text-dirty-white" />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-widest text-section">
                  {roleLabel(role)}
                </span>
              </div>
              <h2 className="mb-1 text-lg font-semibold">{roleLabel(role)}</h2>
              <p className="mb-5 text-sm text-muted">{meta.description}</p>
              <div className="space-y-2">
                {roleUsers.length === 0 ? (
                  <p className="text-xs text-muted">Loading users…</p>
                ) : (
                  roleUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={busy === u.id}
                      onClick={() => selectUser(u.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-sm transition hover:border-accent disabled:opacity-50"
                    >
                      <span className="font-medium">{u.name}</span>
                      <span className="text-xs text-muted">
                        {busy === u.id ? "Signing in…" : "Enter →"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
