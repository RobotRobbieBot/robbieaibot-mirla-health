#!/bin/bash
# Used by systemd — no browser open, logs go to journald
# NOTE: API server (port 3001) is managed by mirla-backend.service — not started here
# Access via Tailscale: http://100.106.0.58:3000
cd /home/robbieaibot/Desktop/mirla-health

# Free port 3000 if anything is lingering
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start React frontend
PORT=3000 npm start &
REACT_PID=$!

echo "Mirla Health running — App :3000 (API :3001 via mirla-backend.service)"
echo "Access via Tailscale: http://100.106.0.58:3000"

trap "kill $REACT_PID 2>/dev/null" EXIT INT TERM
wait $REACT_PID
