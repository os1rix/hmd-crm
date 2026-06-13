const routes = [
  "/",
  "/accounts",
  "/deals",
  "/cases",
  "/catalog",
  "/forecast",
  "/api/health",
  "/api/accounts",
  "/api/deals",
];

const base = process.env.WARMUP_URL ?? "http://localhost:3000";
const maxAttempts = Number(process.env.WARMUP_MAX_ATTEMPTS ?? 90);

async function waitForServer() {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

async function warmRoute(route) {
  const response = await fetch(`${base}${route}`);
  console.log(`[warm] ${route} -> ${response.status}`);
}

async function main() {
  console.log(`[warm] Waiting for ${base}/api/health`);

  if (!(await waitForServer())) {
    console.error("[warm] Server did not become ready in time");
    process.exit(1);
  }

  console.log("[warm] Pre-compiling routes");

  for (const route of routes) {
    try {
      await warmRoute(route);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`[warm] ${route} -> ${message}`);
    }
  }

  console.log("[warm] Done");
}

await main();
