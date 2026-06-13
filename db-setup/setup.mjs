import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const root = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[db-setup] DATABASE_URL is not set");
  process.exit(1);
}

const ssl = url.includes("azure.com") ? "require" : undefined;
const postgresOptions = { max: 1, connect_timeout: 30, ssl };

function targetDatabase(connectionUrl) {
  const parsed = new URL(connectionUrl);
  return decodeURIComponent(parsed.pathname.replace(/^\//, "") || "postgres");
}

function withDatabase(connectionUrl, database) {
  const parsed = new URL(connectionUrl);
  parsed.pathname = `/${encodeURIComponent(database)}`;
  return parsed.toString();
}

async function ensureDatabase(connectionUrl) {
  const database = targetDatabase(connectionUrl);
  const adminUrl = withDatabase(connectionUrl, "postgres");
  const admin = postgres(adminUrl, postgresOptions);

  try {
    const [{ exists }] = await admin`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${database}) AS exists
    `;

    if (!exists) {
      console.log(`[db-setup] Creating database "${database}"…`);
      await admin.unsafe(`CREATE DATABASE "${database.replace(/"/g, '""')}"`);
      console.log(`[db-setup] Database "${database}" created`);
    }
  } finally {
    await admin.end();
  }
}

async function connect(connectionUrl) {
  return postgres(connectionUrl, postgresOptions);
}

let sql;

try {
  console.log("[db-setup] Testing database connection…");

  try {
    sql = await connect(url);
    await sql`SELECT 1`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("does not exist")) {
      throw error;
    }

    console.log("[db-setup] Target database missing, creating it…");
    await ensureDatabase(url);
    sql = await connect(url);
    await sql`SELECT 1`;
  }

  console.log("[db-setup] Connected");

  const [{ reg }] = await sql`SELECT to_regclass('public.users') AS reg`;

  if (reg) {
    console.log("[db-setup] Schema already exists, skipping migrations");
  } else {
    console.log("[db-setup] Running migrations…");
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: path.join(root, "drizzle") });
    console.log("[db-setup] Migrations complete");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[db-setup] Failed:", message);
  process.exit(1);
} finally {
  if (sql) {
    await sql.end();
  }
}
