"use client";

import { Badge } from "@/components/ui/badge";
import { SlidePanel } from "@/components/ui/slide-panel";
import {
  DIRECT_STAGES,
  RESELLER_STAGES,
  STAGE_LABELS,
  daysSince,
  dealTotalValue,
  isDealAtRisk,
} from "@/lib/deals";
import { fetchList } from "@/lib/fetch-client";
import { formatEuro, initials } from "@/lib/format";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ForecastRow = { quarter: string; deviceRevenue: number; serviceRevenue: number };

type Deal = {
  id: string;
  title: string;
  stage: string;
  channel: string;
  lastActivityAt: string;
  quarterlyForecast: ForecastRow[];
  account: { id: string; name: string };
  owner: { name: string };
  offers: Array<{
    id: string;
    total: string;
    discountPercent: string | null;
    isLocked: boolean;
    approvals: Array<{ id: string; approverRole: string; status: string }>;
  }>;
};

type Catalog = {
  products: Array<{ id: string; name: string; unitPrice: string }>;
  services: Array<{ id: string; name: string }>;
};

type AiAction = { action: string; topics?: string[]; email: string };

export default function DealsPageClient() {
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selected, setSelected] = useState<Deal | null>(null);
  const [forecastDraft, setForecastDraft] = useState<ForecastRow[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [aiAction, setAiAction] = useState<AiAction | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [offerItems, setOfferItems] = useState<
    Array<{ itemType: string; itemId: string; name: string; quantity: number; unitPrice: string }>
  >([]);
  const [discount, setDiscount] = useState(0);
  const [justification, setJustification] = useState("");

  const load = useCallback(() => {
    fetchList<Deal>("/api/deals").then(setDeals);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/catalog")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => {});
  }, [load]);

  useEffect(() => {
    const dealId = searchParams.get("deal");
    if (dealId && deals.length) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) openDeal(deal);
    }
  }, [searchParams, deals]);

  function openDeal(deal: Deal) {
    setSelected(deal);
    setForecastDraft(structuredClone(deal.quarterlyForecast ?? []));
    setAiAction(null);
    setAiLoading(true);
    fetch("/api/ai/next-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId: deal.id }),
    })
      .then((r) => r.json())
      .then((data) => setAiAction(data as AiAction))
      .catch(() => setAiAction(null))
      .finally(() => setAiLoading(false));
  }

  async function updateStage(stage: string) {
    if (!selected) return;
    const res = await fetch(`/api/deals/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) return;
    const updated = { ...selected, stage };
    setSelected(updated);
    load();
  }

  async function saveForecast() {
    if (!selected) return;
    const res = await fetch(`/api/deals/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarterlyForecast: forecastDraft }),
    });
    if (!res.ok) return;
    const updated = { ...selected, quarterlyForecast: forecastDraft };
    setSelected(updated);
    load();
  }

  function updateForecastRow(
    index: number,
    field: "deviceRevenue" | "serviceRevenue",
    value: number,
  ) {
    setForecastDraft((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function draftOffer() {
    if (!selected || !catalog) return;
    const res = await fetch("/api/ai/draft-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealTitle: selected.title,
        accountName: selected.account.name,
        catalog,
      }),
    });
    const data = await res.json();
    if (data.lineItems?.length) setOfferItems(data.lineItems);
  }

  async function submitOffer() {
    if (!selected || !offerItems.length) return;
    await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: selected.account.id,
        dealId: selected.id,
        lineItems: offerItems,
        discountPercent: discount || undefined,
        discountJustification: justification || undefined,
      }),
    });
    load();
    setOfferItems([]);
    setDiscount(0);
    setJustification("");
  }

  async function approve(approvalId: string, status: "approved" | "rejected") {
    await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId, status }),
    });
    load();
  }

  const stages = [
    "interest_shown",
    "rfi_answered",
    "rfp_offer_given",
    "customer_test",
    "contract_negotiation",
    "won",
    "lost",
  ];

  const threeYearTotal = dealTotalValue(forecastDraft);

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Pipeline</h1>
      <p className="mb-6 text-sm text-muted">
        Drag-free updates — change stage, edit 3-year forecast, and get AI next steps per deal.
      </p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const column = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="min-w-[240px] flex-1 rounded-xl border border-border p-3">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]} ({column.length})
              </h3>
              <div className="space-y-2">
                {column.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => openDeal(deal)}
                    className="w-full rounded-lg border border-border p-3 text-left hover:border-accent"
                  >
                    <p className="text-sm font-medium">{deal.account.name}</p>
                    <p className="text-xs text-muted">{deal.title}</p>
                    <p className="mt-2 font-mono text-sm tabular-nums">
                      {formatEuro(dealTotalValue(deal.quarterlyForecast))}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted">
                        {daysSince(deal.lastActivityAt)}d idle
                      </span>
                      {isDealAtRisk(deal as never) && <Badge variant="warning">At risk</Badge>}
                    </div>
                    <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 text-[10px] font-bold text-accent">
                      {initials(deal.owner.name)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <SlidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Deal"}
      >
        {selected && (
          <div className="space-y-6">
            <div className="rounded-xl border border-accent/40 p-4">
              <p className="mb-1 text-xs font-medium uppercase text-accent">AI next best action</p>
              {aiLoading ? (
                <p className="text-sm text-muted">Generating recommendations…</p>
              ) : aiAction ? (
                <>
                  <p className="mb-3 text-sm">{aiAction.action}</p>
                  {aiAction.topics && aiAction.topics.length > 0 && (
                    <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-muted">
                      {aiAction.topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  )}
                  {aiAction.email && (
                    <details className="text-sm text-muted">
                      <summary className="cursor-pointer text-accent">Draft email</summary>
                      <p className="mt-2 whitespace-pre-wrap">{aiAction.email}</p>
                    </details>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted">No recommendation available.</p>
              )}
            </div>

            <div>
              <label htmlFor="deal-stage" className="mb-1 block text-xs text-muted">
                Stage
              </label>
              <select
                id="deal-stage"
                value={selected.stage}
                onChange={(e) => updateStage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {(selected.channel === "reseller" ? RESELLER_STAGES : DIRECT_STAGES).map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">3-year time-phased forecast</h3>
                <p className="font-mono text-sm tabular-nums text-accent">
                  Total: {formatEuro(threeYearTotal)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted">
                      <th className="p-2">Quarter</th>
                      <th className="p-2 font-mono">Device €</th>
                      <th className="p-2 font-mono">Service €</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastDraft.slice(0, 12).map((q, index) => (
                      <tr key={q.quarter} className="border-t border-border">
                        <td className="p-2">{q.quarter}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            value={q.deviceRevenue}
                            onChange={(e) =>
                              updateForecastRow(index, "deviceRevenue", Number(e.target.value) || 0)
                            }
                            className="w-full rounded border border-border bg-background px-2 py-1 font-mono tabular-nums"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            value={q.serviceRevenue}
                            onChange={(e) =>
                              updateForecastRow(
                                index,
                                "serviceRevenue",
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-full rounded border border-border bg-background px-2 py-1 font-mono tabular-nums"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={saveForecast}
                className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                Save forecast
              </button>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Offers</h3>
              {selected.offers?.map((o) => (
                <div key={o.id} className="mb-2 rounded-lg border border-border p-3 text-sm">
                  <p className="font-mono tabular-nums">{formatEuro(o.total)}</p>
                  {o.discountPercent && <p className="text-muted">{o.discountPercent}% discount</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {o.approvals?.map((a) => (
                      <div key={a.id} className="flex items-center gap-1">
                        <Badge
                          variant={
                            a.status === "approved"
                              ? "success"
                              : a.status === "rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {a.approverRole}: {a.status}
                        </Badge>
                        {a.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => approve(a.id, "approved")}
                              className="text-xs text-success"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => approve(a.id, "rejected")}
                              className="text-xs text-danger"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Offer builder</h3>
                <button
                  type="button"
                  onClick={draftOffer}
                  className="text-xs text-accent hover:underline"
                >
                  Draft offer with AI
                </button>
              </div>
              {offerItems.map((item, i) => (
                <p key={`${item.name}-${i}`} className="text-sm text-muted">
                  {item.quantity}× {item.name} @ {item.unitPrice}
                </p>
              ))}
              <div className="mt-3 grid gap-2">
                <input
                  type="number"
                  placeholder="Discount %"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  placeholder="Justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={submitOffer}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                >
                  Submit for approval
                </button>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
