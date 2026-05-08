#!/bin/bash

source /etc/nuraskin-monitoring.env

THRESHOLD=90

send_telegram() {
  local message="$1"
  if [ -n "$ADMIN_BOT_TOKEN" ] && [ -n "$TELEGRAM_ADMIN_CHAT_ID" ] && [ "$ADMIN_BOT_TOKEN" != "REPLACE_WITH_TOKEN" ]; then
    curl -s -X POST "https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_ADMIN_CHAT_ID}" \
      -d text="${message}" > /dev/null
  fi
}

# Calculate memory usage percentage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f"), $3/$2 * 100.0}')

if [ "$MEMORY_USAGE" -gt "$THRESHOLD" ]; then
  HOSTNAME=$(hostname)
  TIME=$(date +"%Y-%m-%d %H:%M:%S")
  
  MESSAGE="⚠️ NuraSkin VPS Alert: High Memory Usage
Hostname: ${HOSTNAME}
Usage: ${MEMORY_USAGE}%
Threshold: ${THRESHOLD}%
Time: ${TIME}"

  send_telegram "$MESSAGE"
fi
