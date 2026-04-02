# syntax=docker/dockerfile:1
# Build stage - inherits pre-built shared packages from sveltekit-base
FROM sveltekit-base:local AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-core-auth:3001

# Set as environment variables for build
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL

# Copy app-specific packages
COPY apps/inventar/packages/shared ./apps/inventar/packages/shared
COPY apps/inventar/apps/web ./apps/inventar/apps/web

# Install app-specific dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

# Build the web app
WORKDIR /app/apps/inventar/apps/web
RUN pnpm exec svelte-kit sync
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/inventar/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/inventar/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/inventar/apps/web/build ./build
COPY --from=builder /app/apps/inventar/apps/web/package.json ./

# Expose port
EXPOSE 5190

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5190
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5190/health || exit 1

# Run the app
CMD ["node", "build"]
