#!/bin/bash
# Used by systemd — no browser open, logs go to journald
# NOTE: API server (port 3001) is managed by mirla-backend.service — not started here
# Access via Tailscale: http://100.106.0.58:3000
cd /home/robbieaibot/Desktop/mirla-health

# Free port 3000 if anything is lingering
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Serve the production build (stable — no dev server, no browser auto-open)
exec /home/robbieaibot/.npm-global/bin/serve -s build -l 3000 --no-clipboard
