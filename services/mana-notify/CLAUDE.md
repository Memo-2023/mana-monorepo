# mana-notify (Go)

Go replacement for the NestJS mana-notify service. Unified notification microservice for email, push, and webhook notifications.

## Architecture

- **Language:** Go 1.25
- **Database:** PostgreSQL (pgx v5, 5 tables in `notify` schema)
- **Queue:** Go channels + goroutine worker pool (replaces BullMQ)
- **Metrics:** Prometheus
- **Port:** 3040

## Endpoints

### Notifications (X-Service-Key auth)
- `POST /api/v1/notifications/send` — Send immediately
- `POST /api/v1/notifications/schedule` — Schedule for future
- `POST /api/v1/notifications/batch` — Batch send (max 100)
- `GET /api/v1/notifications/{id}` — Get status
- `DELETE /api/v1/notifications/{id}` — Cancel pending

### Templates (X-Service-Key auth)
- `GET /api/v1/templates` — List all
- `GET /api/v1/templates/{slug}` — Get by slug
- `POST /api/v1/templates` — Create
- `PUT /api/v1/templates/{slug}` — Update
- `DELETE /api/v1/templates/{slug}` — Delete
- `POST /api/v1/templates/{slug}/preview` — Preview
- `POST /api/v1/templates/preview` — Preview custom

### Devices (JWT auth)
- `POST /api/v1/devices/register` — Register push device
- `GET /api/v1/devices` — List devices
- `DELETE /api/v1/devices/{id}` — Unregister

### Preferences (JWT auth)
- `GET /api/v1/preferences` — Get preferences
- `PUT /api/v1/preferences` — Update preferences

### System
- `GET /health` — Health check
- `GET /metrics` — Prometheus metrics

## Notification Channels

| Channel | Service | Worker Concurrency | Max Retries |
|---------|---------|-------------------|-------------|
| Email | Stalwart SMTP (self-hosted, see `docs/MAIL_SERVER.md`) | 5 | 3 |
| Push | Expo Push API | 10 | 3 |
| Webhook | HTTP callback | 10 | 5 |

## Commands

```bash
go run ./cmd/server          # Dev
go build -o bin/mana-notify ./cmd/server  # Build
go test ./...                # Test
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3040 | Server port |
| `DATABASE_URL` | postgresql://...localhost:5432/mana_notify | PostgreSQL |
| `SERVICE_KEY` | dev-service-key | Service-to-service auth |
| `MANA_AUTH_URL` | http://localhost:3001 | JWT validation |
| `SMTP_HOST` | stalwart | SMTP host (self-hosted Stalwart) |
| `SMTP_PORT` | 587 | SMTP port |
| `SMTP_USER` | | SMTP username |
| `SMTP_PASSWORD` | | SMTP password |
| `SMTP_FROM` | Mana <noreply@mana.how> | Default from |
| `EXPO_ACCESS_TOKEN` | | Expo push token |
