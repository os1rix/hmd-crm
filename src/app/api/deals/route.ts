import { db } from "@/db";
import { deals } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { createDealSchema } from "@/lib/validators";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.query.deals.findMany({
      orderBy: [desc(deals.updatedAt)],
      with: {
        account: true,
        owner: true,
      },
    });
    return apiSuccess(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch deals";
    return apiError(message);
  }
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createDealSchema);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const { threeYearForecast, quarterlyForecast, expectedCloseDate, ...rest } = parsed.data;

  try {
    const [deal] = await db
      .insert(deals)
      .values({
        ...rest,
        expectedCloseDate,
        threeYearForecast: threeYearForecast?.toString(),
        quarterlyForecast,
        lastActivityAt: new Date(),
      })
      .returning();
    return apiSuccess(deal, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create deal";
    return apiError(message);
  }
}
