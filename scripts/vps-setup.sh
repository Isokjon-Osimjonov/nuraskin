#!/bin/bash
set -e

# ==============================================================================
# NuraSkin VPS Setup Script (Ubuntu 24.04)
# Run as root or with sudo
# ==============================================================================

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo."
  exit 1
fi

echo "--- 1. Configuring Docker Daemon ---"
mkdir -p /etc/docker
cat <<EOF > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "iptables": true,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  },
  "features": {
    "buildkit": true
  }
}
EOF
systemctl restart docker || echo "Docker restart failed. Is docker installed?"
systemctl enable docker || true
systemctl enable containerd || true

echo "--- 2. Configuring Nginx Upstreams ---"
cat <<EOF > /etc/nginx/conf.d/nuraskin-upstreams.conf
limit_req_zone \$binary_remote_addr zone=nuraskin_general:10m rate=30r/s;
limit_req_zone \$binary_remote_addr zone=nuraskin_api:10m rate=20r/s;
limit_req_zone \$binary_remote_addr zone=nuraskin_login:10m rate=5r/s;
limit_conn_zone \$binary_remote_addr zone=nuraskin_conn:10m;

upstream nuraskin_frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream nuraskin_admin {
    server 127.0.0.1:3001;
    keepalive 32;
}

upstream nuraskin_api {
    server 127.0.0.1:4000;
    keepalive 32;
}
EOF

echo "--- 3. Creating Nginx Snippets ---"
mkdir -p /etc/nginx/snippets

cat <<EOF > /etc/nginx/snippets/nuraskin-proxy-params.conf
proxy_http_version 1.1;
proxy_set_header Host \$host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
proxy_set_header Connection "";
proxy_read_timeout 60s;
proxy_connect_timeout 10s;
proxy_send_timeout 60s;
client_max_body_size 10M;
EOF

cat <<EOF > /etc/nginx/snippets/nuraskin-security-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

cat <<EOF > /etc/nginx/snippets/nuraskin-acme-challenge.conf
location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type text/plain;
    allow all;
}
EOF

cat <<EOF > /etc/nginx/snippets/nuraskin-error-pages.conf
error_page 500 502 503 504 /50x.html;
location = /50x.html {
    root /var/www/nuraskin/errors;
    internal;
}
EOF

