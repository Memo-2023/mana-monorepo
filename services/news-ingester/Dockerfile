FROM oven/bun:1 AS production

WORKDIR /app

# Copy package files and install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Copy source
COPY src ./src
COPY tsconfig.json drizzle.config.ts ./

EXPOSE 3066

HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://localhost:3066/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "src/index.ts"]
