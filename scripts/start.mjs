import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dbSetup = path.join(root, "db-setup");
const isDev = process.argv.includes("--dev");

const tsx = fs.existsSync(path.join(root, "node_modules/.bin/tsx"))
  ? path.join(root, "node_modules/.bin/tsx")
  : path.join(dbSetup, "node_modules/.bin/tsx");

const seedCwd = fs.existsSync(path.join(root, "scripts/seed.ts")) ? root : dbSetup;

function run(label, cmd, args, cwd = root) {
  console.log(`[startup] ${label}`);
  const result = spawnSync(cmd, args, {
    cwd,
    env: process.env,
    encoding: "utf-8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    console.error(`[startup] ${label} error:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[startup] ${label} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

run("Database setup", "node", ["setup.mjs"], dbSetup);
run("Seeding database", tsx, ["scripts/seed.ts"], seedCwd);

if (isDev) {
  console.log("[startup] Starting Next.js dev server");
  const dev = spawn("npm", ["run", "dev"], { cwd: root, env: process.env, stdio: "inherit" });
  dev.on("exit", (code) => process.exit(code ?? 0));
} else {
  run("Starting server", "node", ["server.js"], root);
}
