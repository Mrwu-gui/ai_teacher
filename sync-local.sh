#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$ROOT_DIR/src"

echo "Building frontend..."
cd "$SRC_DIR"
npm run build

echo "Syncing dist to local runtime..."
cd "$ROOT_DIR"
rsync -a src/dist/ ./

echo "Done."
echo "If you changed server.mjs too, restart with:"
echo "  ./start-local.sh"
