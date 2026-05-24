#!/bin/bash
set -e

echo ""
echo "💛 Starting Patient 2 Health Hub..."
echo ""

# Kill anything already on these ports
lsof -ti:3002,3003 | xargs kill -9 2>/dev/null || true
sleep 1

# Start API server (port 3003)
node server/index.js &
SERVER_PID=$!

# Start React frontend (port 3002)
PORT=3002 npm start &
REACT_PID=$!

# Open browser after React finishes compiling (~10s)
sleep 12 && xdg-open http://localhost:3002 2>/dev/null || true &

echo "  API server  → http://localhost:3003"
echo "  App         → http://localhost:3002"
echo ""
echo "  Press Ctrl+C to stop everything"
echo ""

# On Ctrl+C kill both processes
trap "echo ''; echo 'Stopping...'; kill $SERVER_PID $REACT_PID 2>/dev/null; exit 0" INT TERM

wait
