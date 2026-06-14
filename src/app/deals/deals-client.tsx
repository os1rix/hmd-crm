"use client";

import { OfferReviewPanel } from "@/components/offers/offer-review-panel";
import { Badge } from "@/components/ui/badge";
import { CardMoney } from "@/components/ui/card-money";
import { EntityFilters, type FilterValues } from "@/components/ui/entity-filters";
import { InfoTip } from "@/components/ui/info-tip";
import { PipelineSkeleton } from "@/components/ui/skeleton";
import { SlidePanel } from "@/components/ui/slide-panel";
import { useToast } from "@/components/ui/toast";
import { requestJson } from "@/lib/api-client";
import { STAGE_LABELS, daysSince, isDealAtRisk } from "@/lib/deals";
import { fetchList } from "@/lib/fetch-client";
import { initials } from "@/lib/format";
import { MONEY } from "@/lib/money-labels";
import type { SessionUser } from "@/lib/session";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Deal = {
  id: string;
  title: string;
  stage: string;
  channel: string;
  lastActivityAt: string;
  ownerId: string;
  account: { id: string; name: string };
  owner: { id: string; name: string };
  offers: Array<{
    id: string;
    version: number;
    total: string;
    subtotal: string;
    status: string;
    discountPercent: string | null;
    discountJustification: string | null;
    isLocked: boolean;
    createdAt: string;
    lineItems: Array<{
      itemType: "product" | "service";
      name: string;
      quantity: number;
      unitPrice: string;
    }>;
    createdBy: { id: string; name: string; email: string } | null;
    approvals: Array<{ id: string; approverRole: string; status: string }>;
  }>;
};

const STAGES = [
  "interest_shown",
  "rfi_answered",
  "rfp_offer_given",
  "customer_test",
  "contract_negotiation",
  "won",
  "lost",
];

const STAGE_HINTS: Partial<Record<(typeof STAGES)[number], string>> = {
  interest_shown: "Initial contact — customer has shown interest.",
  rfi_answered: "You responded to their information request.",
  rfp_offer_given: "Formal proposal or offer has been shared.",
  customer_test: "Pilot or proof-of-concept in progress.",
  contract_negotiation: "Terms and pricing being finalized.",
};

function latestOffer(deal: Deal) {
  return deal.offers?.[0] ?? null;
}

function accountOffersHref(deal: Deal) {
  return `/accounts/${deal.account.id}?tab=offers&deal=${deal.id}`;
}

