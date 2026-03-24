#!/usr/bin/env bash
set -euo pipefail

# LaunchLab — Build & Run for Production
# Usage: ./scripts/deploy.sh [--build-only | --run-only]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
HOST="${LAUNCHLAB_HOST:-0.0.0.0}"
PORT="${LAUNCHLAB_PORT:-8000}"

build_frontend() {
    echo "==> Building frontend..."
    cd "$FRONTEND_DIR"
    npm ci --silent
    npm run build
    echo "==> Frontend built to $FRONTEND_DIR/dist"
}

run_server() {
    cd "$BACKEND_DIR"

    if [ ! -d "$FRONTEND_DIR/dist" ]; then
        echo "ERROR: Frontend not built. Run with --build-only first or without flags."
        exit 1
    fi

    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo "ERROR: No .env file found in backend/. Copy .env.example and configure it."
        exit 1
    fi

    echo "==> Running database migrations..."
    uv run alembic upgrade head

    echo "==> Starting LaunchLab on $HOST:$PORT"
    exec uv run uvicorn main:app --host "$HOST" --port "$PORT" --workers 1
}

case "${1:-all}" in
    --build-only)
        build_frontend
        ;;
    --run-only)
        run_server
        ;;
    all)
        build_frontend
        run_server
        ;;
    *)
        echo "Usage: $0 [--build-only | --run-only]"
        exit 1
        ;;
esac
