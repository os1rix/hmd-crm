import { db } from "@/db";
import { apiError, apiSuccess } from "@/lib/api";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return apiSuccess({
      status: "ok",
      service: "hmd-crm",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unreachable";
    return apiError(message, 503);
  }
}
