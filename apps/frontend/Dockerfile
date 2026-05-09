FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all project package.json files to allow pnpm to create the workspace layout
COPY apps/server/package.json ./apps/server/
COPY apps/admin/package.json ./apps/admin/
COPY apps/frontend/package.json ./apps/frontend/
COPY libs/ui/package.json ./libs/ui/
COPY libs/database/package.json ./libs/database/
COPY libs/shared-types/package.json ./libs/shared-types/
COPY libs/validation/package.json ./libs/validation/

RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend app
RUN NX_DAEMON=false pnpm exec nx run frontend:build

FROM nginx:1.27-alpine AS production
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY apps/frontend/nginx.container.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
