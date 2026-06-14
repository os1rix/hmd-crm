"use client";

import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, dealTotalValue, isDealAtRisk } from "@/lib/deals";
import { fetchList } from "@/lib/fetch-client";
import { formatEuro } from "@/lib/format";
import Link from "next/link";
import { useEffect, useState } from "react";

type DealSummary = {
  id: string;
  title: string;
  stage: string;
  lastActivityAt: string;
  quarterlyForecast: Array<{ quarter: string; deviceRevenue: number; serviceRevenue: number }>;
};

type Account = {
  id: string;
  name: string;
  segment: string | null;
  region: string | null;
  channel: string;
  owner: { name: string } | null;
  contacts: { name: string }[];
  deals: DealSummary[];
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
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
  }, []);

  if (loading) {
    return <div className="p-6 text-muted">Loading accounts…</div>;
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
      <p className="mb-6 text-sm text-muted">
        Your portfolio with live deal status — click an account for details.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <p className="text-muted">No accounts in your portfolio yet.</p>
        ) : (
          accounts.map((account) => {
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
                className="rounded-xl border border-border p-5 transition hover:border-accent"
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
                </p>
                <p className="mt-3 font-mono text-sm tabular-nums text-accent">
                  {formatEuro(pipeline)} pipeline
                </p>
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
