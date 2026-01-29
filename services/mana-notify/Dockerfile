FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Build stage
FROM base AS builder

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY services/mana-notify/package.json ./services/mana-notify/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @manacore/mana-notify

# Copy source code
COPY services/mana-notify ./services/mana-notify

# Build
WORKDIR /app/services/mana-notify
RUN pnpm build

# Production stage
FROM base AS production

WORKDIR /app

# Copy built files
COPY --from=builder /app/services/mana-notify/dist ./dist
COPY --from=builder /app/services/mana-notify/package.json ./

# Copy template files
COPY --from=builder /app/services/mana-notify/src/templates/defaults ./dist/templates/defaults

# Install production dependencies only
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3040

EXPOSE 3040

CMD ["node", "dist/main.js"]
