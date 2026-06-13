#!/bin/sh
set -e

npm run dev &
dev_pid=$!

cleanup() {
  kill "$dev_pid" 2>/dev/null || true
}

trap cleanup INT TERM

if [ "${WARM_ROUTES:-true}" = "true" ]; then
  node scripts/warm-routes.mjs || echo "[warm] Warmup failed; dev server still running"
fi

wait "$dev_pid"
