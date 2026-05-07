FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN NX_DAEMON=false pnpm exec nx run server:build:production

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder --chown=appuser:appgroup /app/dist/apps/server ./dist
COPY --chown=appuser:appgroup apps/server/package.json ./
RUN npm install --omit=dev --ignore-scripts --legacy-peer-deps && npm cache clean --force
USER appuser
EXPOSE 4000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1
CMD ["node", "dist/main.js"]
