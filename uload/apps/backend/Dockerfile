# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace packages
COPY packages/uload-database ./packages/uload-database

# Copy backend source
COPY uload/apps/backend ./uload/apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the database package first
WORKDIR /app/packages/uload-database
RUN pnpm build

# Build the backend
WORKDIR /app/uload/apps/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy built artifacts
COPY --from=builder --chown=nestjs:nodejs /app/uload/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/uload/apps/backend/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/uload/apps/backend/node_modules ./node_modules

# Copy database package (needed at runtime)
COPY --from=builder --chown=nestjs:nodejs /app/packages/uload-database/dist ./node_modules/@manacore/uload-database/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/uload-database/package.json ./node_modules/@manacore/uload-database/

USER nestjs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

# Set environment
ENV NODE_ENV=production
ENV PORT=3003

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
