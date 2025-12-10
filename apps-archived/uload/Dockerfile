# =============================================================================
# uload Web Application Dockerfile
# Multi-stage build for production deployment
#
# IMPORTANT: This Dockerfile must be built from the MONOREPO ROOT, not from uload/
#   docker build -f uload/Dockerfile -t uload-web .
#
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy the uload web app
COPY uload/apps/web/ ./uload/apps/web/

# Copy required shared packages
COPY packages/shared-auth-ui/ ./packages/shared-auth-ui/
COPY packages/shared-branding/ ./packages/shared-branding/

# Install dependencies with flat structure for Docker compatibility
RUN pnpm install --filter @uload/web... --shamefully-hoist

# Build the app
WORKDIR /app/uload/apps/web

# Note: RESEND_API_KEY is needed at build time for SvelteKit prerendering
ENV RESEND_API_KEY=build_placeholder
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2: Production Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

WORKDIR /app

# Copy built app from the correct path
COPY --from=builder --chown=sveltekit:nodejs /app/uload/apps/web/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/uload/apps/web/package.json ./

# Copy hoisted node_modules from root (contains all deps with flat structure)
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER sveltekit

EXPOSE 3000

# Start Node server
CMD ["node", "build"]
