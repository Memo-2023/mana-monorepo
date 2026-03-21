# syntax=docker/dockerfile:1
# Build stage — inherits pre-built shared packages from nestjs-base
FROM nestjs-base:local AS builder

# Copy mukke-specific packages and backend
COPY apps/mukke/packages ./apps/mukke/packages
COPY apps/mukke/apps/backend ./apps/mukke/apps/backend

# Reinstall to link app-specific dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Build the backend
WORKDIR /app/apps/mukke/apps/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install postgresql-client for health checks
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy everything from builder
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/mukke ./apps/mukke

# Copy entrypoint script
COPY apps/mukke/apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/mukke/apps/backend

# Expose port
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3010/health || exit 1

# Run entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
