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
COPY services/mana-api-gateway/package.json ./services/mana-api-gateway/
COPY packages/shared-nestjs-auth/package.json ./packages/shared-nestjs-auth/
COPY packages/shared-drizzle-config/package.json ./packages/shared-drizzle-config/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --filter @manacore/api-gateway...

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/mana-api-gateway/node_modules ./services/mana-api-gateway/node_modules
COPY --from=deps /app/packages/shared-nestjs-auth/node_modules ./packages/shared-nestjs-auth/node_modules 2>/dev/null || true
COPY packages/shared-nestjs-auth ./packages/shared-nestjs-auth
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config
COPY services/mana-api-gateway ./services/mana-api-gateway
WORKDIR /app/services/mana-api-gateway
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
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-api-gateway/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-api-gateway/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-api-gateway/package.json ./

EXPOSE 3030

CMD ["node", "dist/main.js"]
