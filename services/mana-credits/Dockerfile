# Install stage: use node + pnpm to resolve workspace dependencies
FROM node:22-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-credits/package.json ./services/mana-credits/
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-logger ./packages/shared-logger
COPY packages/shared-types ./packages/shared-types

# Install only mana-credits-service and its workspace deps.
# Note the suffix — the workspace name is `@mana/credits-service`, not
# `@mana/credits` (which is a different package under packages/credits).
RUN pnpm install --filter @mana/credits-service... --no-frozen-lockfile --ignore-scripts

# Runtime stage: bun
FROM oven/bun:1 AS production

WORKDIR /app

# Copy installed deps from installer stage
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/mana-credits/node_modules ./services/mana-credits/node_modules
COPY --from=installer /app/packages ./packages

# Copy source
COPY services/mana-credits/package.json ./services/mana-credits/
COPY services/mana-credits/src ./services/mana-credits/src
COPY services/mana-credits/tsconfig.json services/mana-credits/drizzle.config.ts ./services/mana-credits/

WORKDIR /app/services/mana-credits

EXPOSE 3061

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3061/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
