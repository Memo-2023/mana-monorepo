# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_BACKEND_URL=http://chat-backend:3002
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-core-auth:3001

# Set as environment variables for build
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# --- AUTO-GENERATED COPY STATEMENTS (do not edit manually) ---
COPY packages/feedback ./packages/feedback
COPY packages/eslint-config ./packages/eslint-config
COPY packages/help ./packages/help
COPY packages/local-store ./packages/local-store
COPY packages/shared-api-client ./packages/shared-api-client
COPY packages/shared-app-onboarding ./packages/shared-app-onboarding
COPY packages/shared-auth ./packages/shared-auth
COPY packages/shared-auth-stores ./packages/shared-auth-stores
COPY packages/shared-auth-ui ./packages/shared-auth-ui
COPY packages/shared-branding ./packages/shared-branding
COPY packages/shared-error-tracking ./packages/shared-error-tracking
COPY packages/shared-i18n ./packages/shared-i18n
COPY packages/shared-icons ./packages/shared-icons
COPY packages/shared-profile-ui ./packages/shared-profile-ui
COPY packages/shared-pwa ./packages/shared-pwa
COPY packages/shared-stores ./packages/shared-stores
COPY packages/shared-tags ./packages/shared-tags
COPY packages/shared-tailwind ./packages/shared-tailwind
COPY packages/shared-theme ./packages/shared-theme
COPY packages/shared-theme-ui ./packages/shared-theme-ui
COPY packages/shared-ui ./packages/shared-ui
COPY packages/shared-utils ./packages/shared-utils
COPY packages/shared-vite-config ./packages/shared-vite-config
COPY packages/subscriptions ./packages/subscriptions
COPY apps/chat/packages/chat-types ./apps/chat/packages/chat-types
# --- END AUTO-GENERATED ---

COPY apps/chat/apps/web ./apps/chat/apps/web

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --no-frozen-lockfile

# Build shared packages that need building
WORKDIR /app/packages/shared-vite-config
RUN pnpm build

WORKDIR /app/packages/shared-auth
RUN pnpm build || true

WORKDIR /app/packages/shared-error-tracking
RUN pnpm build

WORKDIR /app/packages/shared-pwa
RUN pnpm build

# Build the web app
WORKDIR /app/apps/chat/apps/web
RUN pnpm exec svelte-kit sync
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/chat/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/chat/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/chat/apps/web/build ./build
COPY --from=builder /app/apps/chat/apps/web/package.json ./

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run the app
CMD ["node", "build"]
