FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY services/mana-notify-go/go.mod services/mana-notify-go/go.sum ./
RUN go mod download

COPY services/mana-notify-go/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mana-notify ./cmd/server

FROM alpine:3.21

RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 1000 mana && adduser -u 1000 -G mana -s /sbin/nologin -D mana

COPY --from=builder /mana-notify /usr/local/bin/mana-notify

USER mana
EXPOSE 3040

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3040/health || exit 1

ENTRYPOINT ["mana-notify"]
