# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/matrix-bot-common/package.json packages/matrix-bot-common/
COPY packages/bot-services/package.json packages/bot-services/
COPY services/matrix-stt-bot/package.json services/matrix-stt-bot/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/matrix-bot-common packages/matrix-bot-common
COPY packages/bot-services packages/bot-services
COPY services/matrix-stt-bot services/matrix-stt-bot

# Build shared packages
RUN pnpm --filter @manacore/matrix-bot-common build
RUN pnpm --filter @manacore/bot-services build

# Build the bot
RUN pnpm --filter @manacore/matrix-stt-bot build

# Production stage
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/matrix-bot-common/dist ./packages/matrix-bot-common/dist
COPY --from=builder /app/packages/matrix-bot-common/package.json ./packages/matrix-bot-common/
COPY --from=builder /app/packages/bot-services/dist ./packages/bot-services/dist
COPY --from=builder /app/packages/bot-services/package.json ./packages/bot-services/
COPY --from=builder /app/services/matrix-stt-bot/dist ./dist
COPY --from=builder /app/services/matrix-stt-bot/package.json ./
COPY --from=builder /app/services/matrix-stt-bot/node_modules ./node_modules

# Create data directory
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV PORT=3024

EXPOSE 3024

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3024/health || exit 1

CMD ["node", "dist/main.js"]
