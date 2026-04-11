FROM oven/bun:1 AS production

# Install pnpm (mana-credits is part of a pnpm workspace)
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/* && \
    curl -fsSL https://get.pnpm.io/install.sh | env SHELL=/bin/bash PNPM_HOME=/usr/local/share/pnpm sh - && \
    ln -s /usr/local/share/pnpm/pnpm /usr/local/bin/pnpm

WORKDIR /app

# Copy workspace structure for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/mana-credits/package.json ./services/mana-credits/
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-types ./packages/shared-types

# Install dependencies for mana-credits only (with workspace deps)
RUN pnpm install --filter @mana/credits... --no-frozen-lockfile --ignore-scripts

# Copy source
COPY services/mana-credits/src ./services/mana-credits/src
COPY services/mana-credits/tsconfig.json services/mana-credits/drizzle.config.ts ./services/mana-credits/

WORKDIR /app/services/mana-credits

EXPOSE 3061

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3061/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
