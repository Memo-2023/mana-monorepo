# ================================
# Build Stage (Monorepo-aware)
# ================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-drizzle-config/package.json ./packages/shared-drizzle-config/
COPY services/mana-media/apps/api/package.json ./services/mana-media/apps/api/
COPY services/mana-media/packages/client/package.json ./services/mana-media/packages/client/
RUN pnpm install --frozen-lockfile

# Build shared packages
FROM base AS shared-builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config
WORKDIR /app/packages/shared-drizzle-config
RUN pnpm build

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared-drizzle-config ./packages/shared-drizzle-config
COPY services/mana-media ./services/mana-media
WORKDIR /app/services/mana-media/apps/api
RUN pnpm build

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && apk add --no-cache postgresql-client wget
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-drizzle-config ./packages/shared-drizzle-config

# Expose port
EXPOSE 3015

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3015/health || exit 1

# Start the application
CMD ["node", "dist/main"]
