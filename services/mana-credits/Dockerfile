FROM oven/bun:1 AS production

WORKDIR /app

# Copy workspace package files for dependency resolution
COPY package.json bun.lock* ./
COPY services/mana-credits/package.json ./services/mana-credits/
COPY packages/shared-hono/package.json ./packages/shared-hono/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies (workspace-aware install from root)
WORKDIR /app/services/mana-credits
RUN bun install

# Copy source (workspace deps + service)
WORKDIR /app
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-types ./packages/shared-types
COPY services/mana-credits/src ./services/mana-credits/src
COPY services/mana-credits/tsconfig.json services/mana-credits/drizzle.config.ts ./services/mana-credits/

WORKDIR /app/services/mana-credits

EXPOSE 3061

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3061/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
