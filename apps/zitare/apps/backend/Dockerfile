# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches

# Copy shared packages (required dependencies)
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config
COPY packages/shared-errors ./packages/shared-errors
COPY packages/shared-nestjs-auth ./packages/shared-nestjs-auth
COPY packages/shared-nestjs-health ./packages/shared-nestjs-health
COPY packages/shared-nestjs-metrics ./packages/shared-nestjs-metrics
COPY packages/shared-nestjs-setup ./packages/shared-nestjs-setup
COPY packages/shared-tsconfig ./packages/shared-tsconfig
COPY packages/shared-error-tracking ./packages/shared-error-tracking
COPY packages/shared-nestjs-setup ./packages/shared-nestjs-setup

# Copy zitare content package
COPY apps/zitare/packages/content ./apps/zitare/packages/content

# Copy zitare backend
COPY apps/zitare/apps/backend ./apps/zitare/apps/backend

# Install dependencies (ignore scripts since generate-env.mjs isn't in Docker context)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Build shared packages first (in dependency order)
WORKDIR /app/packages/shared-errors
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-auth
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-health
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-metrics
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-setup
RUN pnpm build

# Build zitare content package
WORKDIR /app/apps/zitare/packages/content
RUN pnpm build

# Build the backend

WORKDIR /app/packages/shared-nestjs-setup
RUN pnpm build

WORKDIR /app/packages/shared-error-tracking
RUN pnpm build

WORKDIR /app/apps/zitare/apps/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and postgresql-client for health checks
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && apk add --no-cache postgresql-client

WORKDIR /app

# Copy everything from builder (including node_modules)
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/zitare ./apps/zitare

# Copy entrypoint script
COPY apps/zitare/apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/zitare/apps/backend

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3007/health || exit 1

# Run entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
