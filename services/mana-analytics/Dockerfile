# Install stage: use node + pnpm to resolve workspace dependencies.
# Build context must be the monorepo root (see docker-compose.macmini.yml).
FROM node:22-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-analytics/package.json ./services/mana-analytics/
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-logger ./packages/shared-logger

# Install only mana-analytics and its workspace deps
RUN pnpm install --filter @mana/analytics... --no-frozen-lockfile --ignore-scripts

# Runtime stage: bun
FROM oven/bun:1 AS production

WORKDIR /app

# Copy installed deps from installer stage
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/mana-analytics/node_modules ./services/mana-analytics/node_modules
COPY --from=installer /app/packages ./packages

# Copy source
COPY services/mana-analytics/package.json ./services/mana-analytics/
COPY services/mana-analytics/src ./services/mana-analytics/src
COPY services/mana-analytics/tsconfig.json services/mana-analytics/drizzle.config.ts ./services/mana-analytics/

WORKDIR /app/services/mana-analytics

EXPOSE 3064

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://localhost:3064/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
