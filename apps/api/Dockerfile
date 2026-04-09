# syntax=docker/dockerfile:1
#
# apps/api — unified Hono/Bun API server
#
# Multi-stage build that runs from the monorepo root so the workspace
# packages (@mana/shared-hono, @mana/shared-storage, @mana/media-client,
# @mana/shared-logger) resolve via pnpm before being copied into a
# minimal runtime image.
#
# Build context MUST be the monorepo root, not apps/api/. The compose
# service uses `context: .` for this reason.

FROM oven/bun:1 AS builder

WORKDIR /app

# Copy the workspace manifest first so the dependency graph is known
# before we add source. This caches the install layer for incremental
# rebuilds when only source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# Workspace packages that apps/api depends on, plus their transitive
# workspace deps. Listed explicitly so the install layer doesn't pull
# in the entire monorepo.
COPY packages/shared-hono ./packages/shared-hono
COPY packages/shared-logger ./packages/shared-logger
COPY packages/shared-storage ./packages/shared-storage
# @mana/media-client lives under services/mana-media (sub-package).
COPY services/mana-media/packages/client ./services/mana-media/packages/client

# Install pnpm and resolve the dependency graph for apps/api.
RUN npm install -g pnpm@9.15.0
RUN pnpm install --filter @mana/api... --no-frozen-lockfile --ignore-scripts

# Copy the api source and tsconfig last so source-only changes don't
# bust the install cache.
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json


# ─── Runtime stage ─────────────────────────────────────────────
#
# Bun can run TypeScript directly without a compile step, so the
# runtime image just needs the workspace tree the builder produced.
# We copy /app wholesale rather than try to slice node_modules — the
# pnpm symlink farm is fragile and easy to break with selective copies.

FROM oven/bun:1 AS production

WORKDIR /app
COPY --from=builder /app /app

WORKDIR /app/apps/api

EXPOSE 3060

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://localhost:3060/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
