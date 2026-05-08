#!/bin/bash
set -e

source /etc/nuraskin-monitoring.env

BACKUP_DIR="/var/backups/nuraskin"
CONTAINER="nuraskin-postgres"
POSTGRES_USER="nuraskin_user"
POSTGRES_DB="nuraskin_prod"
DATE=$(date +"%Y-%m-%d_%H-%M")
BACKUP_FILE="${BACKUP_DIR}/nuraskin_backup_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

send_telegram() {
  local message="$1"
  if [ -n "$ADMIN_BOT_TOKEN" ] && [ -n "$TELEGRAM_ADMIN_CHAT_ID" ] && [ "$ADMIN_BOT_TOKEN" != "REPLACE_WITH_TOKEN" ]; then
    curl -s -X POST "https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_ADMIN_CHAT_ID}" \
      -d text="${message}" > /dev/null
  fi
}

if docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"; then
  SIZE=$(du -h "$BACKUP_FILE" | awk '{print $1}')
  send_telegram "✅ NuraSkin DB Backup Success!
File: $(basename "$BACKUP_FILE")
Size: $SIZE
Time: $(date)"
  
  # Delete backups older than 7 days
  find "$BACKUP_DIR" -name "nuraskin_backup_*.sql.gz" -type f -mtime +7 -delete
else
  send_telegram "❌ CRITICAL: NuraSkin DB Backup FAILED!
Time: $(date)
Check the VPS immediately."
  exit 1
fi
