#!/bin/bash
set -e

LOG_DIR="/var/log/nuraskin"
LOG_FILE="${LOG_DIR}/cleanup.log"

mkdir -p "$LOG_DIR"

echo "=== Docker Cleanup Started at $(date) ===" >> "$LOG_FILE"

# Prune containers, images, volumes, and networks that are not in use
docker container prune -f >> "$LOG_FILE" 2>&1
docker image prune -a -f >> "$LOG_FILE" 2>&1
docker volume prune -f >> "$LOG_FILE" 2>&1
docker network prune -f >> "$LOG_FILE" 2>&1

echo "--- Docker System DF After Cleanup ---" >> "$LOG_FILE"
docker system df >> "$LOG_FILE" 2>&1

echo "=== Docker Cleanup Finished at $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
