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

# Build the server
RUN NX_DAEMON=false pnpm exec nx run server:build:production

FROM node:20.20.2-alpine AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled bundle
COPY --from=builder --chown=appuser:appgroup /app/dist/apps/server ./dist

# Copy package.json to install production dependencies (required for external modules)
COPY --from=builder --chown=appuser:appgroup /app/dist/apps/server/package.json ./

# Install only production dependencies
RUN npm install --omit=dev --ignore-scripts --legacy-peer-deps && npm cache clean --force

USER appuser
EXPOSE 4000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
  CMD curl -sf http://localhost:4000/api/health > /dev/null || exit 1

CMD ["node", "dist/main.js"]
