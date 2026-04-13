# Install stage: use node + pnpm to resolve workspace dependencies
FROM node:22-alpine AS installer

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-mail/package.json ./services/mana-mail/
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-logger ./packages/shared-logger
COPY packages/shared-types ./packages/shared-types

# Install only mana-mail and its workspace deps
RUN pnpm install --filter @mana/mail-service... --no-frozen-lockfile --ignore-scripts

# Runtime stage: bun
FROM oven/bun:1 AS production

WORKDIR /app

# Copy installed deps from installer stage
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/mana-mail/node_modules ./services/mana-mail/node_modules
COPY --from=installer /app/packages ./packages

# Copy source
COPY services/mana-mail/package.json ./services/mana-mail/
COPY services/mana-mail/src ./services/mana-mail/src
COPY services/mana-mail/tsconfig.json services/mana-mail/drizzle.config.ts ./services/mana-mail/

WORKDIR /app/services/mana-mail

EXPOSE 3042

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3042/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
