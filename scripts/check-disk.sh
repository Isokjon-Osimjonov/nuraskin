#!/bin/bash

source /etc/nuraskin-monitoring.env

THRESHOLD=85

send_telegram() {
  local message="$1"
  if [ -n "$ADMIN_BOT_TOKEN" ] && [ -n "$TELEGRAM_ADMIN_CHAT_ID" ] && [ "$ADMIN_BOT_TOKEN" != "REPLACE_WITH_TOKEN" ]; then
    curl -s -X POST "https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_ADMIN_CHAT_ID}" \
      -d text="${message}" > /dev/null
  fi
}

# Get disk usage percentage of root partition (remove % sign)
DISK_USAGE=$(df / | grep / | awk '{ print $5}' | sed 's/%//g')

if [ "$DISK_USAGE" -gt "$THRESHOLD" ]; then
  HOSTNAME=$(hostname)
  TIME=$(date +"%Y-%m-%d %H:%M:%S")
  
  MESSAGE="⚠️ NuraSkin VPS Alert: High Disk Usage
Hostname: ${HOSTNAME}
Usage: ${DISK_USAGE}%
Threshold: ${THRESHOLD}%
Time: ${TIME}"

  send_telegram "$MESSAGE"
fi
