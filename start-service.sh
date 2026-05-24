#!/bin/bash
# Used by systemd — no browser open, logs go to journald
cd /home/robbieaibot/Desktop/mirla-health

# Free ports if anything is lingering
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true
sleep 1

# Start API server
node server/index.js &
SERVER_PID=$!

# Start React frontend
PORT=3000 npm start &
REACT_PID=$!

# Start Cloudflare tunnel — wait for React to be up first
sleep 15
~/cloudflared tunnel --url http://localhost:3000 --no-autoupdate > /tmp/cloudflare-tunnel.log 2>&1 &
TUNNEL_PID=$!

# Extract and save the public URL once it appears
sleep 8
URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflare-tunnel.log | head -1)
if [ -n "$URL" ]; then
  echo "$URL" > /tmp/mirla-public-url.txt
  echo "🌐 Mirla public URL: $URL"
fi

echo "Mirla Health running — API :3001, App :3000"

trap "kill $SERVER_PID $REACT_PID $TUNNEL_PID 2>/dev/null; pkill -f cloudflared 2>/dev/null" EXIT INT TERM
wait $SERVER_PID $REACT_PID
