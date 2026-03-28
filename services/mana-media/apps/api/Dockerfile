FROM oven/bun:1 AS production

WORKDIR /app

COPY package.json bun.lock* ./
COPY src ./src

RUN bun install --production --frozen-lockfile

EXPOSE 3015

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3015/health || exit 1

USER bun
CMD ["bun", "run", "src/index.ts"]
