# NuraSkin VPS Scripts & Documentation

This directory contains maintenance and monitoring scripts for the NuraSkin production VPS.

## Scripts Overview

### `vps-setup.sh`

- **What it does:** Idempotent script to bootstrap a fresh Ubuntu 24.04 VPS. Configures Docker daemon logging and limits, sets up Nginx reverse proxy configs with rate limiting, creates error pages, configures UFW, and adds cron jobs.
- **Run manually:** `sudo bash scripts/vps-setup.sh`
- **Cron:** None. Run once on setup.

### `db-backup.sh`

- **What it does:** Runs `pg_dump` inside the Postgres container, gzips the output, saves it to `/var/backups/nuraskin`, deletes backups older than 7 days, and sends a Telegram notification on success or failure.
- **Run manually:** `sudo bash scripts/db-backup.sh`
- **Cron:** Every day at 02:00 AM.
- **Env Vars:** Requires `ADMIN_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` in `/etc/nuraskin-monitoring.env`.

### `check-disk.sh`

- **What it does:** Checks root partition disk usage. Sends a Telegram alert if usage exceeds 85%.
- **Run manually:** `bash scripts/check-disk.sh`
- **Cron:** Every hour.
- **Env Vars:** Requires `ADMIN_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` in `/etc/nuraskin-monitoring.env`.

### `check-memory.sh`

- **What it does:** Checks active memory usage. Sends a Telegram alert if usage exceeds 90%.
- **Run manually:** `bash scripts/check-memory.sh`
- **Cron:** Every 30 minutes.
- **Env Vars:** Requires `ADMIN_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` in `/etc/nuraskin-monitoring.env`.

### `docker-cleanup.sh`

- **What it does:** Runs `docker system prune` for containers, images, volumes, and networks to free up disk space. Logs output to `/var/log/nuraskin/cleanup.log`.
- **Run manually:** `sudo bash scripts/docker-cleanup.sh`
- **Cron:** Every Sunday at 03:00 AM.

---

## VPS Deployment Checklist

1. **SSH into VPS:** `ssh root@<YOUR_VPS_IP>`
2. **Install Docker:** `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
3. **Add user to docker group:** `usermod -aG docker ubuntu` (or your user)
4. **Clone repo:** `git clone git@github.com:<GH_USER>/nuraskin.git && cd nuraskin`
5. **Generate SSH key for GitHub:** `ssh-keygen -t ed25519 -C "vps@nuraskin"`, add pubkey to GitHub Deploy Keys.
6. **Run setup script:** `sudo bash scripts/vps-setup.sh`
7. **Fill Monitoring Env:** `nano /etc/nuraskin-monitoring.env` (add Telegram tokens)
8. **Fill Server Env:** Copy `apps/server/.env.production.example` to `apps/server/.env.production` and fill in secrets.
9. **Create root `.env`:** Copy `.env.example` to `.env` and fill required vars (DB passwords, GHCR details).
10. **Authenticate GHCR:** `echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin`
11. **Check DNS:** Ensure domains point to VPS: `dig nuraskin.uz`, `dig api.nuraskin.uz`, `dig management.nuraskin.uz`.
12. **Start Services:** `docker compose -f docker-compose.prod.yml up -d`
13. **Run Drizzle migrations:** (Wait for containers to spin up) `docker exec nuraskin-server pnpm db:migrate` (if applicable)
14. **Certbot SSL:** `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx`
15. **Verify:** Check all domains via HTTPS to ensure everything is running perfectly.
