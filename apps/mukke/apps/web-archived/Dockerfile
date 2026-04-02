# syntax=docker/dockerfile:1
FROM sveltekit-base:local AS builder

ARG PUBLIC_BACKEND_URL=http://mukke-server
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-auth:3001
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL

COPY apps/mukke/packages/shared ./apps/mukke/packages/shared
COPY apps/mukke/apps/web ./apps/mukke/apps/web

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

WORKDIR /app/apps/mukke/apps/web
RUN pnpm exec svelte-kit sync
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

FROM node:20-alpine AS production
WORKDIR /app/apps/mukke/apps/web
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder /app/apps/mukke/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/mukke/apps/web/build ./build
COPY --from=builder /app/apps/mukke/apps/web/package.json ./

EXPOSE 5016
ENV NODE_ENV=production PORT=5016 HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5016/health || exit 1

CMD ["node", "build"]
