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

# Copy shared packages
COPY packages/shared-tsconfig ./packages/shared-tsconfig
COPY packages/shared-nestjs-auth ./packages/shared-nestjs-auth
COPY packages/shared-nestjs-setup ./packages/shared-nestjs-setup
COPY packages/shared-nestjs-health ./packages/shared-nestjs-health
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config
COPY packages/shared-error-tracking ./packages/shared-error-tracking
COPY packages/shared-nestjs-setup ./packages/shared-nestjs-setup

# Copy nutriphi packages and backend
COPY apps/nutriphi/packages ./apps/nutriphi/packages
COPY apps/nutriphi/apps/backend ./apps/nutriphi/apps/backend

# Install dependencies (ignore scripts since generate-env.mjs isn't in Docker context)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build shared packages first
WORKDIR /app/packages/shared-nestjs-auth
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-setup
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-health
RUN pnpm build

# Build the backend

WORKDIR /app/packages/shared-nestjs-setup
RUN pnpm build

WORKDIR /app/packages/shared-error-tracking
RUN pnpm build

WORKDIR /app/apps/nutriphi/apps/backend
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
COPY --from=builder /app/apps/nutriphi ./apps/nutriphi

# Copy entrypoint script
COPY apps/nutriphi/apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/nutriphi/apps/backend

# Expose port
EXPOSE 3023

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3023/api/v1/health || exit 1

# Run entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
