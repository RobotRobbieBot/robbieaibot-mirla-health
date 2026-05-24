#!/bin/bash
set -e

echo ""
echo "💛 Starting Mirla Health..."
echo ""

# Kill anything already on the ports
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Start API server
node server/index.js &
SERVER_PID=$!

# Start React frontend
PORT=3000 npm start &
REACT_PID=$!

# Open browser after React finishes compiling (~10s)
sleep 12 && xdg-open http://localhost:3000 2>/dev/null || true &

echo "  API server  → http://localhost:3001"
echo "  App         → http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop everything"
echo ""

# On Ctrl+C kill both processes
trap "echo ''; echo 'Stopping...'; kill $SERVER_PID $REACT_PID 2>/dev/null; exit 0" INT TERM

wait
