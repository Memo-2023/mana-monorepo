FROM node:20-alpine

# Install FFmpeg 8.x from Alpine edge repository
# - Native support for iOS spatial audio 'chnl' v1 metadata box
# - Fixes: "Unsupported 'chnl' box with version 1" error
# - Install mpg123-libs from edge to avoid symbol conflicts
RUN apk add --no-cache \
    --repository=https://dl-cdn.alpinelinux.org/alpine/edge/main \
    --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community \
    ffmpeg \
    mpg123-libs

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads

# Cloud Run uses PORT environment variable
EXPOSE ${PORT:-1337}

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# Start the application
CMD ["npm", "run", "start:prod"]