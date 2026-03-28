# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY packages/shared-go/ /shared-go/
COPY services/mana-crawler/go.mod services/mana-crawler/go.sum ./
RUN go mod edit -replace github.com/manacore/shared-go=/shared-go && go mod download

COPY services/mana-crawler/ .
RUN go mod edit -replace github.com/manacore/shared-go=/shared-go && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mana-crawler ./cmd/server

# Runtime stage
FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /mana-crawler /usr/local/bin/mana-crawler

# Ensure Go finds CA certificates for HTTPS requests
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

EXPOSE 3023

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
	CMD wget -q --spider http://localhost:3023/health || exit 1

ENTRYPOINT ["mana-crawler"]
