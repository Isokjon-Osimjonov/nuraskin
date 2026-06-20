FROM node:20.20.2-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Copy all project package.json files to allow pnpm to create the workspace layout
COPY apps/server/package.json ./apps/server/
COPY apps/admin/package.json ./apps/admin/
COPY apps/frontend/package.json ./apps/frontend/
COPY libs/ui/package.json ./libs/ui/
COPY libs/database/package.json ./libs/database/
COPY libs/shared-types/package.json ./libs/shared-types/


RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the admin app
RUN NX_DAEMON=false pnpm exec nx run admin:build

FROM nginx:1.27-alpine AS production
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY apps/admin/nginx.container.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/admin /usr/share/nginx/html
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ > /dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
