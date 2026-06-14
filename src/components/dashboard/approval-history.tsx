"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CardMoney } from "@/components/ui/card-money";
import { formatRelative } from "@/lib/format";
import { MONEY } from "@/lib/money-labels";
import Link from "next/link";

export type ApprovalHistoryRow = {
  id: string;
  status: string;
  approverRole: string;
  decidedAt: Date | string | null;
  approver: { name: string } | null;
  offer: {
    id: string;
    version: number;
    total: string;
    status: string;
    discountPercent: string | null;
    account: { name: string };
    deal: { id: string; title: string } | null;
    createdBy: { name: string } | null;
    approvals: Array<{ approverRole: string; status: string }>;
  };
};

function followUpLabel(offer: ApprovalHistoryRow["offer"], decisionStatus: string) {
  if (decisionStatus === "rejected") return null;
  const finance = offer.approvals.find((a) => a.approverRole === "finance");
  if (offer.status === "approved") return "Fully approved";
  if (finance?.status === "pending") return "Awaiting finance";
  if (finance?.status === "rejected") return "Rejected by finance";
  if (offer.status === "submitted") return "In approval";
  return null;
}

export function ApprovalHistory({ rows }: { rows: ApprovalHistoryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No approval history yet.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((a) => {
        const followUp = followUpLabel(a.offer, a.status);
        return (
          <Card key={a.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={a.status === "approved" ? "success" : "danger"}>
                    You {a.status}
                  </Badge>
                  <Badge variant="default">Offer v{a.offer.version}</Badge>
                  {followUp && (
                    <Badge variant={followUp === "Fully approved" ? "success" : "warning"}>
                      {followUp}
                    </Badge>
                  )}
                </div>
                <p className="font-medium">{a.offer.deal?.title ?? "Offer"}</p>
                <p className="text-sm text-muted">{a.offer.account.name}</p>
                <div className="mt-2 flex flex-wrap items-end gap-3 text-xs text-muted">
                  <CardMoney
                    amount={a.offer.total}
                    label={MONEY.offerTotal.label}
                    hint={MONEY.offerTotal.hint}
                    size="sm"
                  />
                  {a.offer.createdBy && <span>Rep: {a.offer.createdBy.name}</span>}
                  {a.decidedAt && <span>{formatRelative(a.decidedAt)}</span>}
                </div>
              </div>
              {a.offer.deal && (
                <Link
                  href={`/deals?deal=${a.offer.deal.id}&offer=${a.offer.id}`}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-accent"
                >
                  View offer
                </Link>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
