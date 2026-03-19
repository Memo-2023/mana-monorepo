# Build stage
# Using node:20-slim instead of alpine for DuckDB glibc compatibility
FROM node:20-slim AS builder

# Install pnpm and build tools for native modules (bcrypt)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

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

# Install dependencies (without ignore-scripts to build native modules like bcrypt)
RUN pnpm install --no-frozen-lockfile

# Build shared-storage first
WORKDIR /app/packages/shared-storage
RUN pnpm build || true

# Build the application
WORKDIR /app/services/mana-core-auth
RUN pnpm build

# Production stage
# Using node:20-slim instead of alpine for DuckDB glibc compatibility
FROM node:20-slim AS production

# Install pnpm and wget for health checks
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything from builder (including node_modules)
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/mana-core-auth ./services/mana-core-auth

# Copy entrypoint script
COPY services/mana-core-auth/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/services/mana-core-auth

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nestjs

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check - uses /health/ready to verify database connectivity
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
