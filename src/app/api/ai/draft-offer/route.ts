import { callAi } from "@/lib/ai";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(request: Request) {
  const { dealTitle, accountName, catalog } = (await request.json()) as {
    dealTitle: string;
    accountName: string;
    catalog: unknown;
  };

  try {
    const text = await callAi(
      'Draft a B2B offer as JSON array: [{"itemType":"product|service","name":"","quantity":number,"unitPrice":"string"}]. Use realistic HMD Secure devices and services.',
      [
        {
          role: "user",
          content: `Deal: ${dealTitle}\nAccount: ${accountName}\nCatalog: ${JSON.stringify(catalog)}`,
        },
      ],
    );

    try {
      const lineItems = JSON.parse(text);
      return apiSuccess({ lineItems });
    } catch {
      return apiSuccess({ lineItems: [], raw: text });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI failed";
    return apiError(message);
  }
}
