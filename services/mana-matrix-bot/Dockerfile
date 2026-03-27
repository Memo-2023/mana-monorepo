# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy Go module files first for better caching
COPY services/mana-matrix-bot/go.mod services/mana-matrix-bot/go.sum ./
RUN go mod download

# Copy source
COPY services/mana-matrix-bot/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mana-matrix-bot ./cmd/server

# Runtime stage
FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /mana-matrix-bot /usr/local/bin/mana-matrix-bot

VOLUME /app/data

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -q --spider http://localhost:4000/health || exit 1

ENTRYPOINT ["mana-matrix-bot"]
