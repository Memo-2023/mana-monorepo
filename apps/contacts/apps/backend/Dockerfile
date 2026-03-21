# syntax=docker/dockerfile:1
# Build stage — inherits pre-built shared packages from nestjs-base
FROM nestjs-base:local AS builder

# Copy contacts backend
COPY apps/contacts/apps/backend ./apps/contacts/apps/backend

# Reinstall to link app-specific dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# Build the backend
WORKDIR /app/apps/contacts/apps/backend
RUN pnpm build

# Remove devDependencies and unnecessary files from node_modules
WORKDIR /app
RUN pnpm prune --prod --no-optional 2>/dev/null || true \
    && find node_modules -name '*.ts' -not -name '*.d.ts' -delete 2>/dev/null || true \
    && find node_modules -name '*.map' -delete 2>/dev/null || true \
    && find node_modules -type d \( -name 'test' -o -name 'tests' -o -name '__tests__' \) -prune -exec rm -rf {} + 2>/dev/null || true

# Production stage
FROM node:20-alpine AS production

# Install postgresql-client for health checks
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy everything from builder (including node_modules)
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/contacts ./apps/contacts

# Copy entrypoint script
COPY apps/contacts/apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/contacts/apps/backend

# Expose port
EXPOSE 3015

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3015/api/v1/health || exit 1

# Run entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
