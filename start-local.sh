#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-3000}"

cd "$ROOT_DIR"

EXISTING_PIDS="$(lsof -tiTCP:$PORT -sTCP:LISTEN || true)"
if [[ -n "$EXISTING_PIDS" ]]; then
  echo "Killing existing process on port $PORT:"
  printf '%s\n' "$EXISTING_PIDS"
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    kill "$pid" || true
  done <<< "$EXISTING_PIDS"
  sleep 1
fi

echo "Starting local server at http://localhost:$PORT"
DIST_DIR=. PORT="$PORT" node server.mjs
