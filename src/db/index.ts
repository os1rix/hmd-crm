import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://hmd:hmd@localhost:5432/hmd_crm";

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: connectionString.includes("azure.com") ? "require" : undefined,
});

export const db = drizzle(client, { schema });
