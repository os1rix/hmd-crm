"use client";

import { OfferBuilder } from "@/components/offers/offer-builder";
import { OfferReviewPanel } from "@/components/offers/offer-review-panel";
import { Badge } from "@/components/ui/badge";
import { CardMoney } from "@/components/ui/card-money";
import { InfoTip } from "@/components/ui/info-tip";
import { AccountDetailSkeleton, NarrativeSkeleton } from "@/components/ui/skeleton";
import { SlidePanel } from "@/components/ui/slide-panel";
import { UserAvatar } from "@/components/ui/user-avatar";
import { requestJson } from "@/lib/api-client";
import { fetchJson } from "@/lib/fetch-client";
import { formatRelative, roleLabel } from "@/lib/format";
import { MONEY } from "@/lib/money-labels";
import { parseOfferNotes } from "@/lib/offer-notes";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type OfferRow = {
  id: string;
  version: number;
  total: string;
  subtotal: string;
  status: string;
  isLocked: boolean;
  discountPercent: string | null;
  discountJustification: string | null;
  createdAt: string;
  deal: { id: string; title: string } | null;
  createdBy: { id: string; name: string; email: string };
  lineItems: Array<{
    itemType: "product" | "service";
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: string;
  }>;
  approvals: Array<{ id: string; approverRole: string; status: string }>;
};

type AccountDetail = {
  id: string;
  name: string;
  segment: string | null;
  region: string | null;
  channel: string;
  owner: { name: string } | null;
  deals: Array<{
    id: string;
    title: string;
    stage: string;
    quarterlyForecast: unknown;
    offers: OfferRow[];
  }>;
  cases: Array<{ id: string; title: string; status: string; priority: string }>;
  offers: OfferRow[];
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { name: string; role: string };
  }>;
  activity: Array<{ id: string; action: string; createdAt: string }>;
};

type Catalog = {
  products: Array<{ id: string; name: string; unitPrice: string }>;
  services: Array<{ id: string; name: string; unitPrice: string }>;
};

