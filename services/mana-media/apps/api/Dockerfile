FROM oven/bun:1 AS production

WORKDIR /app

COPY package.json bun.lock* ./
COPY src ./src

# Remove workspace devDependencies that can't resolve in Docker, then install
RUN sed -i '/"@manacore\/shared-drizzle-config"/d' package.json && \
    bun install --production --frozen-lockfile 2>/dev/null || bun install --production

EXPOSE 3015

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3015/health || exit 1

USER bun
CMD ["bun", "run", "src/index.ts"]
