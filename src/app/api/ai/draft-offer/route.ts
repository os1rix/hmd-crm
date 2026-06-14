import { callAi } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";
import {
  type CatalogSnapshot,
  buildFallbackDraft,
  buildFallbackJustification,
  catalogForAi,
  extractDraftFromAiText,
  resolveDraftLineItems,
} from "@/lib/draft-offer";

const AI_DRAFT_SYSTEM = [
  "You draft B2B hardware + services offers for HMD Secure CRM.",
  "Reply with ONLY valid JSON (no markdown).",
  "Required shape:",
  '{"lineItems":[{"itemType":"product"|"service","itemId":"uuid-from-catalog","name":"string","quantity":number,"unitPrice":"decimal string"}],"justification":"string"}',
  "justification is REQUIRED: 3–6 sentences explaining WHY each product and service was chosen,",
  "why those quantities fit the deal/account, and how the bundle addresses the customer need.",
  "Reference each line item by name in the justification.",
  "Use itemId values exactly from the catalog.",
].join(" ");

export async function POST(request: Request) {
  const body = (await request.json()) as {
    dealTitle: string;
    accountName: string;
    catalog: CatalogSnapshot;
  };

  const { dealTitle, accountName, catalog } = body;
  if (!catalog?.products?.length && !catalog?.services?.length) {
    return apiError("Catalog is required", 400);
  }

  try {
    let lineItems = buildFallbackDraft(catalog, dealTitle);
    let justification = buildFallbackJustification(lineItems, dealTitle, accountName);
    let source: "ai" | "fallback" = "fallback";

    try {
      const text = await callAi(AI_DRAFT_SYSTEM, [
        {
          role: "user",
          content: `Deal: ${dealTitle}\nAccount: ${accountName}\nCatalog:\n${JSON.stringify(catalogForAi(catalog), null, 2)}`,
        },
      ]);

      const draft = extractDraftFromAiText(text);
      const raw = draft?.lineItems ?? [];
      const resolved = resolveDraftLineItems(catalog, raw);
      const aiJustification = draft?.justification?.trim();

      if (resolved.length > 0 && aiJustification) {
        lineItems = resolved;
        justification = aiJustification;
        source = "ai";
      } else if (resolved.length > 0) {
        lineItems = resolved;
        justification = buildFallbackJustification(resolved, dealTitle, accountName);
      }
    } catch {
      // Keep heuristic fallback when AI is unavailable or errors.
    }

    return apiSuccess({ lineItems, justification, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
