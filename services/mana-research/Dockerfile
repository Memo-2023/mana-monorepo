# Install stage: use node + pnpm to resolve workspace dependencies
FROM node:22-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-research/package.json ./services/mana-research/
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-logger ./packages/shared-logger
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-research ./packages/shared-research

RUN pnpm install --filter @mana/research-service... --no-frozen-lockfile --ignore-scripts

# Runtime stage: bun
FROM oven/bun:1 AS production

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/mana-research/node_modules ./services/mana-research/node_modules
COPY --from=installer /app/packages ./packages

COPY services/mana-research/package.json ./services/mana-research/
COPY services/mana-research/src ./services/mana-research/src
COPY services/mana-research/tsconfig.json services/mana-research/drizzle.config.ts ./services/mana-research/

WORKDIR /app/services/mana-research

EXPOSE 3068

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3068/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
