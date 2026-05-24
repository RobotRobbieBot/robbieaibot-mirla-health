#!/bin/bash
# Used by systemd — no browser open, logs go to journald
# NOTE: API server (port 3003) is managed by patient2-backend.service — not started here
cd /home/robbieaibot/Desktop/patient2-health

# Free port 3002 if anything is lingering
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
sleep 1

# Start React frontend (port 3002)
PORT=3002 npm start &
REACT_PID=$!

# Start Cloudflare tunnel — wait for React to be up first
sleep 15
~/cloudflared tunnel --url http://localhost:3002 --no-autoupdate > /tmp/cloudflare-tunnel-p2.log 2>&1 &
TUNNEL_PID=$!

# Extract and save the public URL once it appears
sleep 8
URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflare-tunnel-p2.log | head -1)
if [ -n "$URL" ]; then
  echo "$URL" > /tmp/patient2-public-url.txt
  echo "🌐 Patient 2 public URL: $URL"
fi

echo "Patient 2 Health Hub running — App :3002 (API :3003 via patient2-backend.service)"

trap "kill $REACT_PID $TUNNEL_PID 2>/dev/null" EXIT INT TERM
wait $REACT_PID
