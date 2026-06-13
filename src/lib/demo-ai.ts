import type { DealStage } from "@/lib/deals";
import { STAGE_LABELS, daysSince } from "@/lib/deals";

type DealContext = {
  title: string;
  accountName: string;
  stage: DealStage;
  lastActivityAt: Date | string;
  contactHint?: string;
};

export function demoNextAction(deal: DealContext): {
  action: string;
  topics: string[];
  email: string;
} {
  const idle = daysSince(deal.lastActivityAt);
  const stageLabel = STAGE_LABELS[deal.stage];

  const topicsByStage: Record<DealStage, string[]> = {
    interest_shown: [
      "Confirm pain points around device lifecycle & patch cadence",
      "Identify economic buyer vs technical champion",
      "Propose 30-min discovery with security + ops stakeholders",
    ],
    rfi_answered: [
      "Close gaps from RFI responses before RFP deadline",
      "Align catalog bundle (devices + MDM + SOC) to stated requirements",
      "Confirm evaluation timeline and pilot scope",
    ],
    rfp_offer_given: [
      "Follow up on pricing & discount approval status",
      "Offer reference call with similar Nordic deployment",
      "Clarify SLA and support escalation path",
    ],
    customer_test: [
      "Review pilot KPIs (patch latency, MDM enrollment success)",
      "Schedule weekly check-in during test window",
      "Prepare contract draft aligned to test outcomes",
    ],
    contract_negotiation: [
      "Resolve redlines on liability & data residency",
      "Confirm volume tiers and 3-year service ramp",
      "Align signature date with customer fiscal calendar",
    ],
    won: ["Plan kickoff & deployment kit logistics", "Hand off to TAM for onboarding"],
    lost: ["Capture loss reason for forecast hygiene", "Schedule 6-month re-engagement"],
  };

  const actionByStage: Record<DealStage, string> = {
    interest_shown: `Book a discovery call — ${idle}d since last touch on ${deal.accountName}.`,
    rfi_answered: "Send RFI follow-up summarizing HMD Secure differentiators vs status-quo MDM.",
    rfp_offer_given: "Chase RFP decision-maker; offer executive briefing on 3-year TCO model.",
    customer_test: "Review pilot metrics and propose expansion units for Q3 rollout.",
    contract_negotiation: "Escalate final commercial terms — deal is in late stage.",
    won: "Coordinate delivery kickoff with customer ops team.",
    lost: "Log win/loss notes and set nurture reminder for next quarter.",
  };

  const contact = deal.contactHint ?? "there";

  return {
    action: actionByStage[deal.stage],
    topics: topicsByStage[deal.stage],
    email: `Subject: ${deal.title} — next steps (${stageLabel})

Hi ${contact},

Following up on our ${deal.title} discussion for ${deal.accountName}. Based on where we are in ${stageLabel.toLowerCase()}, I'd suggest we:

${topicsByStage[deal.stage].map((t) => `• ${t}`).join("\n")}

Would any of these times work for a 25-minute call this week?

Best regards,
HMD Secure Sales`,
  };
}
