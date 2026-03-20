# syntax=docker/dockerfile:1
# Build stage
# Using node:20-slim instead of alpine for DuckDB glibc compatibility
FROM node:20-slim AS builder

# Install pnpm (no build tools needed — bcryptjs is pure JS, DuckDB ships prebuilt binaries)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY patches/ ./patches/

# Copy shared packages (required dependencies)
COPY packages/shared-storage ./packages/shared-storage

# Copy mana-core-auth
COPY services/mana-core-auth ./services/mana-core-auth

# Install all dependencies (without ignore-scripts to build native modules like bcrypt)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --no-frozen-lockfile --filter mana-core-auth... --filter @manacore/shared-storage

# Build shared-storage first
WORKDIR /app/packages/shared-storage
RUN pnpm build || true

# Build the application
WORKDIR /app/services/mana-core-auth
RUN pnpm build

# Remove devDependencies but keep native modules intact
WORKDIR /app
RUN pnpm prune --prod --no-optional 2>/dev/null || true \
    && find node_modules -name '*.ts' -not -name '*.d.ts' -delete 2>/dev/null || true \
    && find node_modules -name '*.map' -delete 2>/dev/null || true \
    && find node_modules -type d -name 'test' -prune -exec rm -rf {} + 2>/dev/null || true \
    && find node_modules -type d -name 'tests' -prune -exec rm -rf {} + 2>/dev/null || true \
    && find node_modules -type d -name '__tests__' -prune -exec rm -rf {} + 2>/dev/null || true \
    && find node_modules -type d -name 'docs' -prune -exec rm -rf {} + 2>/dev/null || true

# Production stage
# Using node:20-slim instead of alpine for DuckDB glibc compatibility
FROM node:20-slim AS production

# Install wget for health checks
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Create non-root user before copying files
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nestjs

WORKDIR /app

# Copy files with correct ownership (avoids expensive chown -R layer)
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-core-auth ./services/mana-core-auth

# Copy entrypoint script
COPY --chown=nestjs:nodejs services/mana-core-auth/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/services/mana-core-auth

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
