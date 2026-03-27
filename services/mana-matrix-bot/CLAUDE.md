# mana-matrix-bot

Consolidated Go Matrix bot replacing 21 separate NestJS bot services.

## Architecture

- **Language:** Go 1.23
- **Matrix SDK:** mautrix-go
- **Port:** 4000 (health/metrics)
- **Pattern:** Plugin architecture with compile-time registration

## Structure

```
cmd/server/main.go          # Entry point, imports all plugins
internal/
  config/                    # Env-based configuration
  runtime/                   # Plugin lifecycle, Matrix sync, event routing
  matrix/                    # Matrix client wrapper, markdown, media
  plugin/                    # Plugin interface, registry, command routing
  session/                   # In-memory + Redis session store
  services/                  # Backend HTTP client, voice (STT/TTS)
  plugins/                   # One directory per bot plugin
    todo/                    # @todo-bot
    calendar/                # @calendar-bot
    gateway/                 # @mana-bot (composite: AI + todo + calendar + clock + voice)
    ...
```

## Adding a New Plugin

1. Create `internal/plugins/mybot/mybot.go`
2. Implement `plugin.Plugin` interface
3. Register via `func init() { plugin.Register("mybot", func() plugin.Plugin { return &MyBot{} }) }`
4. Import in `cmd/server/main.go`: `_ "github.com/manacore/mana-matrix-bot/internal/plugins/mybot"`
5. Set env: `MATRIX_MYBOT_BOT_TOKEN=syt_xxx`

## Commands

```bash
# Build
go build -o dist/mana-matrix-bot ./cmd/server

# Run
PORT=4000 MATRIX_HOMESERVER_URL=http://localhost:8008 MATRIX_TODO_BOT_TOKEN=xxx ./dist/mana-matrix-bot

# Test
go test ./...

# Docker
docker build -t mana-matrix-bot:local -f Dockerfile .
```

## Environment Variables

### Global
- `PORT` — Health server port (default: 4000)
- `MATRIX_HOMESERVER_URL` — Matrix homeserver (default: http://localhost:8008)
- `MATRIX_STORAGE_PATH` — Sync state directory (default: ./data)
- `MANA_CORE_AUTH_URL` — Auth service URL
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis for sessions
- `STT_URL`, `TTS_URL` — Voice services

### Per Plugin (legacy env var names supported)
- `MATRIX_{NAME}_BOT_TOKEN` — Matrix access token
- `MATRIX_{NAME}_BOT_ROOMS` — Comma-separated allowed room IDs
- `{NAME}_BACKEND_URL` — Backend service URL
