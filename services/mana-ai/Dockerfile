# Install stage: use node + pnpm to resolve workspace dependencies
FROM node:22-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-ai/package.json ./services/mana-ai/
COPY packages/shared-hono ./packages/shared-hono

# Install only mana-ai and its workspace deps
RUN pnpm install --filter @mana/ai-service... --no-frozen-lockfile --ignore-scripts

# Runtime stage: bun
FROM oven/bun:1 AS production

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/mana-ai/node_modules ./services/mana-ai/node_modules
COPY --from=installer /app/packages ./packages

COPY services/mana-ai/package.json ./services/mana-ai/
COPY services/mana-ai/src ./services/mana-ai/src
COPY services/mana-ai/tsconfig.json ./services/mana-ai/

WORKDIR /app/services/mana-ai

EXPOSE 3066

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3066/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
