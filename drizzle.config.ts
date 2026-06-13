import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "postgresql://hmd:hmd@localhost:5432/hmd_crm";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: url.includes("azure.com") ? "require" : false,
  },
});
