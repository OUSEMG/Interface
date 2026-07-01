#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

python -m uvicorn main:app --reload --app-dir "$ROOT/modules/atlas/backend" &
BACKEND_PID=$!

cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT INT TERM

echo "Backend PID: $BACKEND_PID  (http://127.0.0.1:8000)"
echo "Frontend PID: $FRONTEND_PID  (http://localhost:5173)"
wait
