"use client";

import { Badge } from "@/components/ui/badge";
import { CardMoney } from "@/components/ui/card-money";
import { formatEuro } from "@/lib/format";
import { MONEY } from "@/lib/money-labels";
import { canDecideOfferApproval } from "@/lib/offer-approvals";
import type { SessionUser } from "@/lib/session";

type OfferLine = {
  itemType: "product" | "service";
  name: string;
  quantity: number;
  unitPrice: string;
};

type Offer = {
  id: string;
  version: number;
  total: string;
  subtotal: string;
  status: string;
  discountPercent: string | null;
  discountJustification: string | null;
  isLocked: boolean;
  createdAt: string;
  lineItems: OfferLine[];
  createdBy: { id: string; name: string; email: string } | null;
  approvals: Array<{ id: string; approverRole: string; status: string }>;
};

export function OfferReviewPanel({
  offer,
  dealTitle,
  accountName,
  ownerName,
  user,
  onApprove,
  onReject,
  viewOnly = false,
}: {
  offer: Offer;
  dealTitle: string;
  accountName: string;
  ownerName: string;
  user: SessionUser | null;
  onApprove: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  viewOnly?: boolean;
}) {
  const deviceLines = offer.lineItems.filter((l) => l.itemType === "product");
  const serviceLines = offer.lineItems.filter((l) => l.itemType === "service");
  const deviceTotal = deviceLines.reduce(
    (s, l) => s + l.quantity * Number.parseFloat(l.unitPrice),
    0,
  );
  const serviceTotal = serviceLines.reduce(
    (s, l) => s + l.quantity * Number.parseFloat(l.unitPrice),
    0,
  );
  const pendingApproval = viewOnly
    ? undefined
    : offer.approvals.find((a) => a.status === "pending" && canDecideOfferApproval(user?.role, a));
  const discountPct = offer.discountPercent ? Number.parseFloat(offer.discountPercent) : 0;
  const discountAmount = discountPct ? (deviceTotal + serviceTotal) * (discountPct / 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-section">Offer review</p>
        <h2 className="mt-1 text-lg font-semibold">{dealTitle}</h2>
        <p className="text-sm text-muted">{accountName}</p>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="border border-border bg-surface/40 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">Submitted by</p>
          <p className="mt-1 font-medium">{offer.createdBy?.name ?? "Unknown"}</p>
          {offer.createdBy?.email && <p className="text-xs text-muted">{offer.createdBy.email}</p>}
        </div>
        <div className="border border-border bg-surface/40 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">Deal owner</p>
          <p className="mt-1 font-medium">{ownerName}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Offer v{offer.version}</span>
        <Badge variant={offer.status === "submitted" ? "warning" : "accent"}>{offer.status}</Badge>
        {offer.isLocked && <Badge variant="default">In approval</Badge>}
        <CardMoney
          amount={offer.total}
          label={MONEY.offerTotal.label}
          hint={MONEY.offerTotal.hint}
          align="right"
          size="lg"
          className="ml-auto"
        />
      </div>

      {offer.discountPercent && (
        <p className="text-sm text-warning">{offer.discountPercent}% discount</p>
      )}

      {offer.discountJustification && (
        <div className="border border-border bg-surface/30 p-3 text-sm">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-section">
            Offer notes
          </p>
          <p className="whitespace-pre-wrap leading-relaxed text-muted">
            {offer.discountJustification}
          </p>
        </div>
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/40 text-[11px] uppercase tracking-wide text-section">
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Item</th>
              <th className="p-2 font-medium text-right">Qty</th>
              <th className="p-2 font-medium text-right">Unit</th>
              <th className="p-2 font-medium text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {offer.lineItems.map((line, i) => (
              <tr key={`${line.name}-${i}`} className="border-b border-border/60">
                <td className="p-2">
                  <span className={line.itemType === "product" ? "text-accent" : "text-[#06b6d4]"}>
                    {line.itemType === "product" ? "Device" : "Service"}
                  </span>
                </td>
                <td className="p-2">{line.name}</td>
                <td className="p-2 text-right font-mono tabular-nums">{line.quantity}</td>
                <td className="p-2 text-right font-mono tabular-nums">
                  {formatEuro(line.unitPrice)}
                </td>
                <td className="p-2 text-right font-mono tabular-nums">
                  {formatEuro(line.quantity * Number.parseFloat(line.unitPrice))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-xs">
            <tr className="border-t border-border">
              <td colSpan={4} className="p-2 text-muted">
                Device subtotal
              </td>
              <td className="p-2 text-right font-mono tabular-nums text-accent">
                {formatEuro(deviceTotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="p-2 text-muted">
                Service subtotal
              </td>
              <td className="p-2 text-right font-mono tabular-nums text-[#06b6d4]">
                {formatEuro(serviceTotal)}
              </td>
            </tr>
            <tr className="border-t border-border">
              <td colSpan={4} className="p-2 text-muted">
                Subtotal
              </td>
              <td className="p-2 text-right font-mono tabular-nums">
                {formatEuro(deviceTotal + serviceTotal)}
              </td>
            </tr>
            {discountPct > 0 && (
              <tr>
                <td colSpan={4} className="p-2 text-warning">
                  Discount ({offer.discountPercent}%)
                </td>
                <td className="p-2 text-right font-mono tabular-nums text-warning">
                  −{formatEuro(discountAmount)}
                </td>
              </tr>
            )}
            <tr className="text-sm font-medium">
              <td colSpan={4} className="p-2">
                Offer total
              </td>
              <td className="p-2 text-right font-mono tabular-nums">{formatEuro(offer.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wide text-section">Approval status</p>
        <div className="flex flex-wrap gap-2">
          {offer.approvals.map((a) => (
            <Badge
              key={a.id}
              variant={
                a.status === "approved" ? "success" : a.status === "rejected" ? "danger" : "warning"
              }
            >
              {a.approverRole.replace("_", " ")}: {a.status}
            </Badge>
          ))}
        </div>
      </div>

      {!viewOnly &&
        (pendingApproval ? (
          <div className="flex gap-2 border border-border bg-surface/30 p-4">
            <button
              type="button"
              onClick={() => onApprove(pendingApproval.id)}
              className="flex-1 bg-accent py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              Approve offer
            </button>
            <button
              type="button"
              onClick={() => onReject(pendingApproval.id)}
              className="flex-1 border border-danger/50 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Reject offer
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">
            No pending approval step for your role on this offer.
          </p>
        ))}
    </div>
  );
}
