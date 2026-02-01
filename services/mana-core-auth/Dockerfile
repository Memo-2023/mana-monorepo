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

# Install production dependencies only (no tsx needed - migrations run externally)
RUN pnpm install --prod

# Copy built application only (no source code)
COPY --from=builder /app/dist ./dist
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

# Health check - uses /health/ready to verify database connectivity
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/ready', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["./docker-entrypoint.sh"]
