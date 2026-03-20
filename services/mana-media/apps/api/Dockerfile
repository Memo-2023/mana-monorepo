# syntax=docker/dockerfile:1
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

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

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

# Keep same directory structure so pnpm symlinks work
WORKDIR /app/services/mana-media/apps/api

# Copy the pnpm store that symlinks point to
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to pnpm store)
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/node_modules ./node_modules

# Copy shared packages that are symlinked
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-drizzle-config /app/packages/shared-drizzle-config

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-media/apps/api/package.json ./

USER nestjs

# Expose port
EXPOSE 3015

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3015/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/src/main"]
