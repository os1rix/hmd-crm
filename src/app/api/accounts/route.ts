import { db } from "@/db";
import { accounts } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { createAccountSchema } from "@/lib/validators";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.query.accounts.findMany({
      orderBy: [desc(accounts.updatedAt)],
      with: {
        owner: true,
        contacts: true,
      },
    });
    return apiSuccess(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch accounts";
    return apiError(message);
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
