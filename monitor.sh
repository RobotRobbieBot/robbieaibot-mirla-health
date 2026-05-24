#!/bin/bash
# Health monitor — runs every 5 min via systemd timer
# Sends a desktop notification if either app stops responding

MIRLA_API="http://localhost:3001/api/health"
MIRLA_APP="http://localhost:3000"
P2_API="http://localhost:3003/api/health"
P2_APP="http://localhost:3002"

STATE_DIR="/tmp/mirla-monitor"
mkdir -p "$STATE_DIR"

check() {
  local name="$1"
  local url="$2"
  local state_file="$STATE_DIR/${name}.state"

  if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
    # Up — if it was previously down, send recovery notice
    if [ -f "$state_file" ]; then
      DISPLAY=:0 DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus" \
        notify-send "✅ $name is back up" "Recovered and responding normally." \
        --icon=dialog-information --urgency=normal
      rm -f "$state_file"
    fi
  else
    # Down — notify only once (avoid spam if it stays down)
    if [ ! -f "$state_file" ]; then
      DISPLAY=:0 DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus" \
        notify-send "🚨 $name is DOWN" "Not responding at $url — check the service." \
        --icon=dialog-error --urgency=critical
      echo "$(date)" > "$state_file"
    fi
  fi
}

check "Mirla API"        "$MIRLA_API"
check "Mirla App"        "$MIRLA_APP"
check "Patient 2 API"   "$P2_API"
check "Patient 2 App"   "$P2_APP"
