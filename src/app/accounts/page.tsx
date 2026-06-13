"use client";

import { Badge } from "@/components/ui/badge";
import { fetchList } from "@/lib/fetch-client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Account = {
  id: string;
  name: string;
  segment: string | null;
  region: string | null;
  channel: string;
  owner: { name: string } | null;
  contacts: { name: string }[];
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchList<Account>("/api/accounts").then(setAccounts);
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Accounts</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <p className="text-muted">
            No accounts loaded. Run `docker compose exec app npm run db:setup`.
          </p>
        ) : (
          accounts.map((account) => (
            <Link
              key={account.id}
              href={`/accounts/${account.id}`}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-accent"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">{account.name}</h2>
                <Badge variant={account.channel === "direct" ? "accent" : "default"}>
                  {account.channel}
                </Badge>
              </div>
              <p className="text-sm text-muted">
                {account.segment} · {account.region}
              </p>
              <p className="mt-2 text-xs text-muted">
                Owner: {account.owner?.name ?? "—"} · {account.contacts.length} contacts
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
