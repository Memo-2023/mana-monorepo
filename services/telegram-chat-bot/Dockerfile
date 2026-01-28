FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml* ./
COPY services/telegram-chat-bot/package.json ./services/telegram-chat-bot/

RUN pnpm install --frozen-lockfile --filter @manacore/telegram-chat-bot

COPY services/telegram-chat-bot ./services/telegram-chat-bot

WORKDIR /app/services/telegram-chat-bot
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY --from=builder /app/services/telegram-chat-bot/dist ./dist
COPY --from=builder /app/services/telegram-chat-bot/package.json ./
COPY --from=builder /app/services/telegram-chat-bot/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3305

EXPOSE 3305

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3305/health || exit 1

CMD ["node", "dist/src/main.js"]
