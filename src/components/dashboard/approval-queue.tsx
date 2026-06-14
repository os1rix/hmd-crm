"use client";

import { Card } from "@/components/ui/card";
import { CardMoney } from "@/components/ui/card-money";
import { useToast } from "@/components/ui/toast";
import { requestJson } from "@/lib/api-client";
import { MONEY } from "@/lib/money-labels";
import { canDecideOfferApproval } from "@/lib/offer-approvals";
import type { SessionUser } from "@/lib/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Approval = {
  id: string;
  approverRole: string;
  status?: string;
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
  userRole,
  showActions = true,
}: {
  approvals: Approval[];
  userRole?: SessionUser["role"] | null;
  showActions?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(approvalId: string, status: "approved" | "rejected") {
    setBusy(approvalId);
    try {
      await requestJson("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, status }),
      });
      toast(status === "approved" ? "Offer approved" : "Offer rejected");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approval failed", "error");
    } finally {
      setBusy(null);
    }
  }

  if (approvals.length === 0) {
    return <p className="text-sm text-muted">No pending approvals</p>;
  }

  return (
    <div className="space-y-3">
      {approvals.map((a) => {
        const canDecide = canDecideOfferApproval(userRole, {
          status: a.status ?? "pending",
          approverRole: a.approverRole,
        });

        return (
          <Card key={a.id} className="p-4" hover>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{a.offer.deal?.title ?? "Offer"}</p>
                <p className="text-sm text-muted">{a.offer.account.name}</p>
                <div className="mt-2 flex flex-wrap items-end gap-3 text-xs text-muted">
                  <CardMoney
                    amount={a.offer.total}
                    label={MONEY.offerTotal.label}
                    hint={MONEY.offerTotal.hint}
                    size="sm"
                  />
                  {a.offer.discountPercent && (
                    <span className="text-warning">{a.offer.discountPercent}% discount</span>
                  )}
                  {a.offer.createdBy && <span>Rep: {a.offer.createdBy.name}</span>}
                  <span className="uppercase tracking-wide">
                    {a.approverRole.replace("_", " ")}
                  </span>
                </div>
              </div>
              {showActions && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canDecide && (
                    <>
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => decide(a.id, "approved")}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === a.id}
                        onClick={() => decide(a.id, "rejected")}
                        className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <Link
                    href={
                      a.offer.deal ? `/deals?deal=${a.offer.deal.id}&offer=${a.offer.id}` : "/deals"
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent"
                  >
                    Review
                  </Link>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
