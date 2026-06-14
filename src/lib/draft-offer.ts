import { parseAiJson } from "@/lib/parse-ai-json";

export type CatalogProduct = { id: string; name: string; unitPrice: string };
export type CatalogService = { id: string; name: string; unitPrice: string };

export type CatalogSnapshot = {
  products: CatalogProduct[];
  services: CatalogService[];
};

export type ResolvedLineItem = {
  itemType: "product" | "service";
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
};

type RawAiLine = {
  itemType?: string;
  itemId?: string;
  name?: string;
  quantity?: number | string;
  unitPrice?: number | string;
};

function normalizeItemType(raw?: string): "product" | "service" | null {
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (t === "product" || t === "device" || t === "hardware") return "product";
  if (t === "service") return "service";
  return null;
}

function findByName<T extends { name: string }>(rows: T[], name?: string): T | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return (
    rows.find((r) => r.name.toLowerCase() === lower) ??
    rows.find((r) => r.name.toLowerCase().includes(lower) || lower.includes(r.name.toLowerCase()))
  );
}

export function resolveDraftLineItems(
  catalog: CatalogSnapshot,
  rawItems: RawAiLine[],
): ResolvedLineItem[] {
  const resolved: ResolvedLineItem[] = [];

  for (const row of rawItems) {
    const type = normalizeItemType(row.itemType) ?? (row.name ? "product" : null);
    if (!type) continue;

    if (type === "product") {
      const product =
        catalog.products.find((p) => p.id === row.itemId) ?? findByName(catalog.products, row.name);
      if (!product) continue;
      resolved.push({
        itemType: "product",
        itemId: product.id,
        name: product.name,
        quantity: Math.max(1, Number(row.quantity) || 1),
        unitPrice: String(row.unitPrice ?? product.unitPrice),
      });
    } else {
      const service =
        catalog.services.find((s) => s.id === row.itemId) ?? findByName(catalog.services, row.name);
      if (!service) continue;
      resolved.push({
        itemType: "service",
        itemId: service.id,
        name: service.name,
        quantity: Math.max(1, Number(row.quantity) || 1),
        unitPrice: String(row.unitPrice ?? service.unitPrice),
      });
    }
  }

  return resolved;
}

export function buildFallbackDraft(
  catalog: CatalogSnapshot,
  dealTitle: string,
): ResolvedLineItem[] {
  const title = dealTitle.toLowerCase();
  const large = /enterprise|nordic|global|deployment|rollout|500|1000/.test(title);
  const qty = large ? 250 : 50;

  const device =
    catalog.products.find((p) => p.name.includes("X2")) ??
    catalog.products.find((p) => p.name.includes("X1")) ??
    catalog.products[0];
  const onboarding =
    catalog.services.find((s) => s.name.toLowerCase().includes("mdm")) ?? catalog.services[0];
  const support =
    catalog.services.find((s) => s.name.toLowerCase().includes("support")) ?? catalog.services[1];

  const items: ResolvedLineItem[] = [];
  if (device) {
    items.push({
      itemType: "product",
      itemId: device.id,
      name: device.name,
      quantity: qty,
      unitPrice: device.unitPrice,
    });
  }
  if (onboarding) {
    items.push({
      itemType: "service",
      itemId: onboarding.id,
      name: onboarding.name,
      quantity: 1,
      unitPrice: onboarding.unitPrice,
    });
  }
  if (support && !title.includes("pilot")) {
    items.push({
      itemType: "service",
      itemId: support.id,
      name: support.name,
      quantity: 12,
      unitPrice: support.unitPrice,
    });
  }
  return items;
}

export function buildFallbackJustification(
  lineItems: ResolvedLineItem[],
  dealTitle: string,
  accountName: string,
): string {
  const parts = lineItems.map((item) => {
    const kind = item.itemType === "product" ? "Device" : "Service";
    return `${kind} — ${item.name} (×${item.quantity}): selected for ${accountName}'s "${dealTitle}" based on typical ${item.itemType === "product" ? "fleet size and device tier" : "deployment and support"} needs for this deal profile.`;
  });
  return parts.join(" ");
}

type AiDraftPayload = {
  lineItems?: RawAiLine[];
  justification?: string;
};

export function extractDraftFromAiText(text: string): AiDraftPayload | null {
  const parsed = parseAiJson<AiDraftPayload | RawAiLine[]>(text);
  if (!parsed) return null;
  if (Array.isArray(parsed)) {
    return { lineItems: parsed };
  }
  return {
    lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
    justification: typeof parsed.justification === "string" ? parsed.justification : undefined,
  };
}

export function extractLineItemsFromAiText(text: string): RawAiLine[] {
  const draft = extractDraftFromAiText(text);
  if (!draft?.lineItems) return [];
  return draft.lineItems;
}

export function catalogForAi(catalog: CatalogSnapshot) {
  return {
    products: catalog.products.map((p) => ({
      itemType: "product",
      itemId: p.id,
      name: p.name,
      unitPrice: p.unitPrice,
    })),
    services: catalog.services.map((s) => ({
      itemType: "service",
      itemId: s.id,
      name: s.name,
      unitPrice: s.unitPrice,
    })),
  };
}
