"use client";

import { Badge } from "@/components/ui/badge";
import { CardMoney } from "@/components/ui/card-money";
import { EntityFilters, type FilterValues } from "@/components/ui/entity-filters";
import { AccountsGridSkeleton, EntityFiltersSkeleton } from "@/components/ui/skeleton";
import { STAGE_LABELS, dealTotalValue, isDealAtRisk } from "@/lib/deals";
import { MONEY } from "@/lib/money-labels";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DealSummary = {
  id: string;
  title: string;
  stage: string;
  channel: string;
  lastActivityAt: string;
  createdAt: string;
  ownerId: string;
  quarterlyForecast: Array<{ quarter: string; deviceRevenue: number; serviceRevenue: number }>;
};

type Account = {
  id: string;
  name: string;
  segment: string | null;
  region: string | null;
  channel: string;
  owner: { id: string; name: string } | null;
  contacts: { name: string }[];
  deals: DealSummary[];
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.channel) params.set("channel", filters.channel);
    if (filters.owner) params.set("ownerId", filters.owner);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    const qs = params.toString();

    fetch(`/api/accounts${qs ? `?${qs}` : ""}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Could not load accounts");
        }
        return response.json() as Promise<Account[]>;
      })
      .then((rows) => setAccounts(Array.isArray(rows) ? rows : []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) {
      if (a.owner) map.set(a.owner.id, a.owner.name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [accounts]);

  const filterFields = useMemo(
    () => [
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
      { key: "dateFrom", label: "Created after", type: "date" as const },
    ],
    [owners],
  );

  const filtered = useMemo(() => {
    let rows = accounts;
    if (filters.stage) {
      rows = rows.filter((a) =>
        a.deals.some((d) => d.stage === filters.stage && d.stage !== "won" && d.stage !== "lost"),
      );
    }
    return rows;
  }, [accounts, filters.stage]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-semibold">Accounts</h1>
        <p className="mb-4 text-sm text-muted">
          Your portfolio with live deal status — click an account for details.
        </p>
        <EntityFiltersSkeleton />
        <AccountsGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Accounts</h1>
      <p className="mb-4 text-sm text-muted">
        Your portfolio with live deal status — click an account for details.
      </p>

      <EntityFilters
        fields={[
          ...filterFields,
          {
            key: "stage",
            label: "Deal stage",
            type: "select",
            options: Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
        values={filters}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClear={() => setFilters({})}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="text-muted">No accounts match your filters.</p>
        ) : (
          filtered.map((account) => {
            const openDeals = account.deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
            const pipeline = openDeals.reduce(
              (sum, d) => sum + dealTotalValue(d.quarterlyForecast),
              0,
            );
            const atRisk = openDeals.some((d) => isDealAtRisk(d as never));

            return (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="border border-border p-5 transition hover:border-accent"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{account.name}</h2>
                  <Badge variant={account.channel === "direct" ? "accent" : "default"}>
                    {account.channel}
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  {account.segment} · {account.region}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {account.contacts.length} contacts · {openDeals.length} open deals
                  {account.owner && ` · ${account.owner.name}`}
                </p>
                <div className="mt-3">
                  <CardMoney
                    amount={pipeline}
                    label={MONEY.accountForecast.label}
                    hint={MONEY.accountForecast.hint}
                  />
                </div>
                {atRisk && (
                  <div className="mt-2">
                    <Badge variant="warning">Deal at risk</Badge>
                  </div>
                )}
                <div className="mt-3 space-y-1">
                  {openDeals.slice(0, 3).map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between text-xs text-muted"
                    >
                      <span className="truncate pr-2">{deal.title}</span>
                      <Badge>{STAGE_LABELS[deal.stage as keyof typeof STAGE_LABELS]}</Badge>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
