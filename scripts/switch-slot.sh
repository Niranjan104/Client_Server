#!/usr/bin/env bash
# switch-slot.sh
# Usage: ./scripts/switch-slot.sh blue|green
# Restarts NGINX with the new ACTIVE_COLOR without touching the app containers

set -e

NEW_COLOR=${1:-blue}

if [[ "$NEW_COLOR" != "blue" && "$NEW_COLOR" != "green" ]]; then
  echo "❌ Usage: $0 blue|green"
  exit 1
fi

echo "🔀 Switching active slot to: $NEW_COLOR"

# Update the NGINX container's env var and restart just it
ACTIVE_COLOR=$NEW_COLOR docker compose up -d --no-deps nginx

echo "⏳ Waiting for NGINX to restart..."
sleep 3

# Smoke test the new active slot
HEALTH=$(curl -s http://localhost/health 2>/dev/null || echo '{}')
echo "🩺 NGINX health check: $HEALTH"

echo ""
echo "✅ Traffic is now routing to: $NEW_COLOR"
echo "   Client → http://localhost"
echo "   API    → http://localhost/api/version"
