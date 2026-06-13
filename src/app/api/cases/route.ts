import { db } from "@/db";
import { cases, notes } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody, validationErrorResponse } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { createCaseSchema, createNoteSchema, updateCaseSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "true";

  try {
    const rows = await db.query.cases.findMany({
      where: mine && user ? eq(cases.assigneeId, user.id) : undefined,
      orderBy: [desc(cases.updatedAt)],
      with: {
        account: true,
        assignee: true,
        service: true,
        notes: { with: { author: true } },
      },
    });
    return Response.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch cases";
    console.error("[api/cases]", message);
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, createCaseSchema);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const [row] = await db
      .insert(cases)
      .values({ ...parsed.data, assigneeId: user.role === "tam" ? user.id : undefined })
      .returning();
    return apiSuccess(row, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create case";
    return apiError(message);
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await request.json();
  const { id, ...updates } = body as { id: string } & Record<string, unknown>;
  const parsed = updateCaseSchema.safeParse(updates);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const [row] = await db
      .update(cases)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();

    if (parsed.data.note) {
      await db.insert(notes).values({
        authorId: user.id,
        accountId: row.accountId,
        caseId: id,
        body: parsed.data.note,
      });
    }

    return apiSuccess(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update case";
    return apiError(message);
  }
}