export default function DealsPageClient({ user }: { user: SessionUser | null }) {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [reviewDeal, setReviewDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({});

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.channel) params.set("channel", filters.channel);
    if (filters.owner) params.set("ownerId", filters.owner);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    const qs = params.toString();
    setLoading(true);
    fetchList<Deal>(`/api/deals${qs ? `?${qs}` : ""}`)
      .then(setDeals)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
    fetch("/api/users")
      .then((r) => r.json())
      .then((users: Array<{ id: string; name: string; role: string }>) =>
        setOwners(users.filter((u) => u.role === "sales_rep")),
      )
      .catch(() => {});
  }, [load]);

  const reviewOfferId = searchParams.get("offer");
  const reviewDealId = searchParams.get("deal");

  useEffect(() => {
    if (!reviewDealId) {
      setReviewDeal(null);
      return;
    }
    if (!deals.length) return;
    const deal = deals.find((d) => d.id === reviewDealId);
    if (!deal) return;

    if (reviewOfferId) {
      setReviewDeal(deal);
      return;
    }

    router.replace(accountOffersHref(deal), { scroll: false });
  }, [reviewDealId, reviewOfferId, deals, router]);

  const reviewOffer = useMemo(() => {
    if (!reviewDeal || !reviewOfferId) return null;
    return reviewDeal.offers.find((o) => o.id === reviewOfferId) ?? null;
  }, [reviewDeal, reviewOfferId]);

  async function refreshReviewDeal() {
    if (!reviewDeal) return;
    const refreshed = await fetchList<Deal>("/api/deals");
    setDeals(refreshed);
    const updated = refreshed.find((d) => d.id === reviewDeal.id);
    if (updated) setReviewDeal(updated);
    load();
  }

  async function approve(approvalId: string, status: "approved" | "rejected") {
    if (!reviewDeal) return;
    try {
      await requestJson("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, status }),
      });
      toast(status === "approved" ? "Offer approved" : "Offer rejected");
      await refreshReviewDeal();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approval failed", "error");
    }
  }

  const filterFields = useMemo(
    () => [
      {
        key: "stage",
        label: "Stage",
        type: "select" as const,
        options: STAGES.map((s) => ({
          value: s,
          label: STAGE_LABELS[s as keyof typeof STAGE_LABELS],
        })),
      },
      {
        key: "channel",
        label: "Channel",
        type: "select" as const,
        options: [
          { value: "direct", label: "Direct" },
          { value: "reseller", label: "Reseller" },
        ],
      },
      {
        key: "owner",
        label: "Owner",
        type: "select" as const,
        options: owners.map((o) => ({ value: o.id, label: o.name })),
      },
      { key: "dateFrom", label: "From", type: "date" as const },
      { key: "dateTo", label: "To", type: "date" as const },
    ],
    [owners],
  );

  const isSalesRep = user?.role === "sales_rep";

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start gap-2">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold">
            Pipeline
            <InfoTip text="Your open deals grouped by sales stage. Click a card to open the account and build an offer — offers are always created on the account page, not here." />
          </h1>
          <p className="text-sm text-muted">
            {isSalesRep
              ? "Click a deal to open its account and create or edit offers."
              : "Click a deal to manage offers on the account. Managers review submitted offers from the dashboard approval queue."}
          </p>
        </div>
      </div>

      <EntityFilters
        fields={filterFields}
        values={filters}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClear={() => setFilters({})}
      />

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const column = deals.filter((d) => d.stage === stage);
            const hint = STAGE_HINTS[stage];
            return (
              <div key={stage} className="min-w-[240px] flex-1 border border-border p-3">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {STAGE_LABELS[stage as keyof typeof STAGE_LABELS]} ({column.length})
                  {hint && <InfoTip text={hint} />}
                </h3>
                <div className="space-y-2">
                  {column.map((deal) => {
                    const offer = latestOffer(deal);
                    return (
                      <Link
                        key={deal.id}
                        href={accountOffersHref(deal)}
                        className="block w-full border border-border p-3 hover:border-accent"
                      >
                        <p className="text-sm font-medium">{deal.account.name}</p>
                        <p className="text-xs text-muted">{deal.title}</p>
                        {offer ? (
                          <div className="mt-2">
                            <CardMoney
                              amount={offer.total}
                              label={MONEY.latestOffer.label}
                              hint={`${MONEY.latestOffer.hint} Status: ${offer.status}, v${offer.version}.`}
                            />
                          </div>
                        ) : (
                          <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                            No offer yet
                            <InfoTip text="No offer has been created for this deal. Click to open the account and build one." />
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted">
                            {daysSince(deal.lastActivityAt)}d idle
                            <InfoTip text="Days since the last activity on this deal. Deals idle 14+ days are flagged at risk on the dashboard." />
                          </span>
                          {isDealAtRisk(deal as never) && <Badge variant="warning">At risk</Badge>}
                        </div>
                        <div
                          className="mt-2 flex h-6 w-6 items-center justify-center border border-accent/30 text-[10px] font-bold text-accent"
                          title={deal.owner.name}
                        >
                          {initials(deal.owner.name)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SlidePanel
        open={Boolean(reviewDeal && reviewOfferId)}
        onClose={() => {
          setReviewDeal(null);
          router.replace("/deals", { scroll: false });
        }}
        title="Review offer"
      >
        {reviewDeal && reviewOfferId && !reviewOffer && (
          <p className="text-sm text-muted">Offer not found on this deal.</p>
        )}
        {reviewDeal && reviewOffer && (
          <OfferReviewPanel
            offer={reviewOffer}
            dealTitle={reviewDeal.title}
            accountName={reviewDeal.account.name}
            ownerName={reviewDeal.owner.name}
            user={user}
            onApprove={(id) => approve(id, "approved")}
            onReject={(id) => approve(id, "rejected")}
          />
        )}
      </SlidePanel>
    </div>
  );
}
