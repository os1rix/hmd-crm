"use client";

import { Badge } from "@/components/ui/badge";
import { SlidePanel } from "@/components/ui/slide-panel";
import { fetchList } from "@/lib/fetch-client";
import { formatDate } from "@/lib/format";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selected, setSelected] = useState<CaseRow | null>(null);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState("");

  const load = useCallback(() => {
    fetchList<CaseRow>("/api/cases?mine=true").then((rows) => {
      if (rows.length === 0) {
        fetchList<CaseRow>("/api/cases").then(setCases);
      } else {
        setCases(rows);
      }
    });
  }, []);

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

  async function updateCase(status: string) {
    if (!selected) return;
    await fetch("/api/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status, note: note || undefined }),
    });
    setNote("");
    load();
    setSelected(null);
  }

  async function summarize() {
    if (!selected || selected.notes.length < 5) return;
    const res = await fetch("/api/ai/case-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: selected.notes.map((n) => n.body) }),
    });
    const data = await res.json();
    setSummary(data.summary ?? "");
  }

  const priorityColor = (p: string) =>
    p === "critical" ? "danger" : p === "high" ? "warning" : "default";

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Cases</h1>
      <div className="space-y-3">
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
              onClick={() => {
                setSelected(c);
                setSummary("");
              }}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-accent"
            >
              <div
                className={`w-1 self-stretch rounded-full ${
                  c.priority === "critical"
                    ? "bg-danger"
                    : c.priority === "high"
                      ? "bg-warning"
                      : "bg-border"
                }`}
              />
              <div className="flex-1">
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted">{c.account.name}</p>
              </div>
              <Badge variant={priorityColor(c.priority) as "danger"}>{c.priority}</Badge>
              <Badge>{c.status}</Badge>
              {c.escalatedToThirdParty && <Badge variant="warning">3rd party</Badge>}
              {c.slaDueAt && (
                <span className="text-xs text-muted">SLA {formatDate(c.slaDueAt)}</span>
              )}
            </button>
          ))}
      </div>

      <SlidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Case"}
      >
        {selected && (
          <div className="space-y-4">
            {selected.notes.length >= 5 && (
              <div>
                <button
                  type="button"
                  onClick={summarize}
                  className="mb-2 text-sm text-accent hover:underline"
                >
                  Summarize with AI
                </button>
                {summary && (
                  <div className="rounded-lg border border-accent/30 bg-accent-muted/20 p-3 text-sm">
                    {summary}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {selected.notes.map((n, i) => (
                <div
                  key={`${n.createdAt}-${i}`}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <p className="mb-1 text-xs text-muted">
                    {n.author.name} · {formatDate(n.createdAt)}
                  </p>
                  <p>{n.body}</p>
                </div>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add note…"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              {["in_progress", "escalated", "resolved", "closed"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateCase(status)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-accent"
                >
                  Mark {status.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
