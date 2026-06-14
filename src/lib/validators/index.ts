import { z } from "zod";

export const userRoleSchema = z.enum(["sales_rep", "tam", "sales_manager", "finance"]);

export const dealChannelSchema = z.enum(["direct", "reseller"]);

export const dealStageSchema = z.enum([
  "interest_shown",
  "rfi_answered",
  "rfp_offer_given",
  "customer_test",
  "contract_negotiation",
  "won",
  "lost",
]);

export const caseStatusSchema = z.enum(["open", "in_progress", "escalated", "resolved", "closed"]);

export const casePrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
  segment: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  channel: dealChannelSchema.default("direct"),
  ownerId: z.string().uuid().optional(),
});

const quarterlyForecastSchema = z.array(
  z.object({
    quarter: z.string(),
    deviceRevenue: z.number().nonnegative(),
    serviceRevenue: z.number().nonnegative(),
  }),
);

export const createDealSchema = z.object({
  accountId: z.string().uuid(),
  ownerId: z.string().uuid(),
  title: z.string().min(1).max(255),
  channel: dealChannelSchema.default("direct"),
  stage: dealStageSchema.default("interest_shown"),
  expectedCloseDate: z.coerce.date().optional(),
  threeYearForecast: z.coerce.number().nonnegative().optional(),
  quarterlyForecast: quarterlyForecastSchema.optional(),
});

export const updateDealSchema = z.object({
  stage: dealStageSchema.optional(),
  channel: dealChannelSchema.optional(),
  title: z.string().min(1).max(255).optional(),
  quarterlyForecast: quarterlyForecastSchema.optional(),
  expectedCloseDate: z.coerce.date().optional().nullable(),
});

export const createCaseSchema = z.object({
  accountId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  priority: casePrioritySchema.default("medium"),
  slaDueAt: z.coerce.date().optional(),
});

export const updateCaseSchema = z.object({
  status: caseStatusSchema.optional(),
  priority: casePrioritySchema.optional(),
  escalatedToThirdParty: z.boolean().optional(),
  note: z.string().min(1).optional(),
});

export const createNoteSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().default(false),
  accountId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  caseId: z.string().uuid().optional(),
});

export const offerLineItemSchema = z.object({
  itemType: z.enum(["product", "service"]),
  itemId: z.string().uuid(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.string(),
});

export const createOfferSchema = z.object({
  accountId: z.string().uuid(),
  dealId: z.string().uuid().optional(),
  lineItems: z.array(offerLineItemSchema).min(1),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountJustification: z.string().max(2000).optional(),
  submitAsDraft: z.boolean().optional().default(false),
});

export const updateOfferSchema = z.object({
  lineItems: z.array(offerLineItemSchema).min(1),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountJustification: z.string().max(2000).optional(),
  submitAsDraft: z.boolean().optional().default(true),
});

export const approveOfferSchema = z.object({
  approvalId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  comment: z.string().max(1000).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const updateSettingsSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().max(500_000).nullable().optional(),
  preferences: z
    .object({
      language: z.enum(["en", "fi", "sv", "de"]).optional(),
      appearance: z.enum(["dark", "light", "system"]).optional(),
      notifications: z
        .object({
          dealApprovals: z.boolean().optional(),
          offerSubmissions: z.boolean().optional(),
          caseAssignments: z.boolean().optional(),
          dealAtRisk: z.boolean().optional(),
          financeReviews: z.boolean().optional(),
          productUpdates: z.boolean().optional(),
          weeklyDigest: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
