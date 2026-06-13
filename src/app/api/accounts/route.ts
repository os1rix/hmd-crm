import { db } from "@/db";
import { accounts } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { createAccountSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSessionUser();
    const rows = await db.query.accounts.findMany({
      where: user?.role === "sales_rep" ? eq(accounts.ownerId, user.id) : undefined,
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
