"use client";

import { Badge } from "@/components/ui/badge";
import { EntityFilters, type FilterValues } from "@/components/ui/entity-filters";
import { CasesListSkeleton, NarrativeSkeleton } from "@/components/ui/skeleton";
import { SlidePanel } from "@/components/ui/slide-panel";
import { StatusChip, type StatusChipVariant } from "@/components/ui/status-chip";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fetchList } from "@/lib/fetch-client";
import { formatDate } from "@/lib/format";
import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type CaseRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  slaDueAt: string | null;
  escalatedToThirdParty: boolean;
  account: { name: string };
  assignee: { name: string } | null;
  notes: Array<{ body: string; author: { name: string }; createdAt: string }>;
};

export default function CasesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selected, setSelected] = useState<CaseRow | null>(null);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({});

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    const qs = params.toString();

    setLoading(true);
    fetchList<CaseRow>(`/api/cases${qs ? `?${qs}` : ""}`)
      .then(setCases)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const caseId = searchParams.get("case");
    if (caseId && cases.length) {
      const row = cases.find((c) => c.id === caseId);
      if (row) setSelected(row);
    }
  }, [searchParams, cases]);

  useEffect(() => {
    if (!selected || selected.notes.length < 5) {
      setSummary("");
      return;
    }
    setSummaryLoading(true);
    fetch("/api/ai/case-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: selected.notes.map((n) => n.body) }),
    })
      .then((r) => r.json())
      .then((data) => setSummary(data.summary ?? ""))
      .catch(() => setSummary(""))
      .finally(() => setSummaryLoading(false));
  }, [selected]);

  function closePanel() {
    setSelected(null);
    setSummary("");
    if (searchParams.get("case")) {
      router.replace("/cases", { scroll: false });
    }
  }

  async function updateCase(status: string) {
    if (!selected) return;
    await fetch("/api/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status, note: note || undefined }),
    });
    setNote("");
    closePanel();
    load();
  }

  const priorityColor = (p: string) =>
    p === "critical" ? "danger" : p === "high" ? "warning" : "default";

  const statusVariant = (status: string): StatusChipVariant => {
    const map: Record<string, StatusChipVariant> = {
      open: "open",
      in_progress: "in-progress",
      escalated: "at-risk",
      resolved: "resolved",
      closed: "closed",
    };
    return map[status] ?? "normal";
  };

  const statusLabel = (status: string) => status.replaceAll("_", " ");

  const filterFields = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "open", label: "Open" },
          { value: "in_progress", label: "In progress" },
          { value: "escalated", label: "Escalated" },
          { value: "resolved", label: "Resolved" },
          { value: "closed", label: "Closed" },
        ],
      },
      {
        key: "priority",
        label: "Priority",
        type: "select" as const,
        options: [
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ],
      },
      { key: "dateFrom", label: "SLA from", type: "date" as const },
      { key: "dateTo", label: "SLA to", type: "date" as const },
    ],
    [],
  );

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Cases</h1>

      <EntityFilters
        fields={filterFields}
        values={filters}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClear={() => setFilters({})}
      />

      <div className="space-y-3">
        {loading ? (
          <CasesListSkeleton />
        ) : (
          <>
            {cases.length === 0 && (
              <p className="text-sm text-muted">
                {hasFilters ? "No cases match your filters." : "No cases yet."}
              </p>
            )}
            {cases
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return (
                  (order[a.priority as keyof typeof order] ?? 9) -
                  (order[b.priority as keyof typeof order] ?? 9)
                );
              })
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="flex w-full items-center gap-4 border border-border p-4 text-left hover:border-accent"
                >
                  <div
                    className={`w-1 self-stretch ${
                      c.priority === "critical"
                        ? "bg-danger"
                        : c.priority === "high"
                          ? "bg-warning"
                          : "bg-border"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{c.title}</p>
                      <StatusChip variant={statusVariant(c.status)}>
                        {statusLabel(c.status)}
                      </StatusChip>
                    </div>
                    <p className="text-sm text-muted">{c.account.name}</p>
                  </div>
                  <Badge variant={priorityColor(c.priority) as "danger"}>{c.priority}</Badge>
                  {c.slaDueAt && (
                    <span className="text-xs text-muted">SLA {formatDate(c.slaDueAt)}</span>
                  )}
                </button>
              ))}
          </>
        )}
      </div>

      <SlidePanel open={!!selected} onClose={closePanel} title={selected?.title ?? "Case"}>
        {selected && (
          <div className="space-y-4">
            {selected.notes.length >= 5 && (
              <div className="border border-accent/30 bg-surface p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI case summary
                </div>
                {summaryLoading ? <NarrativeSkeleton /> : <p className="text-sm">{summary}</p>}
              </div>
            )}

            <div className="space-y-3">
              {selected.notes.map((n, i) => (
                <div key={`${n.createdAt}-${i}`} className="border border-border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                    <UserAvatar name={n.author.name} size="sm" />
                    {n.author.name} · {formatDate(n.createdAt)}
                  </div>
                  <p>{n.body}</p>
                </div>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add note…"
              className="w-full border border-border bg-background p-3 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              {["in_progress", "escalated", "resolved", "closed"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateCase(status)}
                  className="border border-border px-3 py-1.5 text-xs hover:border-accent"
                >
                  Mark {statusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
