# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mana-sync ./cmd/server

# Runtime stage
FROM alpine:3.21

RUN apk --no-cache add ca-certificates
COPY --from=builder /mana-sync /usr/local/bin/mana-sync

EXPOSE 3050

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
	CMD wget -q --spider http://localhost:3050/health || exit 1

ENTRYPOINT ["mana-sync"]
