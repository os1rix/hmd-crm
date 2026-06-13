import { db } from "../src/db/index";
import {
  accounts,
  activityLog,
  cases,
  contacts,
  deals,
  notes,
  notifications,
  offerApprovals,
  offers,
  products,
  services,
  users,
} from "../src/db/schema";

const IDS = {
  rep1: "11111111-1111-4111-8111-111111111101",
  rep2: "11111111-1111-4111-8111-111111111102",
  rep3: "11111111-1111-4111-8111-111111111103",
  rep4: "11111111-1111-4111-8111-111111111104",
  tam1: "11111111-1111-4111-8111-111111111201",
  tam2: "11111111-1111-4111-8111-111111111202",
  manager: "11111111-1111-4111-8111-111111111301",
  finance: "11111111-1111-4111-8111-111111111401",
  acc1: "22222222-2222-4222-8222-222222222201",
  acc2: "22222222-2222-4222-8222-222222222202",
  acc3: "22222222-2222-4222-8222-222222222203",
  acc4: "22222222-2222-4222-8222-222222222204",
  acc5: "22222222-2222-4222-8222-222222222205",
  acc6: "22222222-2222-4222-8222-222222222206",
  acc7: "22222222-2222-4222-8222-222222222207",
  acc8: "22222222-2222-4222-8222-222222222208",
  acc9: "22222222-2222-4222-8222-222222222209",
  prod1: "33333333-3333-4333-8333-333333333301",
  prod2: "33333333-3333-4333-8333-333333333302",
  prod3: "33333333-3333-4333-8333-333333333303",
  prod4: "33333333-3333-4333-8333-333333333304",
  svc1: "44444444-4444-4444-8444-444444444401",
  svc2: "44444444-4444-4444-8444-444444444402",
  svc3: "44444444-4444-4444-8444-444444444403",
  svc4: "44444444-4444-4444-8444-444444444404",
  svc5: "44444444-4444-4444-8444-444444444405",
  deal1: "55555555-5555-4555-8555-555555555501",
  deal2: "55555555-5555-4555-8555-555555555502",
  deal3: "55555555-5555-4555-8555-555555555503",
  deal4: "55555555-5555-4555-8555-555555555504",
  deal5: "55555555-5555-4555-8555-555555555505",
  deal6: "55555555-5555-4555-8555-555555555506",
  deal7: "55555555-5555-4555-8555-555555555507",
  deal8: "55555555-5555-4555-8555-555555555508",
  deal9: "55555555-5555-4555-8555-555555555509",
  deal10: "55555555-5555-4555-8555-555555555510",
  deal11: "55555555-5555-4555-8555-555555555511",
  deal12: "55555555-5555-4555-8555-555555555512",
  deal13: "55555555-5555-4555-8555-555555555513",
  deal14: "55555555-5555-4555-8555-555555555514",
  deal15: "55555555-5555-4555-8555-555555555515",
  deal16: "55555555-5555-4555-8555-555555555516",
  deal17: "55555555-5555-4555-8555-555555555517",
  deal18: "55555555-5555-4555-8555-555555555518",
  case1: "66666666-6666-4666-8666-666666666601",
  case2: "66666666-6666-4666-8666-666666666602",
  case3: "66666666-6666-4666-8666-666666666603",
  case4: "66666666-6666-4666-8666-666666666604",
  case5: "66666666-6666-4666-8666-666666666605",
  case6: "66666666-6666-4666-8666-666666666606",
  case7: "66666666-6666-4666-8666-666666666607",
  case8: "66666666-6666-4666-8666-666666666608",
  case9: "66666666-6666-4666-8666-666666666609",
  case10: "66666666-6666-4666-8666-666666666610",
  case11: "66666666-6666-4666-8666-666666666611",
  case12: "66666666-6666-4666-8666-666666666612",
  offer1: "77777777-7777-4777-8777-777777777701",
  offer2: "77777777-7777-4777-8777-777777777702",
  offer3: "77777777-7777-4777-8777-777777777703",
  offer4: "77777777-7777-4777-8777-777777777704",
  offer5: "77777777-7777-4777-8777-777777777705",
  offer6: "77777777-7777-4777-8777-777777777706",
};

