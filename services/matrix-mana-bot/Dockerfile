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
COPY services/matrix-mana-bot ./services/matrix-mana-bot

# Install all dependencies (--ignore-scripts to skip root postinstall hooks)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Rebuild native modules to ensure platform-specific binaries are selected
RUN pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs || true

# Build shared packages first (in dependency order)
RUN pnpm --filter @manacore/bot-services build
RUN pnpm --filter @manacore/matrix-bot-common build

# Build the bot
RUN pnpm --filter matrix-mana-bot build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy built shared packages
COPY --from=builder /app/packages/bot-services/dist ./packages/bot-services/dist
COPY --from=builder /app/packages/bot-services/package.json ./packages/bot-services/
COPY --from=builder /app/packages/matrix-bot-common/dist ./packages/matrix-bot-common/dist
COPY --from=builder /app/packages/matrix-bot-common/package.json ./packages/matrix-bot-common/

# Copy built bot
COPY --from=builder /app/services/matrix-mana-bot/dist ./services/matrix-mana-bot/dist
COPY --from=builder /app/services/matrix-mana-bot/package.json ./services/matrix-mana-bot/

# Install production dependencies only (--ignore-scripts to skip root postinstall hooks)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Rebuild native modules to ensure platform-specific binaries are selected
RUN pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs || true

# Create data directory
RUN mkdir -p /app/data

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

WORKDIR /app/services/matrix-mana-bot

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4010/health || exit 1

EXPOSE 4010

CMD ["node", "dist/main.js"]
