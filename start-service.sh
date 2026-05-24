#!/bin/bash
# Used by systemd — no browser open, logs go to journald
# NOTE: API server (port 3003) is managed by patient2-backend.service — not started here
# Access via Tailscale: http://100.106.0.58:3002
cd /home/robbieaibot/Desktop/patient2-health

# Free port 3002 if anything is lingering
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
sleep 1

# Start React frontend (port 3002)
PORT=3002 npm start &
REACT_PID=$!

echo "Patient 2 Health Hub running — App :3002 (API :3003 via patient2-backend.service)"
echo "Access via Tailscale: http://100.106.0.58:3002"

trap "kill $REACT_PID 2>/dev/null" EXIT INT TERM
wait $REACT_PID
