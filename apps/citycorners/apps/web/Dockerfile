# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-auth:3001
ARG PUBLIC_CITYCORNERS_API_URL=http://citycorners-backend:3025

# Set as environment variables for build
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL
ENV PUBLIC_CITYCORNERS_API_URL=$PUBLIC_CITYCORNERS_API_URL

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# --- AUTO-GENERATED COPY STATEMENTS (do not edit manually) ---
COPY patches/ ./patches/
COPY packages/feedback ./packages/feedback
COPY packages/help ./packages/help
COPY packages/local-store ./packages/local-store
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
# --- END AUTO-GENERATED ---

# Copy citycorners web
COPY apps/citycorners/apps/web ./apps/citycorners/apps/web

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

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
WORKDIR /app/apps/citycorners/apps/web
RUN pnpm exec svelte-kit sync
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app/apps/citycorners/apps/web

# Copy the pnpm store that symlinks point to
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules
COPY --from=builder /app/apps/citycorners/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/citycorners/apps/web/build ./build
COPY --from=builder /app/apps/citycorners/apps/web/package.json ./

# Copy entrypoint script
COPY apps/citycorners/apps/web/docker-entrypoint.sh /docker-entrypoint.sh
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
