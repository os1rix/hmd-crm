import { db } from "../src/db/index";
import {
  accounts,
  activityLog,
  cases,
  contacts,
  deals,
  newsPosts,
  notes,
  notifications,
  offerApprovals,
  offers,
  products,
  services,
  users,
} from "../src/db/schema";
import { calcOfferTotals } from "../src/lib/offer-totals";
import { hashPassword } from "../src/lib/password";
import { DEFAULT_USER_PREFERENCES } from "../src/lib/user-preferences";

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
  svc1: "44444444-4444-4444-8444-444444444401",
  svc2: "44444444-4444-4444-8444-444444444402",
  svc3: "44444444-4444-4444-8444-444444444403",
  svc4: "44444444-4444-4444-8444-444444444404",
  svc5: "44444444-4444-4444-8444-444444444405",
  svc6: "44444444-4444-4444-8444-444444444406",
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** Build 36 monthly forecast entries with varied device/service revenue. */
function realisticForecast(
  dealIndex: number,
  annualDevice: number,
  annualService: number,
  stage: string,
) {
  const monthlyDevice = annualDevice / 12;
  const monthlyService = annualService / 12;
  const entries: Array<{ quarter: string; deviceRevenue: number; serviceRevenue: number }> = [];

  const startMonthOffset =
    stage === "interest_shown"
      ? 5
      : stage === "rfi_answered"
        ? 3
        : stage === "rfp_offer_given"
          ? 1
          : 0;

  for (let i = 0; i < 36; i++) {
    if (i < startMonthOffset) continue;

    const year = 2025 + Math.floor(i / 12);
    const month = (i % 12) + 1;

    const wave =
      1 +
      Math.sin(dealIndex * 1.73 + i * 0.91) * 0.38 +
      Math.cos(dealIndex * 0.67 + i * 1.27) * 0.26;
    const spike = (i + dealIndex) % 7 === 0 ? 1.55 : (i + dealIndex) % 11 === 0 ? 0.62 : 1;
    const season =
      month === 12 || month === 11
        ? 1.32
        : month === 1 || month === 8
          ? 0.78
          : month === 6
            ? 0.88
            : 1;
    const yearGrowth = 1 + (year - 2025) * (0.04 + (dealIndex % 5) * 0.012);

    let stageMul = 1;
    if (stage === "won" && i >= 24) stageMul = 0.15 + (35 - i) * 0.04;
    if (stage === "lost" && i >= 12) stageMul = 0.08;

    const serviceSkew = 1 + Math.sin(dealIndex + i * 0.4) * 0.18;

    entries.push({
      quarter: monthLabel(year, month),
      deviceRevenue: Math.round(monthlyDevice * wave * spike * season * yearGrowth * stageMul),
      serviceRevenue: Math.round(
        monthlyService * wave * spike * season * yearGrowth * stageMul * serviceSkew,
      ),
    });
  }

  return entries;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function seed() {
  console.log("Clearing existing data…");
  await db.delete(notifications);
  await db.delete(newsPosts);
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
  const demoPasswordHash = hashPassword("demo123");
  await db.insert(users).values([
    {
      id: IDS.rep1,
      email: "anna@hmd.demo",
      name: "Anna Virtanen",
      role: "sales_rep",
      bio: "Enterprise & industrial accounts across the Nordics. Focus on Ivalo XE fleet rollouts.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.rep2,
      email: "mikko@hmd.demo",
      name: "Mikko Salo",
      role: "sales_rep",
      bio: "Defense & government channel partner deals in the Baltics and UK.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.rep3,
      email: "sara@hmd.demo",
      name: "Sara Lindström",
      role: "sales_rep",
      bio: "Critical infrastructure and energy sector — Terra M and FOTA subscriptions.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.rep4,
      email: "joonas@hmd.demo",
      name: "Joonas Koivu",
      role: "sales_rep",
      bio: "Southern Europe industrial accounts and reseller enablement.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.tam1,
      email: "elena@hmd.demo",
      name: "Elena Berg",
      role: "tam",
      bio: "Technical account manager for healthcare and enterprise deployments.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.tam2,
      email: "tomi@hmd.demo",
      name: "Tomi Niemi",
      role: "tam",
      bio: "SOC and Secure Partner Platform specialist — Nordics support lead.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.manager,
      email: "liisa@hmd.demo",
      name: "Liisa Korhonen",
      role: "sales_manager",
      bio: "Sales manager — pipeline reviews, discount approvals, and team coaching.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
    {
      id: IDS.finance,
      email: "pekka@hmd.demo",
      name: "Pekka Aalto",
      role: "finance",
      bio: "Finance approvals, forecast hygiene, and reseller tier compliance.",
      passwordHash: demoPasswordHash,
      preferences: DEFAULT_USER_PREFERENCES,
    },
  ]);

  console.log("Seeding catalog…");
  await db.insert(products).values([
    {
      id: IDS.prod1,
      sku: "HMD-IVALO-XE",
      name: "HMD Ivalo XE",
      description: "Rugged enterprise smartphone with HMD Secure",
      unitPrice: "649.00",
    },
    {
      id: IDS.prod2,
      sku: "HMD-TERRA-M",
      name: "HMD Terra M",
      description: "5G hardened handset for field operations",
      unitPrice: "799.00",
    },
  ]);

  await db.insert(services).values([
    {
      id: IDS.svc1,
      name: "Core Solutions (HMD Secure + 3rd-party)",
      description: "Integrated secure device stack with partner ecosystem",
      unitPrice: "12000.00",
      serviceType: "internal",
      invoicingModel: "one_off",
    },
    {
      id: IDS.svc2,
      name: "Edge AI as a Service",
      description: "On-device and edge inference platform",
      unitPrice: "6800.00",
      serviceType: "internal",
      invoicingModel: "monthly_recurring",
    },
    {
      id: IDS.svc3,
      name: "Tactical Outfit SDK",
      description: "Mission-specific app and integration toolkit",
      unitPrice: "20000.00",
      serviceType: "third_party",
      invoicingModel: "fixed_term",
    },
    {
      id: IDS.svc4,
      name: "Secure Partner Platform",
      description: "Partner portal, provisioning, and lifecycle management",
      unitPrice: "2800.00",
      serviceType: "internal",
      invoicingModel: "monthly_recurring",
    },
    {
      id: IDS.svc5,
      name: "Modular Extensions (Fusion)",
      description: "Composable add-on modules for custom workflows",
      unitPrice: "9600.00",
      serviceType: "third_party",
      invoicingModel: "one_off",
    },
    {
      id: IDS.svc6,
      name: "HMD FOTA",
      description: "Firmware-over-the-air updates and patch cadence",
      unitPrice: "4200.00",
      serviceType: "internal",
      invoicingModel: "monthly_recurring",
    },
  ]);

  console.log("Seeding accounts…");
  const accountRows = [
    {
      id: IDS.acc1,
      name: "Nordic Logistics AB",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "Nordics",
      channel: "direct" as const,
      ownerId: IDS.rep1,
    },
    {
      id: IDS.acc2,
      name: "Baltic Telecom Infrastructure",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "Baltics",
      channel: "reseller" as const,
      ownerId: IDS.rep2,
    },
    {
      id: IDS.acc3,
      name: "Helvetic Health Network",
      segment: "Healthcare",
      industry: "Healthcare",
      region: "DACH",
      channel: "direct" as const,
      ownerId: IDS.rep1,
    },
    {
      id: IDS.acc4,
      name: "Polska National Grid",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "CEE",
      channel: "direct" as const,
      ownerId: IDS.rep3,
    },
    {
      id: IDS.acc5,
      name: "UK Ministry of Defence Procurement",
      segment: "Defense & Government",
      industry: "Defense & Government",
      region: "UK",
      channel: "reseller" as const,
      ownerId: IDS.rep2,
    },
    {
      id: IDS.acc6,
      name: "Iberia Industrial Holdings",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "Southern Europe",
      channel: "direct" as const,
      ownerId: IDS.rep4,
    },
    {
      id: IDS.acc7,
      name: "Benelux Industrial Systems",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "Benelux",
      channel: "direct" as const,
      ownerId: IDS.rep3,
    },
    {
      id: IDS.acc8,
      name: "Nordic Reseller Oy",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "Nordics",
      channel: "reseller" as const,
      ownerId: IDS.rep4,
    },
    {
      id: IDS.acc9,
      name: "ScanMed Hospitals",
      segment: "Healthcare",
      industry: "Healthcare",
      region: "Nordics",
      channel: "direct" as const,
      ownerId: IDS.rep1,
    },
  ];

  const extraAccountRows = [
    {
      name: "Rhine Manufacturing AG",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "DACH",
      channel: "direct" as const,
    },
    {
      name: "Mediterranean Ports Authority",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "Southern Europe",
      channel: "direct" as const,
    },
    {
      name: "Finnish Defence Forces C4ISR",
      segment: "Defense & Government",
      industry: "Defense & Government",
      region: "Nordics",
      channel: "direct" as const,
    },
    {
      name: "Central EU Pharma",
      segment: "Healthcare",
      industry: "Healthcare",
      region: "CEE",
      channel: "direct" as const,
    },
    {
      name: "Stockholm Fire & Rescue Authority",
      segment: "Public Safety & First Responders",
      industry: "Public Safety & First Responders",
      region: "Nordics",
      channel: "reseller" as const,
    },
    {
      name: "EU Frontex Field Operations",
      segment: "Public Safety & First Responders",
      industry: "Public Safety & First Responders",
      region: "CEE",
      channel: "direct" as const,
    },
    {
      name: "Baltic Defence Systems",
      segment: "Defense & Government",
      industry: "Defense & Government",
      region: "Baltics",
      channel: "reseller" as const,
    },
    {
      name: "Iberia Smart Grid",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "Southern Europe",
      channel: "direct" as const,
    },
    {
      name: "Bavaria State Police IT",
      segment: "Public Safety & First Responders",
      industry: "Public Safety & First Responders",
      region: "DACH",
      channel: "direct" as const,
    },
    {
      name: "Benelux Transport NV",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "Benelux",
      channel: "reseller" as const,
    },
    {
      name: "Scandinavian Energy Grid",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "Nordics",
      channel: "direct" as const,
    },
    {
      name: "Continental Industrial Systems",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "CEE",
      channel: "reseller" as const,
    },
    {
      name: "Finnish Ministry of Defence IT",
      segment: "Defense & Government",
      industry: "Defense & Government",
      region: "Nordics",
      channel: "direct" as const,
    },
    {
      name: "Danish Maritime Fleet Ops",
      segment: "Enterprise & Industrial",
      industry: "Enterprise & Industrial",
      region: "Nordics",
      channel: "direct" as const,
    },
    {
      name: "Swiss Critical Facilities Group",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "DACH",
      channel: "direct" as const,
    },
    {
      name: "Romanian Grid Operator",
      segment: "Critical Infrastructure",
      industry: "Critical Infrastructure",
      region: "CEE",
      channel: "direct" as const,
    },
    {
      name: "French Hospital Network",
      segment: "Healthcare",
      industry: "Healthcare",
      region: "Southern Europe",
      channel: "direct" as const,
    },
    {
      name: "Helsinki Emergency Medical Services",
      segment: "Public Safety & First Responders",
      industry: "Public Safety & First Responders",
      region: "Nordics",
      channel: "direct" as const,
    },
  ].map((row, i) => ({
    id: `22222222-2222-4222-8222-${String(210 + i).padStart(12, "0")}`,
    ...row,
    ownerId: [IDS.rep1, IDS.rep2, IDS.rep3, IDS.rep4][i % 4],
  }));

  accountRows.push(...extraAccountRows);
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
      quarterlyForecast: realisticForecast(1, 480000, 144000, "customer_test"),
      lastActivityAt: daysAgo(3),
      expectedCloseDate: daysAhead(45),
    },
    {
      id: IDS.deal2,
      accountId: IDS.acc2,
      ownerId: IDS.rep2,
      title: "Baltic Telecom field device rollout",
      channel: "reseller" as const,
      stage: "rfp_offer_given" as const,
      quarterlyForecast: realisticForecast(2, 320000, 80000, "rfp_offer_given"),
      lastActivityAt: daysAgo(20),
      expectedCloseDate: daysAhead(30),
    },
    {
      id: IDS.deal3,
      accountId: IDS.acc3,
      ownerId: IDS.rep1,
      title: "Helvetic Health Ivalo pilot",
      channel: "direct" as const,
      stage: "contract_negotiation" as const,
      quarterlyForecast: realisticForecast(3, 800000, 320000, "contract_negotiation"),
      lastActivityAt: daysAgo(2),
      expectedCloseDate: daysAhead(14),
    },
    {
      id: IDS.deal4,
      accountId: IDS.acc4,
      ownerId: IDS.rep3,
      title: "Polska Grid field devices",
      channel: "direct" as const,
      stage: "interest_shown" as const,
      quarterlyForecast: realisticForecast(4, 200000, 60000, "interest_shown"),
      lastActivityAt: daysAgo(5),
    },
    {
      id: IDS.deal5,
      accountId: IDS.acc5,
      ownerId: IDS.rep2,
      title: "UK MoD Terra M bundle",
      channel: "reseller" as const,
      stage: "won" as const,
      quarterlyForecast: realisticForecast(5, 600000, 180000, "won"),
      lastActivityAt: daysAgo(1),
    },
    {
      id: IDS.deal6,
      accountId: IDS.acc6,
      ownerId: IDS.rep4,
      title: "Iberia Industrial secure fleet",
      channel: "direct" as const,
      stage: "rfi_answered" as const,
      quarterlyForecast: realisticForecast(6, 360000, 120000, "rfi_answered"),
      lastActivityAt: daysAgo(18),
    },
    {
      id: IDS.deal7,
      accountId: IDS.acc7,
      ownerId: IDS.rep3,
      title: "Benelux Core Solutions pack",
      channel: "direct" as const,
      stage: "customer_test" as const,
      quarterlyForecast: realisticForecast(7, 440000, 220000, "customer_test"),
      lastActivityAt: daysAgo(4),
    },
    {
      id: IDS.deal8,
      accountId: IDS.acc8,
      ownerId: IDS.rep4,
      title: "Nordic Reseller Q3 push",
      channel: "reseller" as const,
      stage: "lost" as const,
      quarterlyForecast: realisticForecast(8, 120000, 40000, "lost"),
      lastActivityAt: daysAgo(30),
    },
    {
      id: IDS.deal9,
      accountId: IDS.acc9,
      ownerId: IDS.rep1,
      title: "ScanMed ward devices",
      channel: "direct" as const,
      stage: "rfp_offer_given" as const,
      quarterlyForecast: realisticForecast(9, 700000, 168000, "rfp_offer_given"),
      lastActivityAt: daysAgo(7),
    },
    {
      id: IDS.deal10,
      accountId: IDS.acc1,
      ownerId: IDS.rep1,
      title: "Nordic Logistics Edge AI add-on",
      channel: "direct" as const,
      stage: "interest_shown" as const,
      quarterlyForecast: realisticForecast(10, 0, 288000, "interest_shown"),
      lastActivityAt: daysAgo(16),
    },
    {
      id: IDS.deal11,
      accountId: IDS.acc4,
      ownerId: IDS.rep3,
      title: "Polska FOTA subscription",
      channel: "direct" as const,
      stage: "rfp_offer_given" as const,
      quarterlyForecast: realisticForecast(11, 80000, 192000, "rfp_offer_given"),
      lastActivityAt: daysAgo(6),
    },
    {
      id: IDS.deal12,
      accountId: IDS.acc6,
      ownerId: IDS.rep4,
      title: "Iberia Core Solutions deployment",
      channel: "direct" as const,
      stage: "customer_test" as const,
      quarterlyForecast: realisticForecast(12, 240000, 360000, "customer_test"),
      lastActivityAt: daysAgo(21),
    },
    {
      id: IDS.deal13,
      accountId: IDS.acc7,
      ownerId: IDS.rep3,
      title: "Benelux Secure Partner Platform",
      channel: "direct" as const,
      stage: "contract_negotiation" as const,
      quarterlyForecast: realisticForecast(13, 160000, 480000, "contract_negotiation"),
      lastActivityAt: daysAgo(1),
    },
    {
      id: IDS.deal14,
      accountId: IDS.acc2,
      ownerId: IDS.rep2,
      title: "Baltic upgrade path",
      channel: "reseller" as const,
      stage: "interest_shown" as const,
      quarterlyForecast: realisticForecast(14, 180000, 48000, "interest_shown"),
      lastActivityAt: daysAgo(25),
    },
    {
      id: IDS.deal15,
      accountId: IDS.acc5,
      ownerId: IDS.rep2,
      title: "UK MoD phase 2 rollout",
      channel: "reseller" as const,
      stage: "rfi_answered" as const,
      quarterlyForecast: realisticForecast(15, 380000, 112000, "rfi_answered"),
      lastActivityAt: daysAgo(8),
    },
    {
      id: IDS.deal16,
      accountId: IDS.acc3,
      ownerId: IDS.rep1,
      title: "Helvetic Fusion extensions",
      channel: "direct" as const,
      stage: "won" as const,
      quarterlyForecast: realisticForecast(16, 40000, 260000, "won"),
      lastActivityAt: daysAgo(2),
    },
    {
      id: IDS.deal17,
      accountId: IDS.acc8,
      ownerId: IDS.rep4,
      title: "Reseller starter kit",
      channel: "reseller" as const,
      stage: "customer_test" as const,
      quarterlyForecast: realisticForecast(17, 140000, 32000, "customer_test"),
      lastActivityAt: daysAgo(10),
    },
    {
      id: IDS.deal18,
      accountId: IDS.acc9,
      ownerId: IDS.rep1,
      title: "ScanMed Secure Partner renewal",
      channel: "direct" as const,
      stage: "contract_negotiation" as const,
      quarterlyForecast: realisticForecast(18, 60000, 384000, "contract_negotiation"),
      lastActivityAt: daysAgo(3),
    },
  ];

  const stagePool = [
    "interest_shown",
    "rfi_answered",
    "rfp_offer_given",
    "customer_test",
    "contract_negotiation",
  ] as const;
  const dealTitlePrefixes = [
    "Fleet rollout",
    "FOTA expansion",
    "Edge AI bundle",
    "Device refresh",
    "Platform renewal",
    "Pilot deployment",
    "Channel bundle",
    "Core Solutions pack",
    "Field ops kit",
    "Terra M upgrade",
  ];

  const allAccountIds = accountRows.map((a) => a.id);
  const repIds = [IDS.rep1, IDS.rep2, IDS.rep3, IDS.rep4];
  const generatedDeals = [];

  for (let i = 19; i <= 85; i++) {
    const accountId = allAccountIds[i % allAccountIds.length];
    const account = accountRows.find((a) => a.id === accountId)!;
    const stage = stagePool[i % stagePool.length];
    const deviceBase = 80000 + (i % 13) * 38000 + (i % 4) * 22000;
    const serviceBase = 25000 + (i % 11) * 18000 + (i % 5) * 12000;
    generatedDeals.push({
      id: `55555555-5555-4555-8555-${String(i).padStart(12, "0")}`,
      accountId,
      ownerId: repIds[i % repIds.length],
      title: `${dealTitlePrefixes[i % dealTitlePrefixes.length]} — ${account.name.split(" ")[0]} ${2025 + (i % 3)}`,
      channel: account.channel,
      stage,
      quarterlyForecast: realisticForecast(i, deviceBase * 4, serviceBase * 4, stage),
      lastActivityAt: daysAgo(1 + (i % 28)),
      expectedCloseDate: i % 5 === 0 ? undefined : daysAhead(10 + (i % 90)),
    });
  }

  await db.insert(deals).values([...dealRows, ...generatedDeals]);

  console.log("Seeding cases…");
  await db.insert(cases).values([
    {
      id: IDS.case1,
      accountId: IDS.acc1,
      serviceId: IDS.svc4,
      assigneeId: IDS.tam1,
      title: "Secure Partner enrollment failures on batch 12",
      status: "in_progress",
      priority: "high",
      slaDueAt: daysAhead(2),
      createdAt: daysAgo(45),
    },
    {
      id: IDS.case2,
      accountId: IDS.acc3,
      serviceId: IDS.svc2,
      assigneeId: IDS.tam1,
      title: "Edge AI alert tuning request",
      status: "open",
      priority: "medium",
      slaDueAt: daysAhead(5),
      createdAt: daysAgo(120),
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
      createdAt: daysAgo(8),
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
      createdAt: daysAgo(200),
    },
    {
      id: IDS.case5,
      accountId: IDS.acc7,
      serviceId: IDS.svc5,
      assigneeId: IDS.tam1,
      title: "Compliance evidence pack for Fusion modules",
      status: "open",
      priority: "high",
      slaDueAt: daysAhead(3),
      createdAt: daysAgo(60),
    },
    {
      id: IDS.case6,
      accountId: IDS.acc6,
      serviceId: IDS.svc3,
      assigneeId: IDS.tam2,
      title: "Tactical Outfit SDK findings review",
      status: "in_progress",
      priority: "high",
      slaDueAt: daysAhead(4),
      createdAt: daysAgo(30),
    },
    {
      id: IDS.case7,
      accountId: IDS.acc4,
      serviceId: IDS.svc2,
      assigneeId: IDS.tam1,
      title: "Monthly Edge AI report delay",
      status: "open",
      priority: "medium",
      slaDueAt: daysAhead(6),
      createdAt: daysAgo(150),
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
      createdAt: daysAgo(280),
    },
    {
      id: IDS.case9,
      accountId: IDS.acc1,
      serviceId: IDS.svc1,
      assigneeId: IDS.tam1,
      title: "Policy push to 400 devices via Secure Partner",
      status: "in_progress",
      priority: "medium",
      slaDueAt: daysAhead(7),
      createdAt: daysAgo(14),
    },
    {
      id: IDS.case10,
      accountId: IDS.acc8,
      serviceId: IDS.svc1,
      assigneeId: IDS.tam2,
      title: "Secure Partner portal access",
      status: "resolved",
      priority: "low",
      slaDueAt: daysAgo(1),
      createdAt: daysAgo(95),
    },
    {
      id: IDS.case11,
      accountId: IDS.acc3,
      serviceId: IDS.svc4,
      assigneeId: IDS.tam1,
      title: "Secure Partner Platform renewal question",
      status: "open",
      priority: "medium",
      slaDueAt: daysAhead(8),
      createdAt: daysAgo(3),
    },
    {
      id: IDS.case12,
      accountId: IDS.acc9,
      serviceId: IDS.svc2,
      assigneeId: IDS.tam2,
      title: "Night shift Edge AI monitoring gap",
      status: "escalated",
      priority: "high",
      slaDueAt: daysAhead(2),
      escalatedToThirdParty: false,
      createdAt: daysAgo(22),
    },
  ]);

  console.log("Seeding offers…");
  const lineItems1 = [
    {
      itemType: "product" as const,
      itemId: IDS.prod1,
      name: "HMD Ivalo XE",
      quantity: 500,
      unitPrice: "649.00",
    },
    {
      itemType: "service" as const,
      itemId: IDS.svc1,
      name: "Core Solutions (HMD Secure + 3rd-party)",
      quantity: 1,
      unitPrice: "12000.00",
    },
  ];
  const offer1Totals = calcOfferTotals(lineItems1, 8);
  const offer2LineItems = [
    {
      itemType: "product" as const,
      itemId: IDS.prod2,
      name: "HMD Terra M",
      quantity: 300,
      unitPrice: "799.00",
    },
  ];
  const offer2Totals = calcOfferTotals(offer2LineItems, 5);
  const offer3LineItems = [
    {
      itemType: "product" as const,
      itemId: IDS.prod1,
      name: "HMD Ivalo XE",
      quantity: 200,
      unitPrice: "649.00",
    },
    {
      itemType: "service" as const,
      itemId: IDS.svc4,
      name: "Secure Partner Platform",
      quantity: 12,
      unitPrice: "2800.00",
    },
  ];
  const offer3Totals = calcOfferTotals(offer3LineItems);
  const offer4LineItems = [
    {
      itemType: "service" as const,
      itemId: IDS.svc6,
      name: "HMD FOTA",
      quantity: 12,
      unitPrice: "4200.00",
    },
  ];
  const offer4Totals = calcOfferTotals(offer4LineItems, 12);
  const offer5LineItems = [
    {
      itemType: "service" as const,
      itemId: IDS.svc2,
      name: "Edge AI as a Service",
      quantity: 36,
      unitPrice: "6800.00",
    },
  ];
  const offer5Totals = calcOfferTotals(offer5LineItems, 10);
  const offer6LineItems = [
    {
      itemType: "service" as const,
      itemId: IDS.svc1,
      name: "Core Solutions (HMD Secure + 3rd-party)",
      quantity: 1,
      unitPrice: "12000.00",
    },
  ];
  const offer6Totals = calcOfferTotals(offer6LineItems);
  const offerV2Totals = calcOfferTotals(lineItems1);

  await db.insert(offers).values([
    {
      id: IDS.offer1,
      accountId: IDS.acc1,
      dealId: IDS.deal1,
      createdById: IDS.rep1,
      lineItems: lineItems1,
      subtotal: offer1Totals.subtotal,
      discountPercent: "8.00",
      discountJustification: "Strategic Nordics reference customer",
      total: offer1Totals.total,
      status: "submitted" as const,
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer2,
      accountId: IDS.acc3,
      dealId: IDS.deal3,
      createdById: IDS.rep1,
      lineItems: offer2LineItems,
      subtotal: offer2Totals.subtotal,
      discountPercent: "5.00",
      discountJustification: "Multi-year commitment",
      total: offer2Totals.total,
      status: "submitted" as const,
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer3,
      accountId: IDS.acc9,
      dealId: IDS.deal9,
      createdById: IDS.rep1,
      lineItems: offer3LineItems,
      subtotal: offer3Totals.subtotal,
      total: offer3Totals.total,
      status: "draft" as const,
      isLocked: false,
      version: 1,
    },
    {
      id: IDS.offer4,
      accountId: IDS.acc2,
      dealId: IDS.deal2,
      createdById: IDS.rep2,
      lineItems: offer4LineItems,
      subtotal: offer4Totals.subtotal,
      discountPercent: "12.00",
      discountJustification: "Reseller volume tier",
      total: offer4Totals.total,
      status: "submitted" as const,
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer5,
      accountId: IDS.acc7,
      dealId: IDS.deal13,
      createdById: IDS.rep3,
      lineItems: offer5LineItems,
      subtotal: offer5Totals.subtotal,
      discountPercent: "10.00",
      discountJustification: "Industrial sector bundle",
      total: offer5Totals.total,
      status: "submitted" as const,
      isLocked: true,
      version: 1,
    },
    {
      id: IDS.offer6,
      accountId: IDS.acc6,
      dealId: IDS.deal12,
      createdById: IDS.rep4,
      lineItems: offer6LineItems,
      subtotal: offer6Totals.subtotal,
      total: offer6Totals.total,
      status: "draft" as const,
      isLocked: false,
      version: 1,
    },
    {
      accountId: IDS.acc1,
      dealId: IDS.deal1,
      createdById: IDS.rep1,
      lineItems: lineItems1,
      subtotal: offerV2Totals.subtotal,
      total: offerV2Totals.total,
      status: "draft" as const,
      isLocked: false,
      version: 2,
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
      body: "Escalated Secure Partner sync issue to engineering. Workaround deployed.",
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
      body: "On-site team reports 12 devices not checking in to Secure Partner Platform.",
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
      body: "Finance review scheduled for Secure Partner Platform offer.",
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
      body: "Customer requested tighter Edge AI thresholds for clinical systems.",
    },
    {
      authorId: IDS.rep4,
      accountId: IDS.acc6,
      dealId: IDS.deal12,
      body: "Core Solutions SOW sent to procurement.",
    },
  ];
  await db.insert(notes).values(
    timeline.map((note, i) => ({
      ...note,
      createdAt: daysAgo(365 - i * 28),
    })),
  );

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
      body: "Baltic Telecom field device rollout — 20 days without update",
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
}

async function seedNews() {
  console.log("Seeding CRM news…");
  const monthsAgo = (m: number) => new Date(Date.now() - m * 30 * 24 * 60 * 60 * 1000);
  await db.insert(newsPosts).values([
    {
      authorId: IDS.manager,
      title: "Q1 pipeline review",
      body: "Team hit 94% of Q1 target. Defense & Government segment leading — keep momentum on healthcare vertical.",
      createdAt: monthsAgo(11),
    },
    {
      authorId: IDS.rep1,
      body: "Closed pilot with Nordic Logistics — 500 devices moving to RFP stage. Great cross-team work with TAM!",
      createdAt: monthsAgo(8),
    },
    {
      authorId: IDS.finance,
      title: "New discount tiers",
      body: "Updated reseller volume tiers in catalog. Offers above 10% discount still need SM + Finance sign-off.",
      createdAt: monthsAgo(6),
    },
    {
      authorId: IDS.rep2,
      body: "Baltic Telecom Infrastructure deal stalled — anyone with similar channel experience, ping me.",
      createdAt: monthsAgo(3),
    },
    {
      authorId: IDS.tam1,
      body: "ScanMed hospital rollout: firmware rollback successful. Case resolved — lessons learned doc coming Monday.",
      createdAt: monthsAgo(1),
    },
    {
      authorId: IDS.rep3,
      title: "New enterprise win",
      body: "Helvetic Health signed 3-year Edge AI contract. Finance approval pending on final offer v1.",
      createdAt: daysAgo(5),
    },
    {
      authorId: IDS.manager,
      body: "Reminder: all submitted offers now route through SM → Finance. Draft offers stay editable on the deal.",
      createdAt: daysAgo(2),
    },
    {
      authorId: IDS.rep4,
      body: "Polska Grid Core Solutions SOW approved — kicking off Secure Partner onboarding next week.",
      createdAt: daysAgo(1),
    },
  ]);
}

seed()
  .then(seedNews)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
