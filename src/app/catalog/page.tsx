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

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    fetchJson<Catalog>("/api/catalog", { products: [], services: [] }).then(setCatalog);
  }, []);

  if (!catalog) return <div className="p-6 text-muted">Loading catalog…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Product & service catalog</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-medium">Devices & products</h2>
          <div className="space-y-3">
            {catalog.products.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.sku}</p>
                  </div>
                  <p className="font-mono text-sm tabular-nums">{formatEuro(p.unitPrice)}</p>
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
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
