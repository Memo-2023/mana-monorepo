# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from apps/web
COPY apps/web/package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy web app source
COPY apps/web/ .

# Generate .svelte-kit directory first by running vite in prepare mode
RUN npx vite build --mode prepare || true

# Sync SvelteKit files
RUN npx svelte-kit sync

# Compile paraglide messages before build
RUN npx @inlang/paraglide-js compile --project ./project.inlang --outdir ./src/paraglide

# Build the app
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy built app and dependencies
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

# Start Node server
CMD ["node", "build"]
