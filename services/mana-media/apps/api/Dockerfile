# ================================
# Build Stage
# ================================
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy all necessary files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config
COPY services/mana-media ./services/mana-media

# Install all dependencies (ignore client build errors)
RUN pnpm install --frozen-lockfile || pnpm install --frozen-lockfile --ignore-scripts

# Build the API
WORKDIR /app/services/mana-media/apps/api
RUN pnpm build

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS runner
RUN apk add --no-cache wget
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
USER nestjs

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-drizzle-config ./packages/shared-drizzle-config

# Expose port
EXPOSE 3015

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3015/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/src/main"]
