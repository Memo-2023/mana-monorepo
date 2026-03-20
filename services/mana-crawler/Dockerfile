# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy service files
COPY services/mana-crawler/package.json ./services/mana-crawler/

# Copy shared packages
COPY packages/shared-drizzle-config/package.json ./packages/shared-drizzle-config/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY services/mana-crawler ./services/mana-crawler
COPY packages/shared-drizzle-config ./packages/shared-drizzle-config

# Build
WORKDIR /app/services/mana-crawler
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package files
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/services/mana-crawler/package.json ./services/mana-crawler/
COPY --from=builder /app/packages/shared-drizzle-config/package.json ./packages/shared-drizzle-config/

# Install production dependencies only
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/services/mana-crawler/dist ./services/mana-crawler/dist
COPY --from=builder /app/packages/shared-drizzle-config/dist ./packages/shared-drizzle-config/dist

WORKDIR /app/services/mana-crawler

EXPOSE 3023

CMD ["node", "dist/main"]
