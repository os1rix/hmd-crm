export const INDUSTRIES = [
  "Defense & Government",
  "Public Safety & First Responders",
  "Critical Infrastructure",
  "Enterprise & Industrial",
  "Healthcare",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
