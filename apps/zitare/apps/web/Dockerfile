# Build stage
FROM node:20-alpine AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-auth:3001
ARG PUBLIC_ZITARE_API_URL=http://zitare-backend:3007

# Set as environment variables for build
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL
ENV PUBLIC_ZITARE_API_URL=$PUBLIC_ZITARE_API_URL

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages needed by zitare web
COPY packages/shared-api-client ./packages/shared-api-client
COPY packages/shared-auth ./packages/shared-auth
COPY packages/shared-auth-ui ./packages/shared-auth-ui
COPY packages/shared-branding ./packages/shared-branding
COPY packages/shared-config ./packages/shared-config
COPY packages/shared-feedback-service ./packages/shared-feedback-service
COPY packages/shared-feedback-types ./packages/shared-feedback-types
COPY packages/shared-feedback-ui ./packages/shared-feedback-ui
COPY packages/shared-i18n ./packages/shared-i18n
COPY packages/shared-icons ./packages/shared-icons
COPY packages/shared-profile-ui ./packages/shared-profile-ui
COPY packages/shared-stores ./packages/shared-stores
COPY packages/shared-subscription-types ./packages/shared-subscription-types
COPY packages/shared-subscription-ui ./packages/shared-subscription-ui
COPY packages/shared-tailwind ./packages/shared-tailwind
COPY packages/shared-theme ./packages/shared-theme
COPY packages/shared-theme-ui ./packages/shared-theme-ui
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-ui ./packages/shared-ui
COPY packages/shared-utils ./packages/shared-utils
COPY packages/shared-vite-config ./packages/shared-vite-config

# Copy zitare content package
COPY apps/zitare/packages/content ./apps/zitare/packages/content

# Copy zitare web
COPY apps/zitare/apps/web ./apps/zitare/apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages that need building
WORKDIR /app/packages/shared-vite-config
RUN pnpm build

WORKDIR /app/packages/shared-auth
RUN pnpm build || true

# Build zitare content package
WORKDIR /app/apps/zitare/packages/content
RUN pnpm build || true

# Build the web app
WORKDIR /app/apps/zitare/apps/web
RUN pnpm exec svelte-kit sync
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/zitare/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/zitare/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/zitare/apps/web/build ./build
COPY --from=builder /app/apps/zitare/apps/web/package.json ./

# Copy entrypoint script
COPY apps/zitare/apps/web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 5018

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5018
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5018/health || exit 1

# Run the app
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "build"]