const TABS = ["Overview", "Offers", "Activity"] as const;
type Tab = (typeof TABS)[number];

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [aiActions, setAiActions] = useState<Record<string, { action: string; email: string }>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [offerDealId, setOfferDealId] = useState<string | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  const goToOffers = useCallback(
    (dealId: string) => {
      setTab("Offers");
      setOfferDealId(dealId);
      setEditingOfferId(null);
      router.replace(`/accounts/${params.id}?tab=offers&deal=${dealId}`, {
        scroll: false,
      });
      requestAnimationFrame(() => {
        document
          .getElementById("offer-builder")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [params.id, router],
  );

  const viewOffer = useCallback(
    (offerId: string) => {
      setEditingOfferId(null);
      setTab("Offers");
      router.replace(`/accounts/${params.id}?tab=offers&offer=${offerId}`, {
        scroll: false,
      });
    },
    [params.id, router],
  );

  const editDraftOffer = useCallback(
    (offer: OfferRow) => {
      setTab("Offers");
      setEditingOfferId(offer.id);
      if (offer.deal) setOfferDealId(offer.deal.id);
      const dealQs = offer.deal ? `&deal=${offer.deal.id}` : "";
      router.replace(`/accounts/${params.id}?tab=offers&offer=${offer.id}${dealQs}`, {
        scroll: false,
      });
      requestAnimationFrame(() => {
        document
          .getElementById("offer-builder")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [params.id, router],
  );

  const openOffer = useCallback(
    (offer: OfferRow) => {
      if (offer.status === "draft" && !offer.isLocked) {
        editDraftOffer(offer);
      } else {
        viewOffer(offer.id);
      }
    },
    [editDraftOffer, viewOffer],
  );

  const closeOfferView = useCallback(() => {
    setEditingOfferId(null);
    router.replace(`/accounts/${params.id}?tab=offers`, { scroll: false });
  }, [params.id, router]);

  const goToTab = useCallback(
    (next: Tab, dealId?: string | null) => {
      setTab(next);
      if (next === "Offers") {
        const id = dealId ?? offerDealId ?? undefined;
        if (id) {
          setOfferDealId(id);
          router.replace(`/accounts/${params.id}?tab=offers&deal=${id}`, {
            scroll: false,
          });
        } else {
          router.replace(`/accounts/${params.id}?tab=offers`, {
            scroll: false,
          });
        }
        return;
      }
      if (next === "Activity") {
        router.replace(`/accounts/${params.id}?tab=activity`, {
          scroll: false,
        });
        return;
      }
      router.replace(`/accounts/${params.id}`, { scroll: false });
    },
    [offerDealId, params.id, router],
  );

  const reload = useCallback(() => {
    fetchJson<AccountDetail | null>(`/api/accounts/${params.id}`, null).then(setAccount);
  }, [params.id]);

  useEffect(() => {
    reload();
    fetchJson<Catalog>("/api/catalog", { products: [], services: [] }).then(setCatalog);
  }, [reload]);

  useEffect(() => {
    const tabParam = searchParams.get("tab")?.toLowerCase();
    const dealParam = searchParams.get("deal");
    const offerParam = searchParams.get("offer");

    if (offerParam) {
      setTab("Offers");
      if (dealParam) setOfferDealId(dealParam);
      return;
    }
    if (dealParam) {
      setOfferDealId(dealParam);
      setTab("Offers");
      return;
    }
    if (tabParam === "offers") {
      setTab("Offers");
      return;
    }
    if (tabParam === "activity") {
      setTab("Activity");
      return;
    }
    setTab("Overview");
  }, [searchParams]);

  useEffect(() => {
    if (!account?.deals.length) return;

    const targets = account.deals
      .filter((d) => d.stage !== "won" && d.stage !== "lost")
      .slice(0, 5);

    setAiActions({});
    setAiLoading(Object.fromEntries(targets.map((d) => [d.id, true])));

    for (const deal of targets) {
      fetch("/api/ai/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id }),
      })
        .then((r) => r.json())
        .then((data) => setAiActions((prev) => ({ ...prev, [deal.id]: data })))
        .catch(() => {})
        .finally(() => setAiLoading((prev) => ({ ...prev, [deal.id]: false })));
    }
  }, [account]);

  async function saveOffer(
    dealId: string,
    items: Array<{
      itemType: string;
      itemId: string;
      name: string;
      quantity: number;
      unitPrice: string;
    }>,
    discount: number,
    justification: string,
    submitAsDraft: boolean,
    offerId?: string | null,
  ) {
    const payload = {
      lineItems: items,
      discountPercent: discount > 0 ? discount : undefined,
      discountJustification: justification || undefined,
      submitAsDraft,
    };

    if (offerId) {
      await requestJson(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await requestJson("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: params.id,
          dealId,
          ...payload,
        }),
      });
    }

    setOfferDealId(null);
    setEditingOfferId(null);
    router.replace(`/accounts/${params.id}?tab=offers`, { scroll: false });
    reload();
  }

  if (!account) {
    return <AccountDetailSkeleton />;
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

  const openDeals = account.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const selectedOfferId = searchParams.get("offer");
  const draftOfferFromUrl =
    account.offers.find((o) => o.id === selectedOfferId && o.status === "draft" && !o.isLocked) ??
    null;
  const resolvedEditingId = editingOfferId ?? draftOfferFromUrl?.id ?? null;
  const editingOffer = account.offers.find((o) => o.id === resolvedEditingId) ?? null;
  const selectedOffer =
    account.offers.find((o) => o.id === selectedOfferId && o.status !== "draft") ?? null;
  const activeDealId = offerDealId ?? editingOffer?.deal?.id ?? draftOfferFromUrl?.deal?.id ?? null;
  const activeDealTitle =
    openDeals.find((d) => d.id === activeDealId)?.title ??
    editingOffer?.deal?.title ??
    account.deals.find((d) => d.id === activeDealId)?.title ??
    "";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold">{account.name}</h1>
        <p className="text-sm text-muted">
          {account.segment} · {account.region} · {account.channel}
          {account.owner && ` · Owner: ${account.owner.name}`}
        </p>
        <div className="mt-4 flex gap-0 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => goToTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t}
              {t === "Offers" && account.offers.length > 0 && (
                <span className="ml-1.5 text-xs text-muted">({account.offers.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" && (
        <div className="flex-1 p-6">
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-section">
              Open deals
            </h2>
            <div className="space-y-3">
              {openDeals.map((deal) => {
                const latest = deal.offers?.[0];
                return (
                  <div key={deal.id} className="border border-border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => goToOffers(deal.id)}
                          className="font-medium text-left hover:text-accent"
                        >
                          {deal.title}
                        </button>
                        <p className="text-xs text-muted">{deal.stage.replaceAll("_", " ")}</p>
                      </div>
                      {latest ? (
                        <button
                          type="button"
                          onClick={() => openOffer(latest)}
                          className="text-right hover:opacity-80"
                        >
                          <CardMoney
                            amount={latest.total}
                            label={MONEY.latestOffer.label}
                            hint={MONEY.latestOffer.hint}
                            align="right"
                            size="sm"
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-muted">No offer</span>
                      )}
                    </div>
                    {aiLoading[deal.id] && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-medium uppercase text-accent">
                          AI next action
                        </p>
                        <NarrativeSkeleton />
                      </div>
                    )}
                    {!aiLoading[deal.id] && aiActions[deal.id]?.action && (
                      <div className="mt-3 text-sm">
                        <p className="mb-1 text-xs font-medium uppercase text-accent">
                          AI next action
                        </p>
                        <p>{aiActions[deal.id].action}</p>
                      </div>
                    )}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => goToOffers(deal.id)}
                        className="bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                      >
                        Create offer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-section">
              Active cases
            </h2>
            <div className="space-y-2">
              {account.cases
                .filter((c) => c.status !== "closed" && c.status !== "resolved")
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases?case=${c.id}`}
                    className="block border border-border px-4 py-3 hover:border-accent"
                  >
                    <p className="font-medium">{c.title}</p>
                    <div className="mt-1 flex gap-2">
                      <Badge>{c.status}</Badge>
                      <Badge variant={c.priority === "critical" ? "danger" : "warning"}>
                        {c.priority}
                      </Badge>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        </div>
      )}

      {tab === "Offers" && (
        <div className="flex-1 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-medium">
                Offers
                <InfoTip text="Build and submit offers here. Select a deal, add devices and/or services, then save as draft or submit for manager approval. AI draft is optional." />
              </h2>
              <p className="text-sm text-muted">
                {account.offers.length} offer
                {account.offers.length !== 1 ? "s" : ""} on this account
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const dealId = offerDealId ?? openDeals[0]?.id;
                if (dealId) goToOffers(dealId);
              }}
              className="bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Create new offer
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Link to deal:</span>
            {openDeals.length === 0 ? (
              <span className="text-sm text-muted">No open deals</span>
            ) : (
              openDeals.map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => goToOffers(deal.id)}
                  className={`border px-3 py-1 text-xs ${
                    offerDealId === deal.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {deal.title}
                </button>
              ))
            )}
          </div>

          {activeDealId ? (
            <div id="offer-builder">
              <OfferBuilder
                key={resolvedEditingId ?? `new-${activeDealId}`}
                catalog={catalog}
                dealTitle={activeDealTitle}
                accountName={account.name}
                initial={
                  editingOffer
                    ? {
                        lineItems: editingOffer.lineItems,
                        discount: editingOffer.discountPercent
                          ? Number.parseFloat(editingOffer.discountPercent)
                          : 0,
                        version: editingOffer.version,
                        ...parseOfferNotes(editingOffer.discountJustification),
                      }
                    : undefined
                }
                onDraft={(items, discount, justification) =>
                  saveOffer(activeDealId, items, discount, justification, true, resolvedEditingId)
                }
                onSubmit={(items, discount, justification) =>
                  saveOffer(activeDealId, items, discount, justification, false, resolvedEditingId)
                }
              />
            </div>
          ) : (
            openDeals.length > 0 && (
              <p className="mb-4 text-sm text-muted">
                Select a deal above or click &quot;Create new offer&quot; to start.
              </p>
            )
          )}

          <h3 className="mb-3 mt-8 text-sm font-medium uppercase tracking-wide text-section">
            All offers
          </h3>
          <div className="space-y-2">
            {account.offers.length === 0 ? (
              <p className="text-sm text-muted">No offers yet.</p>
            ) : (
              account.offers.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => openOffer(offer)}
                  className={`flex w-full items-center justify-between border p-4 text-left transition hover:border-accent ${
                    (selectedOfferId === offer.id && offer.status !== "draft") ||
                    resolvedEditingId === offer.id
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  }`}
                >
                  <div>
                    <p className="font-medium">
                      Offer v{offer.version}
                      {offer.deal && (
                        <span className="ml-2 font-normal text-muted">· {offer.deal.title}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      by {offer.createdBy.name} ·{" "}
                      <Badge variant={offer.status === "draft" ? "default" : "accent"}>
                        {offer.status}
                      </Badge>
                      {offer.isLocked && <span className="ml-1 text-muted">(locked)</span>}
                      {offer.lineItems.length > 0 && (
                        <span className="ml-1">
                          · {offer.lineItems.length} line
                          {offer.lineItems.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <CardMoney
                      amount={offer.total}
                      label={MONEY.offerTotal.label}
                      hint={MONEY.offerTotal.hint}
                      align="right"
                      size="sm"
                    />
                    {offer.discountPercent && (
                      <p className="text-xs text-muted">{offer.discountPercent}% discount</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "Activity" && (
        <div className="flex-1 space-y-4 overflow-y-auto p-6 scrollbar-thin">
          {timeline.map((item) => (
            <div key={item.id} className="border border-border p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-2">
                  {item.role !== "system" && <UserAvatar name={item.who} size="sm" />}
                  <span>
                    {item.who}{" "}
                    {item.role !== "system" && (
                      <Badge variant="accent">{roleLabel(item.role)}</Badge>
                    )}
                  </span>
                </div>
                <span>{formatRelative(item.at)}</span>
              </div>
              <p className="text-sm">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      <SlidePanel
        open={Boolean(selectedOffer)}
        onClose={closeOfferView}
        title={selectedOffer ? `Offer v${selectedOffer.version}` : "Offer"}
      >
        {selectedOffer && (
          <OfferReviewPanel
            offer={selectedOffer}
            dealTitle={selectedOffer.deal?.title ?? "Unlinked deal"}
            accountName={account.name}
            ownerName={account.owner?.name ?? "Unassigned"}
            user={null}
            onApprove={() => {}}
            onReject={() => {}}
            viewOnly
          />
        )}
      </SlidePanel>
    </div>
  );
}
