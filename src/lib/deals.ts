export type DealStage =
  | "interest_shown"
  | "rfi_answered"
  | "rfp_offer_given"
  | "customer_test"
  | "contract_negotiation"
  | "won"
  | "lost";

export type DealChannel = "direct" | "reseller";

export const STAGE_LABELS: Record<DealStage, string> = {
  interest_shown: "Interest",
  rfi_answered: "RFI answered",
  rfp_offer_given: "RFP / offer given",
  customer_test: "Customer test",
  contract_negotiation: "Contract negotiation",
  won: "Won",
  lost: "Lost",
};

export const STAGE_PROBABILITY: Record<DealStage, number> = {
  interest_shown: 0.1,
  rfi_answered: 0.2,
  rfp_offer_given: 0.4,
  customer_test: 0.7,
  contract_negotiation: 0.85,
  won: 1,
  lost: 0,
};

export const DIRECT_STAGES: DealStage[] = [
  "interest_shown",
  "rfi_answered",
  "rfp_offer_given",
  "customer_test",
  "contract_negotiation",
  "won",
  "lost",
];

export const RESELLER_STAGES: DealStage[] = [
  "interest_shown",
  "rfi_answered",
  "rfp_offer_given",
  "customer_test",
  "won",
  "lost",
];

export function stagesForChannel(channel: DealChannel): DealStage[] {
  return channel === "reseller" ? RESELLER_STAGES : DIRECT_STAGES;
}

export function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const then = new Date(date).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function isDealAtRisk(deal: {
  lastActivityAt: Date | string;
  expectedCloseDate?: Date | string | null;
  stage: DealStage;
}): boolean {
  if (deal.stage === "won" || deal.stage === "lost") return false;
  const stale = daysSince(deal.lastActivityAt) >= 14;
  const overdue =
    deal.expectedCloseDate != null && new Date(deal.expectedCloseDate).getTime() < Date.now();
  return stale || overdue;
}

export function dealTotalValue(
  quarterlyForecast: { deviceRevenue: number; serviceRevenue: number }[] | null | undefined,
): number {
  if (!quarterlyForecast?.length) return 0;
  return quarterlyForecast.reduce((sum, q) => sum + q.deviceRevenue + q.serviceRevenue, 0);
}

export function weightedValue(
  quarterlyForecast: { deviceRevenue: number; serviceRevenue: number }[] | null | undefined,
  stage: DealStage,
): number {
  return dealTotalValue(quarterlyForecast) * STAGE_PROBABILITY[stage];
}
