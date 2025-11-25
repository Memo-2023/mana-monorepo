# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy the nutriphi-database package
COPY packages/nutriphi-database ./packages/nutriphi-database

# Copy the backend
COPY nutriphi/backend ./nutriphi/backend

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @nutriphi/backend...

# Build the database package first
RUN pnpm --filter @manacore/nutriphi-database build

# Build the backend
RUN pnpm --filter @nutriphi/backend build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built files
COPY --from=builder /app/nutriphi/backend/dist ./dist
COPY --from=builder /app/nutriphi/backend/package.json ./
COPY --from=builder /app/nutriphi/backend/node_modules ./node_modules
COPY --from=builder /app/packages/nutriphi-database/dist ./node_modules/@manacore/nutriphi-database/dist
COPY --from=builder /app/packages/nutriphi-database/package.json ./node_modules/@manacore/nutriphi-database/

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/main.js"]
