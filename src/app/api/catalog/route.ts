import { db } from "@/db";
import { products, services } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET() {
  try {
    const [productRows, serviceRows] = await Promise.all([
      db.select().from(products),
      db.select().from(services),
    ]);
    return apiSuccess({ products: productRows, services: serviceRows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch catalog";
    return apiError(message);
  }
}
