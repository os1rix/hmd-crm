import { db } from "@/db";
import { newsPosts } from "@/db/schema";
import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { desc } from "drizzle-orm";
import { z } from "zod";

const createNewsSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
});

export async function GET() {
  try {
    const rows = await db.query.newsPosts.findMany({
      orderBy: [desc(newsPosts.createdAt)],
      limit: 50,
      with: { author: true },
    });
    return Response.json(rows);
  } catch {
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, createNewsSchema);
  if (!parsed.success) return apiError("Invalid body", 400);

  try {
    const [post] = await db
      .insert(newsPosts)
      .values({
        authorId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
      })
      .returning();
    return apiSuccess(post, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return apiError(message);
  }
}
