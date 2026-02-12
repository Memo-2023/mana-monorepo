# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages (all required dependencies)
COPY packages/credit-operations ./packages/credit-operations
COPY packages/mana-core-nestjs-integration ./packages/mana-core-nestjs-integration
COPY packages/manadeck-database ./packages/manadeck-database
COPY packages/shared-errors ./packages/shared-errors
COPY packages/shared-nestjs-auth ./packages/shared-nestjs-auth
COPY packages/shared-tsconfig ./packages/shared-tsconfig

# Copy manadeck backend
COPY apps/manadeck/apps/backend ./apps/manadeck/apps/backend

# Install dependencies (ignore scripts since generate-env.mjs isn't in Docker context)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build shared packages first (in dependency order)
WORKDIR /app/packages/shared-errors
RUN pnpm build

WORKDIR /app/packages/shared-nestjs-auth
RUN pnpm build

WORKDIR /app/packages/manadeck-database
RUN pnpm build

WORKDIR /app/packages/credit-operations
RUN pnpm build

WORKDIR /app/packages/mana-core-nestjs-integration
RUN pnpm build

# Build the backend
WORKDIR /app/apps/manadeck/apps/backend
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

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
ARG PORT=3009
EXPOSE ${PORT}

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3009) + '/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
