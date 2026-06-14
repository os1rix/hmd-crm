"use client";

import { Card } from "@/components/ui/card";
import { formatEuro } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Approval = {
  id: string;
  offer: {
    id: string;
    total: string;
    discountPercent: string | null;
    account: { name: string };
    deal: { id: string; title: string } | null;
    createdBy: { name: string } | null;
  };
};

export function ApprovalQueue({
  approvals,
  showActions = true,
}: {
  approvals: Approval[];
  showActions?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(approvalId: string, status: "approved" | "rejected") {
    setBusy(approvalId);
    try {
      await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (approvals.length === 0) {
    return <p className="text-sm text-muted">No pending approvals</p>;
  }

  return (
    <div className="space-y-3">
      {approvals.map((a) => (
        <Card key={a.id} className="p-4" hover>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">{a.offer.deal?.title ?? "Offer"}</p>
              <p className="text-sm text-muted">{a.offer.account.name}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                <span className="font-mono tabular-nums">{formatEuro(a.offer.total)}</span>
                {a.offer.discountPercent && (
                  <span className="text-warning">{a.offer.discountPercent}% discount</span>
                )}
                {a.offer.createdBy && <span>Rep: {a.offer.createdBy.name}</span>}
              </div>
            </div>
            {showActions && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busy === a.id}
                  onClick={() => decide(a.id, "approved")}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                >
                  Approve
                </button>
                <Link
                  href={a.offer.deal ? `/deals?deal=${a.offer.deal.id}` : "/deals"}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent"
                >
                  Review
                </Link>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
