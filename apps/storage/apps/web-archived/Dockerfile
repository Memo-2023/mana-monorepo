# syntax=docker/dockerfile:1
FROM sveltekit-base:local AS builder

ARG PUBLIC_BACKEND_URL=http://storage-server
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-auth:3001
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL

COPY apps/storage/packages/shared ./apps/storage/packages/shared
COPY apps/storage/apps/web ./apps/storage/apps/web

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

WORKDIR /app/apps/storage/apps/web
RUN pnpm exec svelte-kit sync
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

FROM node:20-alpine AS production
WORKDIR /app/apps/storage/apps/web
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder /app/apps/storage/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/storage/apps/web/build ./build
COPY --from=builder /app/apps/storage/apps/web/package.json ./

EXPOSE 5023
ENV NODE_ENV=production PORT=5023 HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5023/health || exit 1

CMD ["node", "build"]
