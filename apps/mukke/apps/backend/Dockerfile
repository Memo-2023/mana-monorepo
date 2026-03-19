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
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config
COPY packages/shared-errors ./packages/shared-errors
COPY packages/shared-nestjs-auth ./packages/shared-nestjs-auth
COPY packages/shared-nestjs-health ./packages/shared-nestjs-health
COPY packages/shared-nestjs-setup ./packages/shared-nestjs-setup
COPY packages/shared-storage ./packages/shared-storage
COPY packages/shared-tsconfig ./packages/shared-tsconfig

# Copy mukke packages
COPY apps/mukke/packages ./apps/mukke/packages
COPY apps/mukke/apps/backend ./apps/mukke/apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build shared packages
WORKDIR /app/packages/shared-errors
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-auth
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-health
RUN pnpm build

WORKDIR /app/packages/shared-storage
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-setup
RUN pnpm build

# Build the backend
WORKDIR /app/apps/mukke/apps/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and postgresql-client
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && apk add --no-cache postgresql-client

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
