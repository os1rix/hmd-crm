import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    const rows = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
    return Response.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    console.error("[api/users]", message);
    return Response.json([], { status: 200 });
  }
}
