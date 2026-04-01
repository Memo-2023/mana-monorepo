# syntax=docker/dockerfile:1
# Build stage - inherits pre-built shared packages from sveltekit-base
FROM sveltekit-base:local AS builder

# Build arguments for SvelteKit static env vars (baked into the build)
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-auth:3001
ARG PUBLIC_MANA_CORE_AUTH_URL_CLIENT=https://auth.mana.how
ARG PUBLIC_MEMORO_SERVER_URL=http://memoro-server:3015
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PUBLIC_MANA_SYNC_URL=ws://mana-sync:3050

# Set as environment variables for build
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL
ENV PUBLIC_MANA_CORE_AUTH_URL_CLIENT=$PUBLIC_MANA_CORE_AUTH_URL_CLIENT
ENV PUBLIC_MEMORO_SERVER_URL=$PUBLIC_MEMORO_SERVER_URL
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV PUBLIC_MANA_SYNC_URL=$PUBLIC_MANA_SYNC_URL

# Copy web app (memoro has no local packages/)
COPY apps/memoro/apps/web ./apps/memoro/apps/web

# Install app-specific dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

# Build the web app
WORKDIR /app/apps/memoro/apps/web
RUN pnpm exec svelte-kit sync
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/memoro/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/memoro/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/memoro/apps/web/build ./build
COPY --from=builder /app/apps/memoro/apps/web/package.json ./

# Expose port
EXPOSE 5038

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5038
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5038/health || exit 1

# Run the app
CMD ["node", "build"]
