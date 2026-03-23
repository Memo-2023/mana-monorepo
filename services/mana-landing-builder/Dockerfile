# syntax=docker/dockerfile:1
# ================================
# Build Stage (Monorepo-aware)
# ================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
# Astro build needs git for some operations
RUN apk add --no-cache git
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY services/mana-landing-builder/package.json ./services/mana-landing-builder/
COPY packages/shared-types/package.json ./packages/shared-types/
# Template needs shared-landing-ui at build time
COPY packages/shared-landing-ui/package.json ./packages/shared-landing-ui/
COPY services/mana-landing-builder/template/package.json ./services/mana-landing-builder/template/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --filter @mana-landing-builder/service...

# Build the NestJS application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/mana-landing-builder/node_modules ./services/mana-landing-builder/node_modules
COPY services/mana-landing-builder ./services/mana-landing-builder
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-landing-ui ./packages/shared-landing-ui
WORKDIR /app/services/mana-landing-builder
RUN pnpm build

# Deploy standalone version (resolves pnpm symlinks)
RUN pnpm deploy --filter @mana-landing-builder/service --prod /app/deploy

# ================================
# Production Stage
# ================================
FROM node:20-alpine AS runner
ENV NODE_ENV=production

# Need pnpm + git for astro builds at runtime
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apk add --no-cache git

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy deployed standalone application
COPY --from=builder --chown=nestjs:nodejs /app/deploy ./
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-landing-builder/dist ./dist
# Copy template (needed at runtime for builds)
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-landing-builder/template ./template
# Copy shared-landing-ui (needed by template at astro build time)
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-landing-ui ./packages/shared-landing-ui

# Create builds directory with correct permissions
RUN mkdir -p /app/.builds && chown nestjs:nodejs /app/.builds

USER nestjs

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3030/api/v1/health || exit 1

CMD ["node", "dist/main"]
