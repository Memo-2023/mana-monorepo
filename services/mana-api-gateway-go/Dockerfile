# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY services/mana-api-gateway-go/go.mod services/mana-api-gateway-go/go.sum ./
RUN go mod download

COPY services/mana-api-gateway-go/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mana-api-gateway ./cmd/server

# Runtime stage
FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /mana-api-gateway /usr/local/bin/mana-api-gateway

EXPOSE 3030

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
	CMD wget -q --spider http://localhost:3030/health || exit 1

ENTRYPOINT ["mana-api-gateway"]