const quarters = [
  "Q1 2025",
  "Q2 2025",
  "Q3 2025",
  "Q4 2025",
  "Q1 2026",
  "Q2 2026",
  "Q3 2026",
  "Q4 2026",
  "Q1 2027",
  "Q2 2027",
  "Q3 2027",
  "Q4 2027",
];

function forecast(device: number, service: number) {
  return quarters.map((quarter) => ({
    quarter,
    deviceRevenue: device,
    serviceRevenue: service,
  }));
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seed() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0 && process.env.FORCE_SEED !== "true") {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Clearing existing data…");
  await db.delete(notifications);
  await db.delete(activityLog);
  await db.delete(offerApprovals);
  await db.delete(offers);
  await db.delete(notes);
  await db.delete(cases);
  await db.delete(deals);
  await db.delete(contacts);
  await db.delete(accounts);
  await db.delete(products);
  await db.delete(services);
  await db.delete(users);

  console.log("Seeding users…");
  await db.insert(users).values([
    { id: IDS.rep1, email: "anna@hmd.demo", name: "Anna Virtanen", role: "sales_rep" },
    { id: IDS.rep2, email: "mikko@hmd.demo", name: "Mikko Salo", role: "sales_rep" },
    { id: IDS.rep3, email: "sara@hmd.demo", name: "Sara Lindström", role: "sales_rep" },
    { id: IDS.rep4, email: "joonas@hmd.demo", name: "Joonas Koivu", role: "sales_rep" },
    { id: IDS.tam1, email: "elena@hmd.demo", name: "Elena Berg", role: "tam" },
    { id: IDS.tam2, email: "tomi@hmd.demo", name: "Tomi Niemi", role: "tam" },
    { id: IDS.manager, email: "liisa@hmd.demo", name: "Liisa Korhonen", role: "sales_manager" },
    { id: IDS.finance, email: "pekka@hmd.demo", name: "Pekka Aalto", role: "finance" },
  ]);

  console.log("Seeding catalog…");
  await db.insert(products).values([
    {
      id: IDS.prod1,
      sku: "HMD-X1",
      name: "HMD Secure Device X1",
      description: "Enterprise rugged smartphone",
      unitPrice: "649.00",
    },
    {
      id: IDS.prod2,
      sku: "HMD-X2",
      name: "HMD Secure Device X2",
      description: "5G hardened handset",
      unitPrice: "799.00",
    },
    {
      id: IDS.prod3,
      sku: "HMD-P1",
      name: "HMD Patch Module P1",
      description: "Monthly security patch bundle",
      unitPrice: "12.00",
    },
    {
      id: IDS.prod4,
      sku: "HMD-KIT",
      name: "Deployment Kit",
      description: "Charging dock + MDM enrollment",
      unitPrice: "149.00",
    },
  ]);

  await db.insert(services).values([
    {
      id: IDS.svc1,
      name: "MDM Onboarding",
      description: "Device enrollment and policy setup",
      serviceType: "internal",
      invoicingModel: "one_off",
    },
    {
      id: IDS.svc2,
      name: "24/7 SOC Monitoring",
      description: "Security operations center",
      serviceType: "internal",
      invoicingModel: "monthly_recurring",
    },
    {
      id: IDS.svc3,
      name: "Penetration Testing",
      description: "Annual pen test engagement",
      serviceType: "third_party",
      invoicingModel: "fixed_term",
    },
    {
      id: IDS.svc4,
      name: "Premium Support",
      description: "4h SLA technical support",
      serviceType: "internal",
      invoicingModel: "monthly_recurring",
    },
    {
      id: IDS.svc5,
      name: "Compliance Audit",
      description: "ISO 27001 readiness review",
      serviceType: "third_party",
      invoicingModel: "one_off",
    },
  ]);

  console.log("Seeding accounts…");
  const accountRows = [
    {
      id: IDS.acc1,
      name: "Nordic Logistics AB",
      segment: "Enterprise",
      region: "Nordics",
      channel: "direct" as const,
      ownerId: IDS.rep1,
    },
    {
      id: IDS.acc2,
      name: "Baltic Telecom",
      segment: "Telco",
      region: "Baltics",
      channel: "reseller" as const,
      ownerId: IDS.rep2,
    },
    {
      id: IDS.acc3,
      name: "Helvetic Health",
      segment: "Healthcare",
      region: "DACH",
      channel: "direct" as const,
      ownerId: IDS.rep1,
    },
    {
      id: IDS.acc4,
      name: "Polska Energy",
      segment: "Energy",
      region: "CEE",
      channel: "direct" as const,
      ownerId: IDS.rep3,
    },
    {
      id: IDS.acc5,
      name: "UK Defence Partners",
      segment: "Public Sector",
      region: "UK",
      channel: "reseller" as const,
      ownerId: IDS.rep2,
    },
    {
      id: IDS.acc6,
      name: "Iberia Retail Group",
      segment: "Retail",
      region: "Southern Europe",
      channel: "direct" as const,
      ownerId: IDS.rep4,
    },
    {
      id: IDS.acc7,
      name: "Benelux Finance Co",
      segment: "Financial Services",
      region: "Benelux",
      channel: "direct" as const,
      ownerId: IDS.rep3,
    },
    {
      id: IDS.acc8,
      name: "Nordic Reseller Oy",
      segment: "Channel Partner",
      region: "Nordics",
      channel: "reseller" as const,
      ownerId: IDS.rep4,
    },
    {
      id: IDS.acc9,
      name: "ScanMed Hospitals",
      segment: "Healthcare",
      region: "Nordics",
      channel: "direct" as const,
      ownerId: IDS.rep1,
    },
  ];
  await db.insert(accounts).values(accountRows);

  await db.insert(contacts).values([
    {
      accountId: IDS.acc1,
      name: "Johan Eriksson",
      email: "johan@nordiclogistics.se",
      title: "CISO",
      isPrimary: true,
    },
    {
      accountId: IDS.acc2,
      name: "Marta Kivi",
      email: "marta@baltictelecom.ee",
      title: "Procurement Lead",
      isPrimary: true,
    },
    {
      accountId: IDS.acc3,
      name: "Dr. Weiss",
      email: "weiss@helvetic.health",
      title: "IT Director",
      isPrimary: true,
    },
    {
      accountId: IDS.acc9,
      name: "Ingrid Holm",
      email: "ingrid@scanmed.fi",
      title: "Head of Operations",
      isPrimary: true,
    },
  ]);

  console.log("Seeding deals…");
  const dealRows = [
    {
      id: IDS.deal1,
      accountId: IDS.acc1,
      ownerId: IDS.rep1,
      title: "Nordic Logistics fleet refresh",
      channel: "direct" as const,
      stage: "customer_test" as const,
      quarterlyForecast: forecast(120000, 36000),
      lastActivityAt: daysAgo(3),
      expectedCloseDate: daysAhead(45),
    },
    {
      id: IDS.deal2,
      accountId: IDS.acc2,
      ownerId: IDS.rep2,
      title: "Baltic Telecom reseller rollout",
      channel: "reseller" as const,
      stage: "rfp_offer_given" as const,
      quarterlyForecast: forecast(80000, 20000),
      lastActivityAt: daysAgo(20),
      expectedCloseDate: daysAhead(30),
    },
    {
      id: IDS.deal3,
      accountId: IDS.acc3,
      ownerId: IDS.rep1,
      title: "Helvetic Health pilot",
      channel: "direct" as const,
      stage: "contract_negotiation" as const,
      quarterlyForecast: forecast(200000, 80000),
      lastActivityAt: daysAgo(2),
      expectedCloseDate: daysAhead(14),
    },
    {
      id: IDS.deal4,
      accountId: IDS.acc4,
      ownerId: IDS.rep3,
      title: "Polska Energy field devices",
      channel: "direct" as const,
      stage: "interest_shown" as const,
      quarterlyForecast: forecast(50000, 15000),
      lastActivityAt: daysAgo(5),
    },
    {
      id: IDS.deal5,
      accountId: IDS.acc5,
      ownerId: IDS.rep2,
      title: "UK Defence channel bundle",
      channel: "reseller" as const,
      stage: "won" as const,
      quarterlyForecast: forecast(150000, 45000),
      lastActivityAt: daysAgo(1),
    },
    {
      id: IDS.deal6,
      accountId: IDS.acc6,
      ownerId: IDS.rep4,
      title: "Iberia Retail POS security",
      channel: "direct" as const,
      stage: "rfi_answered" as const,
      quarterlyForecast: forecast(90000, 30000),
      lastActivityAt: daysAgo(18),
    },
    {
      id: IDS.deal7,
      accountId: IDS.acc7,
      ownerId: IDS.rep3,
      title: "Benelux Finance compliance pack",
      channel: "direct" as const,
      stage: "customer_test" as const,
      quarterlyForecast: forecast(110000, 55000),
      lastActivityAt: daysAgo(4),
    },
    {
      id: IDS.deal8,
      accountId: IDS.acc8,
      ownerId: IDS.rep4,
      title: "Nordic Reseller Q3 push",
      channel: "reseller" as const,
      stage: "lost" as const,
      quarterlyForecast: forecast(30000, 10000),
      lastActivityAt: daysAgo(30),
    },
    {
      id: IDS.deal9,
      accountId: IDS.acc9,
      ownerId: IDS.rep1,
      title: "ScanMed ward devices",
      channel: "direct" as const,
      stage: "rfp_offer_given" as const,
      quarterlyForecast: forecast(175000, 42000),
      lastActivityAt: daysAgo(7),
    },
    {
      id: IDS.deal10,
      accountId: IDS.acc1,
      ownerId: IDS.rep1,
      title: "Nordic Logistics SOC add-on",
      channel: "direct" as const,
      stage: "interest_shown" as const,
      quarterlyForecast: forecast(0, 72000),
      lastActivityAt: daysAgo(16),
    },
    {
      id: IDS.deal11,
      accountId: IDS.acc4,
      ownerId: IDS.rep3,
      title: "Polska patch subscription",
      channel: "direct" as const,
      stage: "rfp_offer_given" as const,
      quarterlyForecast: forecast(20000, 48000),
      lastActivityAt: daysAgo(6),
    },
    {
      id: IDS.deal12,
      accountId: IDS.acc6,
      ownerId: IDS.rep4,
      title: "Iberia deployment services",
      channel: "direct" as const,
      stage: "customer_test" as const,
      quarterlyForecast: forecast(60000, 90000),
      lastActivityAt: daysAgo(21),
    },
    {
      id: IDS.deal13,
      accountId: IDS.acc7,
      ownerId: IDS.rep3,
      title: "Benelux premium support",
      channel: "direct" as const,
      stage: "contract_negotiation" as const,
      quarterlyForecast: forecast(40000, 120000),
      lastActivityAt: daysAgo(1),
    },
    {
      id: IDS.deal14,
      accountId: IDS.acc2,
      ownerId: IDS.rep2,
      title: "Baltic upgrade path",
      channel: "reseller" as const,
      stage: "interest_shown" as const,
      quarterlyForecast: forecast(45000, 12000),
      lastActivityAt: daysAgo(25),
    },
    {
      id: IDS.deal15,
      accountId: IDS.acc5,
      ownerId: IDS.rep2,
      title: "UK Defence phase 2",
      channel: "reseller" as const,
      stage: "rfi_answered" as const,
      quarterlyForecast: forecast(95000, 28000),
      lastActivityAt: daysAgo(8),
    },
    {
      id: IDS.deal16,
      accountId: IDS.acc3,
      ownerId: IDS.rep1,
      title: "Helvetic audit services",
      channel: "direct" as const,
      stage: "won" as const,
      quarterlyForecast: forecast(10000, 65000),
      lastActivityAt: daysAgo(2),
    },
    {
      id: IDS.deal17,
      accountId: IDS.acc8,
      ownerId: IDS.rep4,
      title: "Reseller starter kit",
      channel: "reseller" as const,
      stage: "customer_test" as const,
      quarterlyForecast: forecast(35000, 8000),
      lastActivityAt: daysAgo(10),
    },
    {
      id: IDS.deal18,
      accountId: IDS.acc9,
      ownerId: IDS.rep1,
      title: "ScanMed support renewal",
      channel: "direct" as const,
      stage: "contract_negotiation" as const,
      quarterlyForecast: forecast(15000, 96000),
      lastActivityAt: daysAgo(3),
    },
  ];
  await db.insert(deals).values(dealRows);

  console.log("Seeding cases…");
  await db.insert(cases).values([
    {
      id: IDS.case1,
      accountId: IDS.acc1,
      serviceId: IDS.svc4,
      assigneeId: IDS.tam1,
      title: "MDM enrollment failures on batch 12",
      status: "in_progress",
      priority: "high",
      slaDueAt: daysAhead(2),
    },
    {
      id: IDS.case2,
      accountId: IDS.acc3,
      serviceId: IDS.svc2,
      assigneeId: IDS.tam1,
      title: "SOC alert tuning request",
      status: "open",
      priority: "medium",
      slaDueAt: daysAhead(5),
    },
    {
      id: IDS.case3,
      accountId: IDS.acc9,
      serviceId: IDS.svc4,
      assigneeId: IDS.tam2,
      title: "Ward 4 devices offline",
      status: "escalated",
      priority: "critical",
      slaDueAt: daysAhead(1),
      escalatedToThirdParty: true,
    },
    {
      id: IDS.case4,
      accountId: IDS.acc2,
      serviceId: IDS.svc1,
      assigneeId: IDS.tam2,
      title: "Reseller onboarding docs",
      status: "resolved",
      priority: "low",
      slaDueAt: daysAgo(2),
    },
    {
      id: IDS.case5,
      accountId: IDS.acc7,
      serviceId: IDS.svc5,
      assigneeId: IDS.tam1,
      title: "Compliance evidence pack",
      status: "open",
      priority: "high",
      slaDueAt: daysAhead(3),
    },
    {
      id: IDS.case6,
      accountId: IDS.acc6,
      serviceId: IDS.svc3,
      assigneeId: IDS.tam2,
      title: "Pen test findings review",
      status: "in_progress",
      priority: "high",
      slaDueAt: daysAhead(4),
    },
    {
      id: IDS.case7,
      accountId: IDS.acc4,
      serviceId: IDS.svc2,
      assigneeId: IDS.tam1,
      title: "Monthly SOC report delay",
      status: "open",
      priority: "medium",
      slaDueAt: daysAhead(6),
    },
    {
      id: IDS.case8,
      accountId: IDS.acc5,
      serviceId: IDS.svc4,
      assigneeId: IDS.tam2,
      title: "SLA breach post-mortem",
      status: "closed",
      priority: "critical",
      slaDueAt: daysAgo(10),
    },
    {
      id: IDS.case9,
      accountId: IDS.acc1,
      serviceId: IDS.svc1,
      assigneeId: IDS.tam1,
      title: "Policy push to 400 devices",
      status: "in_progress",
      priority: "medium",
      slaDueAt: daysAhead(7),
    },
    {
      id: IDS.case10,
      accountId: IDS.acc8,
      serviceId: IDS.svc1,
      assigneeId: IDS.tam2,
      title: "Partner portal access",
      status: "resolved",
      priority: "low",
      slaDueAt: daysAgo(1),
    },
    {
      id: IDS.case11,
      accountId: IDS.acc3,
      serviceId: IDS.svc4,
      assigneeId: IDS.tam1,
      title: "Premium support renewal question",
      status: "open",
      priority: "medium",
      slaDueAt: daysAhead(8),
    },
    {
      id: IDS.case12,
      accountId: IDS.acc9,
      serviceId: IDS.svc2,
      assigneeId: IDS.tam2,
      title: "Night shift monitoring gap",
      status: "escalated",
      priority: "high",
      slaDueAt: daysAhead(2),
      escalatedToThirdParty: false,
    },
  ]);

  console.log("Seeding offers…");
  const lineItems1 = [
    {
      itemType: "product" as const,
      itemId: IDS.prod1,
      name: "HMD Secure Device X1",
      quantity: 500,
      unitPrice: "649.00",
    },
    {
      itemType: "service" as const,
      itemId: IDS.svc1,
      name: "MDM Onboarding",
      quantity: 1,
      unitPrice: "25000.00",
    },
  ];
  await db.insert(offers).values([
    {
      id: IDS.offer1,
      accountId: IDS.acc1,
      dealId: IDS.deal1,
      createdById: IDS.rep1,
      lineItems: lineItems1,
      subtotal: "349500.00",
      discountPercent: "8.00",
      discountJustification: "Strategic Nordics reference customer",
      total: "321540.00",
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer2,
      accountId: IDS.acc3,
      dealId: IDS.deal3,
      createdById: IDS.rep1,
      lineItems: [
        {
          itemType: "product",
          itemId: IDS.prod2,
          name: "HMD Secure Device X2",
          quantity: 300,
          unitPrice: "799.00",
        },
      ],
      subtotal: "239700.00",
      discountPercent: "5.00",
      discountJustification: "Multi-year commitment",
      total: "227715.00",
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer3,
      accountId: IDS.acc9,
      dealId: IDS.deal9,
      createdById: IDS.rep1,
      lineItems: [
        {
          itemType: "product",
          itemId: IDS.prod1,
          name: "HMD Secure Device X1",
          quantity: 200,
          unitPrice: "649.00",
        },
        {
          itemType: "service",
          itemId: IDS.svc4,
          name: "Premium Support",
          quantity: 12,
          unitPrice: "3500.00",
        },
      ],
      subtotal: "171800.00",
      total: "171800.00",
      isLocked: false,
      version: 1,
    },
    {
      id: IDS.offer4,
      accountId: IDS.acc2,
      dealId: IDS.deal2,
      createdById: IDS.rep2,
      lineItems: [
        {
          itemType: "product",
          itemId: IDS.prod3,
          name: "HMD Patch Module P1",
          quantity: 1000,
          unitPrice: "12.00",
        },
      ],
      subtotal: "12000.00",
      discountPercent: "12.00",
      discountJustification: "Reseller volume tier",
      total: "10560.00",
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer5,
      accountId: IDS.acc7,
      dealId: IDS.deal13,
      createdById: IDS.rep3,
      lineItems: [
        {
          itemType: "service",
          itemId: IDS.svc2,
          name: "24/7 SOC Monitoring",
          quantity: 36,
          unitPrice: "4200.00",
        },
      ],
      subtotal: "151200.00",
      discountPercent: "10.00",
      discountJustification: "Finance sector bundle",
      total: "136080.00",
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer6,
      accountId: IDS.acc6,
      dealId: IDS.deal12,
      createdById: IDS.rep4,
      lineItems: [
        {
          itemType: "service",
          itemId: IDS.svc1,
          name: "MDM Onboarding",
          quantity: 1,
          unitPrice: "18000.00",
        },
      ],
      subtotal: "18000.00",
      total: "18000.00",
      isLocked: false,
      version: 1,
    },
  ]);

  await db.insert(offerApprovals).values([
    {
      offerId: IDS.offer1,
      approverRole: "sales_manager",
      approverId: IDS.manager,
      status: "pending",
    },
    {
      offerId: IDS.offer2,
      approverRole: "sales_manager",
      approverId: IDS.manager,
      status: "approved",
      decidedAt: daysAgo(1),
      comment: "Approved — strategic healthcare win",
    },
    {
      offerId: IDS.offer2,
      approverRole: "finance",
      approverId: IDS.finance,
      status: "pending",
    },
    {
      offerId: IDS.offer4,
      approverRole: "sales_manager",
      approverId: IDS.manager,
      status: "approved",
      decidedAt: daysAgo(2),
    },
    {
      offerId: IDS.offer4,
      approverRole: "finance",
      approverId: IDS.finance,
      status: "pending",
    },
    {
      offerId: IDS.offer5,
      approverRole: "sales_manager",
      approverId: IDS.manager,
      status: "pending",
    },
  ]);

  console.log("Seeding notes & activity…");
  const timeline = [
    {
      authorId: IDS.rep1,
      accountId: IDS.acc1,
      dealId: IDS.deal1,
      body: "Customer completed pilot on 50 devices — positive feedback on patch cadence.",
    },
    {
      authorId: IDS.tam1,
      accountId: IDS.acc1,
      caseId: IDS.case1,
      body: "Escalated MDM sync issue to engineering. Workaround deployed.",
    },
    {
      authorId: IDS.manager,
      accountId: IDS.acc3,
      dealId: IDS.deal3,
      body: "Approved stage move to contract negotiation.",
      isInternal: true,
    },
    {
      authorId: IDS.rep2,
      accountId: IDS.acc2,
      dealId: IDS.deal2,
      body: "Reseller waiting on revised discount tier before PO.",
    },
    {
      authorId: IDS.tam2,
      accountId: IDS.acc9,
      caseId: IDS.case3,
      body: "Third-party field engineer dispatched to ward 4.",
    },
    {
      authorId: IDS.tam2,
      accountId: IDS.acc9,
      caseId: IDS.case3,
      body: "On-site team reports 12 devices not checking in to MDM.",
    },
    {
      authorId: IDS.tam2,
      accountId: IDS.acc9,
      caseId: IDS.case3,
      body: "Network team ruled out VLAN issues — suspect firmware regression.",
    },
    {
      authorId: IDS.rep1,
      accountId: IDS.acc9,
      caseId: IDS.case3,
      body: "Customer exec looped in — requesting hourly updates.",
    },
    {
      authorId: IDS.tam2,
      accountId: IDS.acc9,
      caseId: IDS.case3,
      body: "Rollback package prepared; awaiting maintenance window approval.",
    },
    {
      authorId: IDS.finance,
      accountId: IDS.acc7,
      dealId: IDS.deal13,
      body: "Finance review scheduled for premium support offer.",
      isInternal: true,
    },
    {
      authorId: IDS.rep1,
      accountId: IDS.acc9,
      dealId: IDS.deal9,
      body: "Submitted ward device offer v1 for hospital board review.",
    },
    {
      authorId: IDS.rep3,
      accountId: IDS.acc4,
      dealId: IDS.deal4,
      body: "Initial discovery call — 800 field workers targeted.",
    },
    {
      authorId: IDS.tam1,
      accountId: IDS.acc3,
      caseId: IDS.case2,
      body: "Customer requested tighter SOC thresholds for clinical systems.",
    },
    {
      authorId: IDS.rep4,
      accountId: IDS.acc6,
      dealId: IDS.deal12,
      body: "Deployment services SOW sent to procurement.",
    },
  ];
  await db.insert(notes).values(timeline);

  const activities = [
    {
      actorId: IDS.rep1,
      entityType: "deal",
      entityId: IDS.deal1,
      action: "stage_changed",
      metadata: { from: "rfp_offer_given", to: "customer_test" },
    },
    {
      actorId: IDS.rep1,
      entityType: "offer",
      entityId: IDS.offer1,
      action: "submitted",
      metadata: { discountPercent: 8 },
    },
    {
      actorId: IDS.tam2,
      entityType: "case",
      entityId: IDS.case3,
      action: "escalated",
      metadata: { thirdParty: true },
    },
    {
      actorId: IDS.manager,
      entityType: "deal",
      entityId: IDS.deal3,
      action: "stage_changed",
      metadata: { to: "contract_negotiation" },
    },
    {
      actorId: IDS.rep2,
      entityType: "deal",
      entityId: IDS.deal2,
      action: "note_added",
      metadata: {},
    },
  ];
  await db.insert(activityLog).values(activities);

  console.log("Seeding notifications…");
  await db.insert(notifications).values([
    {
      userId: IDS.manager,
      title: "Discount approval needed",
      body: "Anna submitted 8% discount on Nordic Logistics offer",
      link: "/deals",
    },
    {
      userId: IDS.finance,
      title: "Finance approval queue",
      body: "Helvetic Health offer awaiting second approval",
      link: "/forecast",
    },
    {
      userId: IDS.rep1,
      title: "Deal at risk",
      body: "Baltic Telecom reseller rollout — 20 days without update",
      link: "/deals",
    },
    {
      userId: IDS.tam1,
      title: "Case assigned",
      body: "Critical: Ward 4 devices offline at ScanMed",
      link: "/cases",
    },
    {
      userId: IDS.rep2,
      title: "Offer submitted",
      body: "Reseller volume discount sent for manager review",
      link: "/deals",
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
