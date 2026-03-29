# syntax=docker/dockerfile:1
FROM sveltekit-base:local AS builder

ARG PUBLIC_ULOAD_SERVER_URL=http://uload-server:3041
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-auth:3001
ENV PUBLIC_ULOAD_SERVER_URL=$PUBLIC_ULOAD_SERVER_URL
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL

COPY apps/uload/packages/uload-database ./apps/uload/packages/uload-database
COPY apps/uload/apps/web ./apps/uload/apps/web

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

WORKDIR /app/apps/uload/apps/web
RUN pnpm exec svelte-kit sync
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

FROM node:20-alpine AS production
WORKDIR /app/apps/uload/apps/web
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder /app/apps/uload/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/uload/apps/web/build ./build
COPY --from=builder /app/apps/uload/apps/web/package.json ./

EXPOSE 5027
ENV NODE_ENV=production PORT=5027 HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5027/health || exit 1

CMD ["node", "build"]
