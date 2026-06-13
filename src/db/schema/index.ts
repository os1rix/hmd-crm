import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["sales_rep", "tam", "sales_manager", "finance"]);

export const dealChannelEnum = pgEnum("deal_channel", ["direct", "reseller"]);

export const dealStageEnum = pgEnum("deal_stage", [
  "interest_shown",
  "rfi_answered",
  "rfp_offer_given",
  "customer_test",
  "contract_negotiation",
  "won",
  "lost",
]);

export const caseStatusEnum = pgEnum("case_status", [
  "open",
  "in_progress",
  "escalated",
  "resolved",
  "closed",
]);

export const casePriorityEnum = pgEnum("case_priority", ["low", "medium", "high", "critical"]);

export const serviceTypeEnum = pgEnum("service_type", ["internal", "third_party"]);

export const invoicingModelEnum = pgEnum("invoicing_model", [
  "one_off",
  "fixed_term",
  "monthly_recurring",
]);

export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("sales_rep"),
  entraObjectId: text("entra_object_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  region: text("region"),
  ownerId: uuid("owner_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  title: text("title"),
  phone: text("phone"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  channel: dealChannelEnum("channel").notNull().default("direct"),
  stage: dealStageEnum("stage").notNull().default("interest_shown"),
  expectedCloseDate: timestamp("expected_close_date", { withTimezone: true }),
  threeYearForecast: numeric("three_year_forecast", { precision: 14, scale: 2 }),
  quarterlyForecast: jsonb("quarterly_forecast").$type<Record<string, number>>(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  serviceType: serviceTypeEnum("service_type").notNull().default("internal"),
  invoicingModel: invoicingModelEnum("invoicing_model").notNull().default("one_off"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  title: text("title").notNull(),
  status: caseStatusEnum("status").notNull().default("open"),
  priority: casePriorityEnum("priority").notNull().default("medium"),
  slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
  escalatedToThirdParty: boolean("escalated_to_third_party").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  dealId: uuid("deal_id").references(() => deals.id),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  version: integer("version").notNull().default(1),
  lineItems: jsonb("line_items")
    .$type<Array<{ productId: string; quantity: number; unitPrice: string; discount?: string }>>()
    .notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }),
  discountJustification: text("discount_justification"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const offerApprovals = pgTable("offer_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  approverRole: userRoleEnum("approver_role").notNull(),
  approverId: uuid("approver_id").references(() => users.id),
  status: approvalStatusEnum("status").notNull().default("pending"),
  comment: text("comment"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  ownedAccounts: many(accounts),
  ownedDeals: many(deals),
  assignedCases: many(cases),
  notes: many(notes),
  notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  owner: one(users, { fields: [accounts.ownerId], references: [users.id] }),
  contacts: many(contacts),
  deals: many(deals),
  cases: many(cases),
  notes: many(notes),
  offers: many(offers),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  account: one(accounts, { fields: [deals.accountId], references: [accounts.id] }),
  owner: one(users, { fields: [deals.ownerId], references: [users.id] }),
  notes: many(notes),
  offers: many(offers),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  account: one(accounts, { fields: [cases.accountId], references: [accounts.id] }),
  service: one(services, { fields: [cases.serviceId], references: [services.id] }),
  assignee: one(users, { fields: [cases.assigneeId], references: [users.id] }),
  notes: many(notes),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  account: one(accounts, { fields: [offers.accountId], references: [accounts.id] }),
  deal: one(deals, { fields: [offers.dealId], references: [deals.id] }),
  createdBy: one(users, { fields: [offers.createdById], references: [users.id] }),
  approvals: many(offerApprovals),
}));
