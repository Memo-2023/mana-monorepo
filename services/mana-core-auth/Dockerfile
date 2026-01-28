# Build stage
# Using node:20-slim instead of alpine for DuckDB glibc compatibility
FROM node:20-slim AS builder

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy package files for mana-core-auth only (standalone build)
COPY services/mana-core-auth/package.json ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install

# Copy source code
COPY services/mana-core-auth/src ./src
COPY services/mana-core-auth/tsconfig*.json ./
COPY services/mana-core-auth/nest-cli.json ./

# Build the application
RUN pnpm build

# Production stage
# Using node:20-slim instead of alpine for DuckDB glibc compatibility
FROM node:20-slim AS production

# Install pnpm
RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy package files
COPY --from=builder /app/package.json ./

# Install production dependencies + tsx for migrations
RUN pnpm install --prod && pnpm add tsx

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db ./src/db
COPY services/mana-core-auth/drizzle.config.ts ./
COPY services/mana-core-auth/docker-entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nestjs

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
