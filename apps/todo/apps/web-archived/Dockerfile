# syntax=docker/dockerfile:1
# Build stage - inherits pre-built shared packages from sveltekit-base
FROM sveltekit-base:local AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_BACKEND_URL=http://todo-backend:3018
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-core-auth:3001

# Set as environment variables for build
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL

# Copy app-specific packages
COPY apps/todo/packages/shared ./apps/todo/packages/shared
COPY apps/todo/apps/web ./apps/todo/apps/web

# Install app-specific dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts

# Build the web app
WORKDIR /app/apps/todo/apps/web
RUN pnpm exec svelte-kit sync
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/todo/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/todo/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/todo/apps/web/build ./build
COPY --from=builder /app/apps/todo/apps/web/package.json ./

# Expose port
EXPOSE 5188

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5188
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5188/health || exit 1

# Run the app
CMD ["node", "build"]
