"use client";

import { Badge } from "@/components/ui/badge";
import { dealTotalValue } from "@/lib/deals";
import { fetchJson } from "@/lib/fetch-client";
import { formatRelative, roleLabel } from "@/lib/format";
import { formatEuro } from "@/lib/format";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type AccountDetail = {
  id: string;
  name: string;
  segment: string | null;
  region: string | null;
  channel: string;
  deals: Array<{ id: string; title: string; stage: string; quarterlyForecast: unknown }>;
  cases: Array<{ id: string; title: string; status: string; priority: string }>;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { name: string; role: string };
  }>;
  activity: Array<{ id: string; action: string; createdAt: string }>;
};

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null);
  const [aiActions, setAiActions] = useState<Record<string, { action: string; email: string }>>({});

  useEffect(() => {
    fetchJson<AccountDetail | null>(`/api/accounts/${params.id}`, null).then(setAccount);
  }, [params.id]);

  useEffect(() => {
    if (!account?.deals.length) return;
    for (const deal of account.deals.slice(0, 3)) {
      fetch("/api/ai/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id }),
      })
        .then((r) => r.json())
        .then((data) => setAiActions((prev) => ({ ...prev, [deal.id]: data })))
        .catch(() => {});
    }
  }, [account]);

  async function parseMeetingNotes() {
    const res = await fetch("/api/ai/meeting-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: meetingNotes, accountName: account?.name }),
    });
    setExtracted(await res.json());
  }

  if (!account) {
    return <div className="p-6 text-muted">Loading account…</div>;
  }

  const timeline = [
    ...account.notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      body: n.body,
      at: n.createdAt,
      who: n.author.name,
      role: n.author.role,
    })),
    ...account.activity.map((a) => ({
      id: a.id,
      type: "activity" as const,
      body: a.action.replaceAll("_", " "),
      at: a.createdAt,
      who: "System",
      role: "system",
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-2">
      <div className="border-r border-border p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <p className="text-muted">
            {account.segment} · {account.region} · {account.channel}
          </p>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 font-medium">Open deals</h2>
          <div className="space-y-3">
            {account.deals.map((deal) => (
              <div key={deal.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-xs text-muted">{deal.stage.replaceAll("_", " ")}</p>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-accent">
                    {formatEuro(dealTotalValue(deal.quarterlyForecast as never))}
                  </span>
                </div>
                {aiActions[deal.id] && (
                  <div className="mt-3 rounded-lg border border-accent/30 p-3 text-sm">
                    <p className="mb-1 text-xs font-medium uppercase text-accent">AI next action</p>
                    <p>{aiActions[deal.id].action}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-medium">Active cases</h2>
          <div className="space-y-2">
            {account.cases
              .filter((c) => c.status !== "closed" && c.status !== "resolved")
              .map((c) => (
                <div key={c.id} className="rounded-lg border border-border px-4 py-3">
                  <p className="font-medium">{c.title}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge>{c.status}</Badge>
                    <Badge variant={c.priority === "critical" ? "danger" : "warning"}>
                      {c.priority}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="flex flex-col p-6">
        <h2 className="mb-4 font-medium">Activity timeline</h2>
        <div className="flex-1 space-y-4 overflow-y-auto scrollbar-thin">
          {timeline.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>
                  {item.who}{" "}
                  {item.role !== "system" && <Badge variant="accent">{roleLabel(item.role)}</Badge>}
                </span>
                <span>{formatRelative(item.at)}</span>
              </div>
              <p className="text-sm">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border p-4">
          <h3 className="mb-2 text-sm font-medium">Paste meeting notes</h3>
          <textarea
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            rows={4}
            className="mb-2 w-full rounded-lg border border-border bg-background p-3 text-sm"
            placeholder="Met with CISO — discussed RFP timeline and pilot expansion…"
          />
          <button
            type="button"
            onClick={parseMeetingNotes}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
          >
            Extract with AI
          </button>
          {extracted && (
            <pre className="mt-3 overflow-auto rounded-lg bg-background p-3 text-xs text-muted">
              {JSON.stringify(extracted, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
