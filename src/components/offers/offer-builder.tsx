"use client";

import { useToast } from "@/components/ui/toast";
import { requestJson } from "@/lib/api-client";
import { formatEuro } from "@/lib/format";
import { useMemo, useState } from "react";

type Catalog = {
  products: Array<{ id: string; name: string; unitPrice: string }>;
  services: Array<{ id: string; name: string; unitPrice: string }>;
};

type LineItem = {
  itemType: "product" | "service";
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
};

export type OfferBuilderInitial = {
  lineItems: LineItem[];
  discount: number;
  selectionRationale?: string;
  discountJustification?: string;
  version?: number;
};

export function OfferBuilder({
  catalog,
  dealTitle,
  accountName,
  onSubmit,
  onDraft,
  initial,
  compact = false,
}: {
  catalog: Catalog | null;
  dealTitle: string;
  accountName: string;
  onSubmit: (items: LineItem[], discount: number, justification: string) => Promise<void>;
  onDraft: (items: LineItem[], discount: number, justification: string) => Promise<void>;
  initial?: OfferBuilderInitial;
  compact?: boolean;
}) {
  const toast = useToast();
  const [items, setItems] = useState<LineItem[]>(initial?.lineItems ?? []);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [productQty, setProductQty] = useState(1);
  const [serviceQty, setServiceQty] = useState(1);
  const [discount, setDiscount] = useState(initial?.discount ?? 0);
  const [justification, setJustification] = useState(initial?.discountJustification ?? "");
  const [selectionRationale, setSelectionRationale] = useState(initial?.selectionRationale ?? "");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedProductRow = catalog?.products.find((p) => p.id === selectedProduct);
  const selectedServiceRow = catalog?.services.find((s) => s.id === selectedService);
  const productLineTotal = selectedProductRow
    ? productQty * Number.parseFloat(selectedProductRow.unitPrice)
    : 0;
  const serviceLineTotal = selectedServiceRow
    ? serviceQty * Number.parseFloat(selectedServiceRow.unitPrice)
    : 0;

  function addProduct() {
    const product = catalog?.products.find((p) => p.id === selectedProduct);
    if (!product || productQty < 1) return;
    setItems((prev) => [
      ...prev,
      {
        itemType: "product",
        itemId: product.id,
        name: product.name,
        quantity: productQty,
        unitPrice: product.unitPrice,
      },
    ]);
    setSelectedProduct("");
    setProductQty(1);
  }

  function addService() {
    const service = catalog?.services.find((s) => s.id === selectedService);
    if (!service || serviceQty < 1) return;
    setItems((prev) => [
      ...prev,
      {
        itemType: "service",
        itemId: service.id,
        name: service.name,
        quantity: serviceQty,
        unitPrice: service.unitPrice,
      },
    ]);
    setSelectedService("");
    setServiceQty(1);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItemQty(index: number, quantity: number) {
    if (quantity < 1) return;
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)));
  }

  function buildOfferNotes() {
    const parts: string[] = [];
    if (selectionRationale.trim()) {
      parts.push(`Product & service selection:\n${selectionRationale.trim()}`);
    }
    if (discount > 0 && justification.trim()) {
      parts.push(`Discount (${discount}%):\n${justification.trim()}`);
    }
    return parts.join("\n\n") || undefined;
  }

  function buildPendingItems(): LineItem[] {
    const pending: LineItem[] = [];
    if (selectedProduct && selectedProductRow && productQty >= 1) {
      pending.push({
        itemType: "product",
        itemId: selectedProductRow.id,
        name: selectedProductRow.name,
        quantity: productQty,
        unitPrice: selectedProductRow.unitPrice,
      });
    }
    if (selectedService && selectedServiceRow && serviceQty >= 1) {
      pending.push({
        itemType: "service",
        itemId: selectedServiceRow.id,
        name: selectedServiceRow.name,
        quantity: serviceQty,
        unitPrice: selectedServiceRow.unitPrice,
      });
    }
    return pending;
  }

  function effectiveItems(): LineItem[] {
    return [...items, ...buildPendingItems()];
  }

  async function draftWithAi() {
    if (!catalog) {
      toast("Catalog not loaded yet", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await requestJson<{
        lineItems: LineItem[];
        justification: string;
        source?: string;
      }>("/api/ai/draft-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealTitle, accountName, catalog }),
      });
      if (!data.lineItems?.length) {
        toast("AI returned no line items — try adding manually", "error");
        return;
      }
      setItems(data.lineItems);
      setSelectionRationale(data.justification?.trim() ?? "");
      toast(data.source === "ai" ? "AI draft with rationale applied" : "Suggested draft applied");
    } catch (err) {
      toast(err instanceof Error ? err.message : "AI draft failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const linesForTotals = useMemo(() => {
    const pending: LineItem[] = [];
    if (selectedProduct && selectedProductRow && productQty >= 1) {
      pending.push({
        itemType: "product",
        itemId: selectedProductRow.id,
        name: selectedProductRow.name,
        quantity: productQty,
        unitPrice: selectedProductRow.unitPrice,
      });
    }
    if (selectedService && selectedServiceRow && serviceQty >= 1) {
      pending.push({
        itemType: "service",
        itemId: selectedServiceRow.id,
        name: selectedServiceRow.name,
        quantity: serviceQty,
        unitPrice: selectedServiceRow.unitPrice,
      });
    }
    return [...items, ...pending];
  }, [
    items,
    selectedProduct,
    selectedProductRow,
    selectedService,
    selectedServiceRow,
    productQty,
    serviceQty,
  ]);

  const deviceTotal = useMemo(
    () =>
      linesForTotals
        .filter((i) => i.itemType === "product")
        .reduce((sum, item) => sum + item.quantity * Number.parseFloat(item.unitPrice), 0),
    [linesForTotals],
  );

  const serviceTotal = useMemo(
    () =>
      linesForTotals
        .filter((i) => i.itemType === "service")
        .reduce((sum, item) => sum + item.quantity * Number.parseFloat(item.unitPrice), 0),
    [linesForTotals],
  );

  const subtotal = deviceTotal + serviceTotal;
  const total = subtotal - (discount ? subtotal * (discount / 100) : 0);
  const canSave = linesForTotals.length > 0;

  async function handleDraft() {
    const lineItems = effectiveItems();
    if (!lineItems.length) {
      toast("Add at least one device or service line", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onDraft(lineItems, discount, buildOfferNotes() ?? "");
      toast(initial?.version ? "Draft updated" : "Draft saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save draft", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    const lineItems = effectiveItems();
    if (!lineItems.length) {
      toast("Add at least one device or service line", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(lineItems, discount, buildOfferNotes() ?? "");
      toast("Offer submitted for approval");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to submit offer", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`border border-border bg-surface p-4 ${compact ? "" : "mt-4"}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {initial?.version ? `Edit draft v${initial.version}` : "Offer"}
        </h3>
        <button
          type="button"
          onClick={draftWithAi}
          disabled={loading || !catalog}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          {loading ? "Drafting…" : "Draft with AI"}
        </button>
      </div>

      <div className="overflow-x-auto border border-border bg-background">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/40 text-[11px] uppercase tracking-wide text-section">
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Item</th>
              <th className="p-2 font-medium text-right">Qty</th>
              <th className="p-2 font-medium text-right">Unit</th>
              <th className="p-2 font-medium text-right">Total</th>
              <th className="w-8 p-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !buildPendingItems().length && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-sm text-muted">
                  No lines yet — select a device or service below and save, or use Draft with AI
                </td>
              </tr>
            )}
            {items.map((item, i) => (
              <tr key={`${item.itemId}-${i}`} className="border-b border-border/60">
                <td className="p-2">
                  <span className={item.itemType === "product" ? "text-accent" : "text-[#06b6d4]"}>
                    {item.itemType === "product" ? "Device" : "Service"}
                  </span>
                </td>
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItemQty(i, Number(e.target.value) || 1)}
                    className="w-16 border border-border bg-background px-2 py-1 text-right font-mono text-sm tabular-nums"
                  />
                </td>
                <td className="p-2 text-right font-mono tabular-nums">
                  {formatEuro(item.unitPrice)}
                </td>
                <td className="p-2 text-right font-mono tabular-nums">
                  {formatEuro(item.quantity * Number.parseFloat(item.unitPrice))}
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs text-muted hover:text-danger"
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {buildPendingItems().map((item, i) => (
              <tr
                key={`pending-${item.itemId}-${i}`}
                className="border-b border-dashed border-border/60 bg-surface/10"
              >
                <td className="p-2">
                  <span className={item.itemType === "product" ? "text-accent" : "text-[#06b6d4]"}>
                    {item.itemType === "product" ? "Device" : "Service"}
                  </span>
                </td>
                <td className="p-2 text-muted">{item.name}</td>
                <td className="p-2 text-right font-mono text-sm tabular-nums text-muted">
                  {item.quantity}
                </td>
                <td className="p-2 text-right font-mono tabular-nums text-muted">
                  {formatEuro(item.unitPrice)}
                </td>
                <td className="p-2 text-right font-mono tabular-nums text-muted">
                  {formatEuro(item.quantity * Number.parseFloat(item.unitPrice))}
                </td>
                <td className="p-2 text-center text-xs text-muted">pending</td>
              </tr>
            ))}

            {catalog && (
              <>
                <tr className="border-t border-border bg-surface/20">
                  <td className="p-2 text-xs text-accent">+ Device</td>
                  <td className="p-2">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full min-w-[140px] border border-border bg-background px-2 py-1 text-sm"
                    >
                      <option value="">Select product…</option>
                      {catalog.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatEuro(p.unitPrice)})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      min={1}
                      value={productQty}
                      onChange={(e) => setProductQty(Number(e.target.value) || 1)}
                      className="w-16 border border-border bg-background px-2 py-1 text-right font-mono text-sm tabular-nums"
                    />
                  </td>
                  <td className="p-2 text-right font-mono text-xs tabular-nums text-muted">
                    {selectedProductRow ? formatEuro(selectedProductRow.unitPrice) : "—"}
                  </td>
                  <td className="p-2 text-right font-mono text-xs tabular-nums text-accent">
                    {selectedProductRow ? formatEuro(productLineTotal) : "—"}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={addProduct}
                      disabled={!selectedProduct}
                      className="text-xs text-accent hover:underline disabled:opacity-40"
                    >
                      Add
                    </button>
                  </td>
                </tr>
                <tr className="bg-surface/20">
                  <td className="p-2 text-xs text-[#06b6d4]">+ Service</td>
                  <td className="p-2">
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full min-w-[140px] border border-border bg-background px-2 py-1 text-sm"
                    >
                      <option value="">Select service…</option>
                      {catalog.services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({formatEuro(s.unitPrice)})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <input
                      type="number"
                      min={1}
                      value={serviceQty}
                      onChange={(e) => setServiceQty(Number(e.target.value) || 1)}
                      className="w-16 border border-border bg-background px-2 py-1 text-right font-mono text-sm tabular-nums"
                    />
                  </td>
                  <td className="p-2 text-right font-mono text-xs tabular-nums text-muted">
                    {selectedServiceRow ? formatEuro(selectedServiceRow.unitPrice) : "—"}
                  </td>
                  <td className="p-2 text-right font-mono text-xs tabular-nums text-[#06b6d4]">
                    {selectedServiceRow ? formatEuro(serviceLineTotal) : "—"}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={addService}
                      disabled={!selectedService}
                      className="text-xs text-[#06b6d4] hover:underline disabled:opacity-40"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              </>
            )}
          </tbody>
          {linesForTotals.length > 0 && (
            <tfoot className="text-xs">
              <tr className="border-t border-border">
                <td colSpan={4} className="p-2 text-muted">
                  Device subtotal
                </td>
                <td className="p-2 text-right font-mono tabular-nums text-accent">
                  {formatEuro(deviceTotal)}
                </td>
                <td />
              </tr>
              <tr>
                <td colSpan={4} className="p-2 text-muted">
                  Service subtotal
                </td>
                <td className="p-2 text-right font-mono tabular-nums text-[#06b6d4]">
                  {formatEuro(serviceTotal)}
                </td>
                <td />
              </tr>
              <tr className="text-sm font-medium">
                <td colSpan={4} className="p-2">
                  Offer total
                </td>
                <td className="p-2 text-right font-mono tabular-nums">{formatEuro(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {selectionRationale && (
        <div className="mb-3 border border-accent/30 bg-accent/5 p-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-accent">
            Why these products & services
          </p>
          <textarea
            value={selectionRationale}
            onChange={(e) => setSelectionRationale(e.target.value)}
            rows={4}
            className="w-full border border-border bg-background px-3 py-2 text-sm leading-relaxed"
            placeholder="AI explains device and service choices for this deal…"
          />
        </div>
      )}

      <div className="mt-3 grid gap-2">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="Discount % (optional)"
          value={discount || ""}
          onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
          className="border border-border bg-background px-3 py-2 text-sm"
        />
        {discount > 0 && (
          <input
            placeholder="Discount justification (optional)"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="border border-border bg-background px-3 py-2 text-sm"
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canSave || submitting}
            onClick={handleDraft}
            className="flex-1 border border-border py-2 text-sm hover:border-accent disabled:opacity-40"
          >
            {submitting ? "Saving…" : initial?.version ? "Update draft" : "Save as draft"}
          </button>
          <button
            type="button"
            disabled={!canSave || submitting}
            onClick={handleSubmit}
            className="flex-1 bg-accent py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit for approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
