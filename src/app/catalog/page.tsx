"use client";

import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/fetch-client";
import { formatEuro } from "@/lib/format";
import { useEffect, useState } from "react";

type Catalog = {
  products: Array<{ id: string; sku: string; name: string; unitPrice: string; isActive: boolean }>;
  services: Array<{
    id: string;
    name: string;
    serviceType: string;
    invoicingModel: string;
    isActive: boolean;
  }>;
};

const DISCOUNT_TIERS = [
  { label: "Standard (1–49 units)", percent: 0 },
  { label: "Volume (50–199 units)", percent: 5 },
  { label: "Strategic (200+ units)", percent: 12 },
  { label: "Reseller channel add-on", percent: 8 },
];

function discounted(price: string, percent: number) {
  const base = Number.parseFloat(price);
  return base * (1 - percent / 100);
}

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [units, setUnits] = useState(100);
  const [channelDiscount, setChannelDiscount] = useState(false);

  useEffect(() => {
    fetchJson<Catalog>("/api/catalog", { products: [], services: [] }).then(setCatalog);
  }, []);

  if (!catalog) return <div className="p-6 text-muted">Loading catalog…</div>;

  const volumeTier =
    units >= 200 ? DISCOUNT_TIERS[2] : units >= 50 ? DISCOUNT_TIERS[1] : DISCOUNT_TIERS[0];
  const totalDiscount = volumeTier.percent + (channelDiscount ? DISCOUNT_TIERS[3].percent : 0);

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Product & service catalog</h1>
      <p className="mb-6 text-sm text-muted">
        List prices with volume and reseller discounts for offer building.
      </p>

      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-medium">Discount calculator</h2>
        <div className="mb-4 flex flex-wrap gap-4">
          <label className="text-sm">
            Units
            <input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value) || 1)}
              className="ml-2 w-24 rounded-lg border border-border bg-background px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={channelDiscount}
              onChange={(e) => setChannelDiscount(e.target.checked)}
            />
            Reseller channel (+8%)
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_TIERS.map((tier) => (
            <Badge
              key={tier.label}
              variant={tier.percent === volumeTier.percent ? "accent" : "default"}
            >
              {tier.label}: {tier.percent}%
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-accent">
          Applied discount: <strong>{totalDiscount}%</strong> ({volumeTier.label}
          {channelDiscount ? " + reseller" : ""})
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-medium">Devices & products</h2>
          <div className="space-y-3">
            {catalog.products.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular-nums text-muted line-through">
                      {formatEuro(p.unitPrice)}
                    </p>
                    <p className="font-mono text-sm tabular-nums text-accent">
                      {formatEuro(discounted(p.unitPrice, totalDiscount))}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={p.isActive ? "success" : "default"}>
                    {p.isActive ? "Active" : "Retired"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-medium">Services</h2>
          <div className="space-y-3">
            {catalog.services.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{s.name}</p>
                <div className="mt-2 flex gap-2">
                  <Badge>{s.serviceType.replaceAll("_", " ")}</Badge>
                  <Badge variant="accent">{s.invoicingModel.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Services priced per SOW — apply {totalDiscount}% volume discount in offer builder.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
