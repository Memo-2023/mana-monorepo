# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/better-auth-types ./packages/better-auth-types
COPY packages/shared-errors ./packages/shared-errors
COPY packages/shared-nestjs-auth ./packages/shared-nestjs-auth
COPY packages/shared-nestjs-cors ./packages/shared-nestjs-cors

# Copy clock packages and backend
COPY apps/clock/packages ./apps/clock/packages
COPY apps/clock/apps/backend ./apps/clock/apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
WORKDIR /app/packages/better-auth-types
RUN pnpm build

WORKDIR /app/packages/shared-errors
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-auth
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-cors
RUN pnpm build

# Build the backend
WORKDIR /app/apps/clock/apps/backend
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
COPY --from=builder /app/apps/clock ./apps/clock

# Copy entrypoint script
COPY apps/clock/apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/clock/apps/backend

# Expose port
EXPOSE 3017

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3017/api/v1/health || exit 1

# Run entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
