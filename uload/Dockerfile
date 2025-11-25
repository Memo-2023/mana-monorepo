# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# App bauen
COPY . .

# Generate .svelte-kit directory first by running vite in prepare mode
RUN npx vite build --mode prepare || true
# Sync SvelteKit files
RUN npx svelte-kit sync

# Compile paraglide messages before build (using the correct output directory)
RUN npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide

# Now build the app
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Nur Node.js App
COPY --from=builder /app/build build/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/drizzle drizzle/

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

EXPOSE 3000

# Direkt Node starten (kein Supervisor nötig)
CMD ["node", "build"]