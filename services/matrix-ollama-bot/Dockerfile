# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (exclude pnpm-lock.yaml to use npm)
COPY package.json ./

# Install dependencies using npm (more compatible with standard tooling)
RUN npm install

# Copy source
COPY . .

# Build using TypeScript
RUN rm -rf dist && npx tsc -p tsconfig.build.json

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create data directory for bot storage
RUN mkdir -p /app/data

# Copy package files
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3311/health || exit 1

EXPOSE 3311

CMD ["node", "dist/main.js"]
