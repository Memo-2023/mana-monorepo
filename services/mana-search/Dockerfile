# syntax=docker/dockerfile:1
# ================================
# Build Stage (Monorepo-aware)
# ================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-search/package.json ./services/mana-search/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --filter @manacore/mana-search...

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/mana-search/node_modules ./services/mana-search/node_modules
COPY services/mana-search ./services/mana-search
WORKDIR /app/services/mana-search
RUN pnpm build

# Deploy standalone version (resolves pnpm symlinks)
RUN pnpm deploy --filter @manacore/mana-search --prod /app/deploy

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

WORKDIR /app

# Copy deployed standalone application (no symlinks)
COPY --from=builder --chown=nestjs:nodejs /app/deploy ./
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-search/dist ./dist

# Expose port (default 3020, configurable via PORT env)
EXPOSE 3020

# Health check uses /api/v1/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3020/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/main"]
