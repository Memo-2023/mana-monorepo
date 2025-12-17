# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/shared-nestjs-cors ./packages/shared-nestjs-cors

# Copy mana-core-auth service
COPY services/mana-core-auth ./services/mana-core-auth

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build shared packages first
WORKDIR /app/packages/shared-nestjs-cors
RUN pnpm build

# Build the application
WORKDIR /app/services/mana-core-auth
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy everything from builder (including node_modules)
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/mana-core-auth ./services/mana-core-auth

WORKDIR /app/services/mana-core-auth

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with entrypoint that runs migrations
ENTRYPOINT ["./docker-entrypoint.sh"]
