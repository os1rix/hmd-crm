import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const root = path.dirname(fileURLToPath(import.meta.url));

function resolveMigrationsFolder() {
  for (const candidate of [path.join(root, "drizzle"), path.join(root, "..", "drizzle")]) {
    if (fs.existsSync(path.join(candidate, "meta", "_journal.json"))) {
      return candidate;
    }
  }
  throw new Error("Can't find drizzle folder with meta/_journal.json");
}

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

/** DB was created with db:push — mark initial migration applied so only new ones run. */
async function baselineIfNeeded(sql, migrationsFolder) {
  const [{ hasAccounts }] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'accounts'
    ) AS "hasAccounts"
  `;
  if (!hasAccounts) return;

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const applied = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
  if (applied.length > 0) return;

  const migrations = readMigrationFiles({ migrationsFolder });
  const initial = migrations[0];
  if (!initial) return;

  console.log("[db-setup] Existing schema detected — baselining initial migration");
  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${initial.hash}, ${initial.folderMillis})
  `;
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

  const migrationsFolder = resolveMigrationsFolder();
  console.log(`[db-setup] Migrations folder: ${migrationsFolder}`);

  await baselineIfNeeded(sql, migrationsFolder);

  console.log("[db-setup] Running migrations…");
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder });
  console.log("[db-setup] Migrations complete");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[db-setup] Failed:", message);
  process.exit(1);
} finally {
  if (sql) {
    await sql.end();
  }
}
