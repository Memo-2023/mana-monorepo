FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY services/mana-search-go/go.mod services/mana-search-go/go.sum ./
RUN go mod download

COPY services/mana-search-go/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mana-search ./cmd/server

FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 1000 mana && adduser -u 1000 -G mana -s /sbin/nologin -D mana

COPY --from=builder /mana-search /usr/local/bin/mana-search

USER mana
EXPOSE 3021

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3021/health || exit 1

ENTRYPOINT ["mana-search"]
