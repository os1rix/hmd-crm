import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(label, cmd, args) {
  console.log(`[startup] ${label}`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("Running migrations", "npx", ["drizzle-kit", "migrate"]);
run("Seeding database", "npx", ["tsx", "scripts/seed.ts"]);
run("Starting server", "node", ["server.js"]);
