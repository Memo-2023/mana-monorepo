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
RUN pnpm install --frozen-lockfile --filter @manacore/mana-search...

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/mana-search/node_modules ./services/mana-search/node_modules
COPY services/mana-search ./services/mana-search
WORKDIR /app/services/mana-search
RUN pnpm build

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-search/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-search/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-search/package.json ./

# Expose port
EXPOSE 3021

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3021/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "dist/main"]
