# syntax=docker/dockerfile:1
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package.json
COPY apps/manadeck/apps/backend/package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY apps/manadeck/apps/backend/ ./

# Build the application
RUN npm run build

# Debug: List the contents to verify build output
RUN echo "=== Listing dist contents ===" && \
    ls -la dist/ || echo "No dist folder found" && \
    echo "=== Build complete ==="

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy the dist folder
COPY --from=builder /app/dist ./dist

# Copy package.json for metadata
COPY --from=builder /app/package.json ./

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Debug in production to verify file structure
RUN echo "=== Production stage file check ===" && \
    ls -la /app/ && \
    echo "=== Checking dist folder ===" && \
    ls -la /app/dist/ || echo "No dist folder" && \
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

# Start the application
CMD ["node", "dist/main"]
