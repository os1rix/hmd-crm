import { db } from "@/db";
import { notifications } from "@/db/schema";
import { apiError } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 20,
    });
    return Response.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return apiError(message);
  }
}
