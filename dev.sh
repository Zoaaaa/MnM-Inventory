#!/bin/bash
# MnM Inventory - Start development servers
# Usage: ./dev.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting MnM Inventory..."

# Start backend in background
cd "$SCRIPT_DIR/backend" && npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd "$SCRIPT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Store:  http://localhost:5173"
echo "  Admin:  http://localhost:5173/admin"
echo "  API:    http://localhost:5000/api/health"
echo ""
echo "  Press Ctrl+C to stop both servers"

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
