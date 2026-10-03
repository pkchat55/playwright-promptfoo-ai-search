#!/usr/bin/env bash
set -euo pipefail

node app/server.js &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for the server to be ready
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

npm run test:ui
npm run test:ai
