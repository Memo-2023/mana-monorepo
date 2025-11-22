# syntax=docker/dockerfile:1
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git openssh-client

# Configure git to use HTTPS with token
RUN git config --global url."https://github.com/".insteadOf "git@github.com:" && \
    git config --global url."https://".insteadOf "git://"

# Clone, build and package mana-core as a tarball
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
        export GITHUB_TOKEN=$(cat /run/secrets/github_token) && \
        echo "Using GitHub token for private repo access" && \
        git clone https://${GITHUB_TOKEN}@github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    else \
        echo "No GitHub token provided, attempting public clone" && \
        git clone https://github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    fi && \
    cd /tmp/mana-core && \
    npm install --force && \
    npm run build && \
    npm pack && \
    mv *.tgz /app/mana-core.tgz && \
    echo "Mana-core packaged as tarball at /app/mana-core.tgz"

# Copy package.json
COPY package.json ./

# Replace GitHub URL with the tarball
RUN sed -i 's|"git+https://github.com/Memo-2023/mana-core-nestjs-package.git"|"file:mana-core.tgz"|g' package.json || \
    sed -i 's|"github:Memo-2023/mana-core-nestjs-package"|"file:mana-core.tgz"|g' package.json

# Debug: Verify the replacement and file existence
RUN echo "=== Verifying tarball and package.json ===" && \
    ls -la mana-core.tgz && \
    echo "Tarball exists at /app/mana-core.tgz" && \
    echo "Checking package.json replacement:" && \
    grep -n "mana-core" package.json && \
    echo "=== End verification ==="

# Install dependencies
RUN npm install --legacy-peer-deps && \
    echo "Dependencies installed with mana-core from tarball"

# Copy source code
COPY . .

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
