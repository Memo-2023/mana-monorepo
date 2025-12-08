# Build stage
FROM node:20-alpine AS builder

# Build arguments for SvelteKit static env vars
ARG PUBLIC_MANA_CORE_AUTH_URL=http://mana-core-auth:3001
ARG MIDDLEWARE_URL=http://mana-core-middleware:3000

# Set as environment variables for build
ENV PUBLIC_MANA_CORE_AUTH_URL=$PUBLIC_MANA_CORE_AUTH_URL
ENV MIDDLEWARE_URL=$MIDDLEWARE_URL

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages needed by manacore web
COPY packages/shared-auth ./packages/shared-auth
COPY packages/shared-auth-ui ./packages/shared-auth-ui
COPY packages/shared-branding ./packages/shared-branding
COPY packages/shared-config ./packages/shared-config
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
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-ui ./packages/shared-ui
COPY packages/shared-utils ./packages/shared-utils

# Copy manacore web
COPY apps/manacore/apps/web ./apps/manacore/apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages that need building
WORKDIR /app/packages/shared-auth
RUN pnpm build || true

# Build the web app
WORKDIR /app/apps/manacore/apps/web
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/manacore/apps/web/build ./build
COPY --from=builder /app/apps/manacore/apps/web/package.json ./

# Install only production dependencies for the built app
RUN npm install --omit=dev 2>/dev/null || true

# Expose port
EXPOSE 5173

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/health || exit 1

# Run the app
CMD ["node", "build"]
