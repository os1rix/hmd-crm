"use client";

import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusChip } from "@/components/ui/status-chip";
import { daysSince } from "@/lib/deals";
import Link from "next/link";
import { useMemo, useState } from "react";

type CaseRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  account: { name: string };
};

const PRIORITY_BORDER: Record<string, string> = {
  critical: "border-l-danger",
  high: "border-l-danger",
  medium: "border-l-warning",
  low: "border-l-border",
};

const STATUS_VARIANT: Record<string, "open" | "in-progress" | "escalated" | "resolved" | "closed"> =
  {
    open: "open",
    in_progress: "in-progress",
    escalated: "escalated",
    resolved: "resolved",
    closed: "closed",
  };

type SortKey = "priority" | "age" | "account";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TamCaseList({ cases }: { cases: CaseRow[] }) {
  const [sort, setSort] = useState<SortKey>("priority");

  const sorted = useMemo(() => {
    const rows = [...cases];
    if (sort === "priority") {
      rows.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    } else if (sort === "age") {
      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      rows.sort((a, b) => a.account.name.localeCompare(b.account.name));
    }
    return rows;
  }, [cases, sort]);

  const sorts: { key: SortKey; label: string }[] = [
    { key: "priority", label: "Priority" },
    { key: "age", label: "Age" },
    { key: "account", label: "Account" },
  ];

  return (
    <section>
      <SectionHeader>Assigned cases</SectionHeader>
      <div className="mb-4 flex gap-1 rounded-lg border border-border p-1">
        {sorts.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              sort === s.key
                ? "border border-border text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {sorted.map((c) => {
          const age = daysSince(c.createdAt);
          const statusLabel = c.status.replaceAll("_", " ");
          return (
            <Link key={c.id} href={`/cases?case=${c.id}`}>
              <Card
                hover
                className={`border-l-4 p-4 ${PRIORITY_BORDER[c.priority] ?? "border-l-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted">{c.account.name}</p>
                    <p className="mt-1 text-xs text-muted">{age} days old</p>
                  </div>
                  <StatusChip variant={STATUS_VARIANT[c.status] ?? "open"}>
                    {statusLabel}
                  </StatusChip>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
