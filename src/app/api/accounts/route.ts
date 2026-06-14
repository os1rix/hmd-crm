import { db } from "@/db";
import { accounts } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { parseFilterDateStart } from "@/lib/date-filters";
import { getSessionUser } from "@/lib/session";
import { createAccountSchema } from "@/lib/validators";
import { and, desc, eq, gte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    const url = new URL(request.url);
    const channel = url.searchParams.get("channel");
    const ownerId = url.searchParams.get("ownerId");
    const dateFrom = url.searchParams.get("dateFrom");
    const segment = url.searchParams.get("segment");

    const rows = await db.query.accounts.findMany({
      where: and(
        user?.role === "sales_rep" ? eq(accounts.ownerId, user.id) : undefined,
        channel
          ? eq(accounts.channel, channel as (typeof accounts.channel.enumValues)[number])
          : undefined,
        ownerId ? eq(accounts.ownerId, ownerId) : undefined,
        segment ? eq(accounts.segment, segment) : undefined,
        dateFrom ? gte(accounts.createdAt, parseFilterDateStart(dateFrom)) : undefined,
      ),
      orderBy: [desc(accounts.updatedAt)],
      with: {
        owner: true,
        contacts: true,
        deals: {
          orderBy: (deals, { desc: descFn }) => [descFn(deals.updatedAt)],
        },
      },
    });
    return Response.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch accounts";
    console.error("[api/accounts]", message);
    return apiError(message, 503);
  }
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createAccountSchema);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  try {
    const [account] = await db.insert(accounts).values(parsed.data).returning();
    return apiSuccess(account, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create account";
    return apiError(message);
  }
}
