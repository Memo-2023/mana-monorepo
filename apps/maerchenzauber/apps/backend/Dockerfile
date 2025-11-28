# syntax=docker/dockerfile:1
# Build stage
FROM node:25-alpine AS builder

# Set working directory to monorepo root
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy backend package.json
COPY apps/maerchenzauber/apps/backend/package.json ./backend/package.json

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# Copy shared packages source code and build them if they exist
WORKDIR /app
COPY packages ./packages/
RUN if [ -d "packages/shared-types" ]; then \
        cd packages/shared-types && npm install && npm run build || echo "No build script for shared-types"; \
    else \
        echo "No packages/shared-types directory found"; \
    fi

# Copy backend source code
COPY apps/maerchenzauber/apps/backend/ ./backend/

# Build the backend application
WORKDIR /app/backend
RUN npm run build

# Debug: List the contents to verify build output
RUN echo "=== Listing dist contents ===" && \
    ls -la dist/ || echo "No dist folder found" && \
    ls -la dist/src/ || echo "No dist/src folder found" && \
    echo "=== Build complete ==="

# Production stage
FROM node:25-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy the entire dist folder structure
COPY --from=builder /app/backend/dist ./dist

# Copy package.json for metadata
COPY --from=builder /app/backend/package.json ./

# Copy backend node_modules
COPY --from=builder /app/backend/node_modules ./node_modules

# Backend specific node_modules are not needed since we use root node_modules

# Debug in production to verify file structure
RUN echo "=== Production stage file check ===" && \
    ls -la /app/ && \
    echo "=== Checking dist folder ===" && \
    ls -la /app/dist/ || echo "No dist folder" && \
    echo "=== Checking dist/src folder ===" && \
    ls -la /app/dist/src/ || echo "No dist/src folder" && \
    echo "=== Looking for main.js ===" && \
    find /app -name "main.js" -type f 2>/dev/null || echo "main.js not found"

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port (Cloud Run will set PORT env var)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application - use the actual path found during debug
CMD ["node", "dist/src/main.js"]