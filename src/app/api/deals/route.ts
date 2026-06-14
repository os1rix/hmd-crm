import { db } from "@/db";
import { deals } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { parseFilterDateEnd, parseFilterDateStart } from "@/lib/date-filters";
import { getSessionUser } from "@/lib/session";
import { createDealSchema } from "@/lib/validators";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");
    const channel = url.searchParams.get("channel");
    const ownerId = url.searchParams.get("ownerId");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const rows = await db.query.deals.findMany({
      where: and(
        user?.role === "sales_rep" ? eq(deals.ownerId, user.id) : undefined,
        stage ? eq(deals.stage, stage as (typeof deals.stage.enumValues)[number]) : undefined,
        channel
          ? eq(deals.channel, channel as (typeof deals.channel.enumValues)[number])
          : undefined,
        ownerId ? eq(deals.ownerId, ownerId) : undefined,
        dateFrom ? gte(deals.createdAt, parseFilterDateStart(dateFrom)) : undefined,
        dateTo ? lte(deals.createdAt, parseFilterDateEnd(dateTo)) : undefined,
      ),
      orderBy: [desc(deals.updatedAt)],
      with: {
        account: true,
        owner: true,
        offers: {
          with: { approvals: true, createdBy: true },
          orderBy: (offers, { desc: d }) => [d(offers.version)],
        },
      },
    });
    return Response.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch deals";
    console.error("[api/deals]", message);
    return apiError(message, 503);
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
