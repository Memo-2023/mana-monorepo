# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-core-auth:3001
ARG PUBLIC_MANA_LLM_URL=http://mana-llm:3025

# Set as environment variables for build
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL
ENV PUBLIC_MANA_LLM_URL=$PUBLIC_MANA_LLM_URL

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# --- AUTO-GENERATED COPY STATEMENTS (do not edit manually) ---
COPY packages/shared-auth ./packages/shared-auth
COPY packages/eslint-config ./packages/eslint-config
COPY packages/shared-auth-ui ./packages/shared-auth-ui
COPY packages/eslint-config ./packages/eslint-config
COPY packages/shared-branding ./packages/shared-branding
COPY packages/eslint-config ./packages/eslint-config
COPY packages/shared-i18n ./packages/shared-i18n
COPY packages/eslint-config ./packages/eslint-config
COPY packages/shared-icons ./packages/shared-icons
COPY packages/eslint-config ./packages/eslint-config
# --- END AUTO-GENERATED ---

# Copy llm-playground service
COPY apps/playground/apps/web ./apps/playground/apps/web

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --no-frozen-lockfile

# Build shared packages that need building
WORKDIR /app/packages/shared-auth
RUN pnpm build || true

# Build the web app
WORKDIR /app/apps/playground/apps/web
RUN pnpm exec svelte-kit sync
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Keep same directory structure as builder so pnpm symlinks resolve correctly
WORKDIR /app/apps/playground/apps/web

# Copy the pnpm store that symlinks point to (at /app/node_modules/.pnpm)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy the app's node_modules (contains symlinks to the pnpm store)
COPY --from=builder /app/apps/playground/apps/web/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/apps/playground/apps/web/build ./build
COPY --from=builder /app/apps/playground/apps/web/package.json ./

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
