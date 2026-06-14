export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fi", label: "Finnish" },
  { value: "sv", label: "Swedish" },
  { value: "de", label: "German" },
] as const;

export const APPEARANCES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];
export type Appearance = (typeof APPEARANCES)[number]["value"];

export type NotificationPrefs = {
  dealApprovals: boolean;
  offerSubmissions: boolean;
  caseAssignments: boolean;
  dealAtRisk: boolean;
  financeReviews: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
};

export type UserPreferences = {
  language: Language;
  appearance: Appearance;
  notifications: NotificationPrefs;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dealApprovals: true,
  offerSubmissions: true,
  caseAssignments: true,
  dealAtRisk: true,
  financeReviews: true,
  productUpdates: false,
  weeklyDigest: true,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: "en",
  appearance: "dark",
  notifications: DEFAULT_NOTIFICATION_PREFS,
};

export function mergePreferences(raw: unknown): UserPreferences {
  const obj = raw && typeof raw === "object" ? (raw as Partial<UserPreferences>) : {};
  return {
    language: LANGUAGES.some((l) => l.value === obj.language) ? obj.language! : "en",
    appearance: APPEARANCES.some((a) => a.value === obj.appearance) ? obj.appearance! : "dark",
    notifications: {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...(obj.notifications && typeof obj.notifications === "object" ? obj.notifications : {}),
    },
  };
}

export const NOTIFICATION_OPTIONS: Array<{
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}> = [
  {
    key: "dealApprovals",
    label: "Deal & offer approvals",
    description: "When an offer needs your sign-off or approval status changes.",
  },
  {
    key: "offerSubmissions",
    label: "Offer submissions",
    description: "When a rep submits a new offer for review.",
  },
  {
    key: "caseAssignments",
    label: "Case assignments",
    description: "When a support case is assigned to you or escalated.",
  },
  {
    key: "dealAtRisk",
    label: "Deals at risk",
    description: "Alerts when pipeline deals go idle or miss activity targets.",
  },
  {
    key: "financeReviews",
    label: "Finance reviews",
    description: "Finance approval queue and discount threshold alerts.",
  },
  {
    key: "productUpdates",
    label: "Product & catalog updates",
    description: "New devices, services, and pricing tier changes.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description: "Summary of pipeline movement and team activity every Monday.",
  },
];
