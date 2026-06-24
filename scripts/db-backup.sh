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
  
  # Send backup file to Telegram (only if under 50MB)
  # Note: -c%s works on GNU/Linux. For macOS use -f%z. Target is Ubuntu VPS.
  BACKUP_SIZE_BYTES=$(stat -c%s "$BACKUP_FILE")
  MAX_SIZE=50000000  # 50MB Telegram limit

  if [ "$BACKUP_SIZE_BYTES" -lt "$MAX_SIZE" ]; then
    curl -s \
      -F "chat_id=$TELEGRAM_ADMIN_CHAT_ID" \
      -F "document=@${BACKUP_FILE}" \
      -F "caption=💾 NuraSkin DB Backup
📅 $(date '+%Y-%m-%d %H:%M')
📦 Size: $SIZE
🗄️ Database: $POSTGRES_DB" \
      "https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendDocument" \
      -o /dev/null
    echo "Backup file sent to Telegram"
  else
    echo "Backup too large for Telegram (${BACKUP_SIZE_BYTES} bytes), skipping file send"
  fi

  # Delete backups older than 7 days
  find "$BACKUP_DIR" -name "nuraskin_backup_*.sql.gz" -type f -mtime +7 -delete
else
  send_telegram "❌ CRITICAL: NuraSkin DB Backup FAILED!
Time: $(date)
Check the VPS immediately."
  exit 1
fi
