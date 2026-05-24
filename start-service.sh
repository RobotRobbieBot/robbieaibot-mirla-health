#!/bin/bash
# Used by systemd — no browser open, logs go to journald
cd /home/robbieaibot/Desktop/mirla-health

# Free ports if anything is lingering
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Start API server
node server/index.js &
SERVER_PID=$!

# Start React frontend
PORT=3000 npm start &
REACT_PID=$!

echo "Mirla Health running — API :3001, App :3000"

trap "kill $SERVER_PID $REACT_PID 2>/dev/null" EXIT INT TERM
wait $SERVER_PID $REACT_PID
