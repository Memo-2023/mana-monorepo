# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_BACKEND_URL=http://picture-backend:3040
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-core-auth:3001
ARG PUBLIC_GOOGLE_CLIENT_ID=
ARG PUBLIC_APPLE_CLIENT_ID=

# Set as environment variables for build
ENV PUBLIC_BACKEND_URL=$PUBLIC_BACKEND_URL
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL
ENV PUBLIC_GOOGLE_CLIENT_ID=$PUBLIC_GOOGLE_CLIENT_ID
ENV PUBLIC_APPLE_CLIENT_ID=$PUBLIC_APPLE_CLIENT_ID

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches

# Copy shared packages needed by picture web
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-auth ./packages/shared-auth
COPY packages/shared-auth-ui ./packages/shared-auth-ui
COPY packages/shared-branding ./packages/shared-branding
COPY packages/shared-feedback-service ./packages/shared-feedback-service
COPY packages/shared-feedback-types ./packages/shared-feedback-types
COPY packages/shared-feedback-ui ./packages/shared-feedback-ui
COPY packages/shared-i18n ./packages/shared-i18n
COPY packages/shared-icons ./packages/shared-icons
COPY packages/shared-tailwind ./packages/shared-tailwind
COPY packages/shared-theme ./packages/shared-theme
COPY packages/shared-theme-ui ./packages/shared-theme-ui
COPY packages/shared-subscription-types ./packages/shared-subscription-types
COPY packages/shared-subscription-ui ./packages/shared-subscription-ui
COPY packages/shared-profile-ui ./packages/shared-profile-ui
COPY packages/shared-ui ./packages/shared-ui
COPY packages/shared-utils ./packages/shared-utils
COPY packages/shared-error-tracking ./packages/shared-error-tracking
COPY packages/shared-vite-config ./packages/shared-vite-config
COPY packages/shared-api-client ./packages/shared-api-client
COPY packages/shared-stores ./packages/shared-stores
COPY packages/shared-pwa ./packages/shared-pwa
COPY packages/shared-app-onboarding ./packages/shared-app-onboarding

# Copy picture packages
COPY apps/picture/packages/shared ./apps/picture/packages/shared
COPY apps/picture/packages/design-tokens ./apps/picture/packages/design-tokens

# Copy picture web
COPY apps/picture/apps/web ./apps/picture/apps/web

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Build shared packages that need building
WORKDIR /app/packages/shared-vite-config
RUN pnpm build

WORKDIR /app/packages/shared-auth
RUN pnpm build || true

WORKDIR /app/packages/shared-error-tracking
RUN pnpm build

# Build the web app
WORKDIR /app/apps/picture/apps/web
RUN pnpm exec svelte-kit sync
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/picture/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/picture/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/picture/apps/web/build ./build
COPY --from=builder /app/apps/picture/apps/web/package.json ./

# Expose port
EXPOSE 5021

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5021
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5021/health || exit 1

# Run the app
CMD ["node", "build"]
