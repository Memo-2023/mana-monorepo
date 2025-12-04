# Build stage
FROM node:25-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/shared-errors ./packages/shared-errors
COPY packages/manadeck-database ./packages/manadeck-database
COPY packages/mana-core-nestjs-integration ./packages/mana-core-nestjs-integration

# Copy manadeck backend
COPY apps/manadeck/apps/backend ./apps/manadeck/apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
WORKDIR /app/packages/shared-errors
RUN pnpm build

WORKDIR /app/packages/manadeck-database
RUN pnpm build

WORKDIR /app/packages/mana-core-nestjs-integration
RUN pnpm build

# Build the backend
WORKDIR /app/apps/manadeck/apps/backend
RUN pnpm build

# Production stage
FROM node:25-alpine AS production

# Install pnpm and dumb-init
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
    && apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy everything from builder (including node_modules)
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/manadeck/apps/backend ./apps/manadeck/apps/backend

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

WORKDIR /app/apps/manadeck/apps/backend

# Expose the port
ARG PORT=3003
EXPOSE ${PORT}

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3003) + '/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
