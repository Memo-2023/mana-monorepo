# syntax=docker/dockerfile:1
# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared packages that this bot depends on
COPY packages/bot-services ./packages/bot-services
COPY packages/matrix-bot-common ./packages/matrix-bot-common

# Copy this bot
COPY services/matrix-stt-bot ./services/matrix-stt-bot

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Build shared packages first (in dependency order)
RUN pnpm --filter @manacore/bot-services build
RUN pnpm --filter @manacore/matrix-bot-common build

# Build the bot
RUN pnpm --filter @manacore/matrix-stt-bot build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install wget for health checks and enable pnpm
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/* \
    && corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy built shared packages
COPY --from=builder /app/packages/bot-services/dist ./packages/bot-services/dist
COPY --from=builder /app/packages/bot-services/package.json ./packages/bot-services/
COPY --from=builder /app/packages/matrix-bot-common/dist ./packages/matrix-bot-common/dist
COPY --from=builder /app/packages/matrix-bot-common/package.json ./packages/matrix-bot-common/

# Copy built bot
COPY --from=builder /app/services/matrix-stt-bot/dist ./services/matrix-stt-bot/dist
COPY --from=builder /app/services/matrix-stt-bot/package.json ./services/matrix-stt-bot/

# Install production dependencies only
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod --ignore-scripts

# Create data directory
RUN mkdir -p /app/data

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nestjs && \
    chown -R nestjs:nodejs /app/data

USER nestjs

WORKDIR /app/services/matrix-stt-bot

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4021/health || exit 1

EXPOSE 4021

CMD ["node", "dist/main.js"]
