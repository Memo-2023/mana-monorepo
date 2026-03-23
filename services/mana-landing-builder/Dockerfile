# syntax=docker/dockerfile:1
# ================================
# Build Stage (Monorepo-aware)
# ================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN apk add --no-cache git
WORKDIR /app

# Install all dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY services/mana-landing-builder/package.json ./services/mana-landing-builder/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-landing-ui/package.json ./packages/shared-landing-ui/
COPY services/mana-landing-builder/template/package.json ./services/mana-landing-builder/template/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --filter @mana-landing-builder/service...

# Build the NestJS application
FROM base AS builder
COPY --from=deps /app ./
COPY services/mana-landing-builder ./services/mana-landing-builder
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-landing-ui ./packages/shared-landing-ui
WORKDIR /app/services/mana-landing-builder
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

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

# Copy the entire built workspace (needed for pnpm workspace resolution at runtime)
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-landing-builder/dist ./services/mana-landing-builder/dist
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-landing-builder/package.json ./services/mana-landing-builder/package.json
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-landing-builder/node_modules ./services/mana-landing-builder/node_modules
# Template (needed at runtime for astro builds)
COPY --from=builder --chown=nestjs:nodejs /app/services/mana-landing-builder/template ./services/mana-landing-builder/template
# Shared packages (needed by template at astro build time)
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-landing-ui ./packages/shared-landing-ui
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types ./packages/shared-types

# Create builds directory with correct permissions
RUN mkdir -p /app/.builds && chown nestjs:nodejs /app/.builds

USER nestjs

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3030/api/v1/health || exit 1

WORKDIR /app/services/mana-landing-builder
CMD ["node", "dist/main"]
