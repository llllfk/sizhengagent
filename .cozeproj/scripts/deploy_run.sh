#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

PORT="${DEPLOY_RUN_PORT:-5000}"

start_service() {
  echo "Starting Next.js HTTP service on port ${PORT} for deploy..."
  pnpm run start --hostname 0.0.0.0 --port "${PORT}"
}

start_service