echo "--- 4. Creating Nginx Site Config ---"
cat <<EOF > /etc/nginx/sites-available/nuraskin.conf
# ----------------------------------------------------
# Storefront
# ----------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name nuraskin.uz www.nuraskin.uz;

    access_log /var/log/nginx/nuraskin.storefront.access.log;
    error_log /var/log/nginx/nuraskin.storefront.error.log warn;

    include snippets/nuraskin-security-headers.conf;
    include snippets/nuraskin-acme-challenge.conf;
    include snippets/nuraskin-error-pages.conf;

    limit_req zone=nuraskin_general burst=60 nodelay;
    limit_conn nuraskin_conn 50;

    location / {
        include snippets/nuraskin-proxy-params.conf;
        proxy_pass http://nuraskin_frontend;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}

# ----------------------------------------------------
# Admin
# ----------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name management.nuraskin.uz;

    access_log /var/log/nginx/nuraskin.admin.access.log;
    error_log /var/log/nginx/nuraskin.admin.error.log warn;

    include snippets/nuraskin-security-headers.conf;
    include snippets/nuraskin-acme-challenge.conf;
    include snippets/nuraskin-error-pages.conf;

    limit_req zone=nuraskin_general burst=30 nodelay;
    limit_conn nuraskin_conn 20;

    location / {
        include snippets/nuraskin-proxy-params.conf;
        proxy_pass http://nuraskin_admin;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}

# ----------------------------------------------------
# API
# ----------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name api.nuraskin.uz;

    access_log /var/log/nginx/nuraskin.api.access.log;
    error_log /var/log/nginx/nuraskin.api.error.log warn;

    include snippets/nuraskin-security-headers.conf;
    include snippets/nuraskin-acme-challenge.conf;
    include snippets/nuraskin-error-pages.conf;

    limit_req zone=nuraskin_api burst=40 nodelay;
    limit_conn nuraskin_conn 30;

    # Apply stricter limits for auth endpoints
    location ~* /(auth|login|register|password|reset) {
        limit_req zone=nuraskin_login burst=10 nodelay;
        include snippets/nuraskin-proxy-params.conf;
        proxy_pass http://nuraskin_api;
    }

    location / {
        include snippets/nuraskin-proxy-params.conf;
        proxy_pass http://nuraskin_api;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
EOF

echo "--- 5. Enabling Nginx Site ---"
ln -sf /etc/nginx/sites-available/nuraskin.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "--- 6. Creating Required Directories ---"
mkdir -p /var/www/nuraskin/errors
mkdir -p /var/www/certbot
mkdir -p /var/log/nuraskin
chown -R www-data:www-data /var/www/nuraskin /var/www/certbot

echo "--- 7. Creating Error Page ---"
cat <<EOF > /var/www/nuraskin/errors/50x.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tizimda xatolik - NuraSkin</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8f7f5; color: #4A1525; text-align: center; padding: 50px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        h1 { font-weight: 300; margin-bottom: 20px; font-size: 24px; }
        p { color: #666; line-height: 1.6; font-size: 15px; }
        .brand { font-size: 28px; font-weight: bold; margin-bottom: 30px; letter-spacing: -0.5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="brand">NuraSkin</div>
        <h1>Tizimda vaqtinchalik uzilish</h1>
        <p>Uzr so'raymiz, hozirda tizimda profilaktika ishlari olib borilmoqda yoki vaqtinchalik nosozlik yuz berdi.</p>
        <p>Iltimos, birozdan so'ng qayta urinib ko'ring.</p>
    </div>
</body>
</html>
EOF

echo "--- 8. Applying Nginx Performance Fixes ---"
if grep -q "worker_rlimit_nofile" /etc/nginx/nginx.conf; then
    sed -i 's/worker_rlimit_nofile.*/worker_rlimit_nofile 65535;/' /etc/nginx/nginx.conf
else
    sed -i '/events {/i worker_rlimit_nofile 65535;' /etc/nginx/nginx.conf
fi

sed -i '/events {/,/}/c\events {\n\tworker_connections 4096;\n\tuse epoll;\n\tmulti_accept on;\n}' /etc/nginx/nginx.conf

echo "--- 9. Testing & Reloading Nginx ---"
if nginx -t; then
    systemctl reload nginx
else
    echo "ERROR: Nginx config test failed!"
    exit 1
fi

echo "--- 10. Creating Monitoring Env File ---"
cat <<EOF > /etc/nuraskin-monitoring.env
ADMIN_BOT_TOKEN="REPLACE_WITH_TOKEN"
TELEGRAM_ADMIN_CHAT_ID="REPLACE_WITH_CHAT_ID"
EOF
chmod 600 /etc/nuraskin-monitoring.env

echo "--- 11. Setting up Cron Jobs ---"
CRON_JOB="0 * * * * . /etc/nuraskin-monitoring.env && /root/nuraskin/scripts/check-disk.sh
*/30 * * * * . /etc/nuraskin-monitoring.env && /root/nuraskin/scripts/check-memory.sh
0 3 * * 0 . /etc/nuraskin-monitoring.env && /root/nuraskin/scripts/docker-cleanup.sh
0 2 * * * . /etc/nuraskin-monitoring.env && /root/nuraskin/scripts/db-backup.sh"

# Check if jobs already exist to avoid duplicates
if ! crontab -l 2>/dev/null | grep -q "check-disk.sh"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Cron jobs added successfully."
else
    echo "Cron jobs already exist, skipping."
fi

echo "--- 12. Configuring UFW ---"
ufw allow 'Nginx Full' || echo "UFW not found or inactive, skipping."

echo "====================================================="
echo "NuraSkin VPS Setup Complete!"
echo "1. Don't forget to fill in /etc/nuraskin-monitoring.env"
echo "2. Run Certbot for SSL after DNS propagates"
echo "====================================================="
