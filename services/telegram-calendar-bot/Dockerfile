FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY services/telegram-calendar-bot/package.json ./services/telegram-calendar-bot/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @manacore/telegram-calendar-bot

# Copy source
COPY services/telegram-calendar-bot ./services/telegram-calendar-bot

# Build
WORKDIR /app/services/telegram-calendar-bot
RUN pnpm build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built application
COPY --from=builder /app/services/telegram-calendar-bot/dist ./dist
COPY --from=builder /app/services/telegram-calendar-bot/package.json ./
COPY --from=builder /app/services/telegram-calendar-bot/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3303

EXPOSE 3303

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3303/health || exit 1

CMD ["node", "dist/main.js"]
