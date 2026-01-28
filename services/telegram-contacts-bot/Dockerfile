FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY services/telegram-contacts-bot/package.json ./services/telegram-contacts-bot/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @manacore/telegram-contacts-bot

# Copy source
COPY services/telegram-contacts-bot ./services/telegram-contacts-bot

# Build
WORKDIR /app/services/telegram-contacts-bot
RUN pnpm build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built application
COPY --from=builder /app/services/telegram-contacts-bot/dist ./dist
COPY --from=builder /app/services/telegram-contacts-bot/package.json ./
COPY --from=builder /app/services/telegram-contacts-bot/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3304

EXPOSE 3304

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3304/health || exit 1

CMD ["node", "dist/src/main.js"]
