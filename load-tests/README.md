# Load Tests

k6-basierte Load Tests fuer die Mana-Infrastruktur.

## Setup

```bash
# k6 installieren (macOS)
brew install k6

# WebSocket-Extension (fuer Sync-Tests)
# k6 hat WebSocket-Support eingebaut
```

## Tests ausfuehren

```bash
# Gegen lokale Umgebung
k6 run load-tests/web-apps.js
k6 run load-tests/auth-api.js
k6 run load-tests/sync-websocket.js
k6 run load-tests/llm-ollama.js

# Gegen Produktion (vorsichtig!)
k6 run -e BASE_URL=https://mana.how load-tests/web-apps.js

# Mit mehr/weniger Last
k6 run --vus 100 --duration 5m load-tests/web-apps.js

# JSON-Output fuer Grafana
k6 run --out json=results.json load-tests/web-apps.js
```

## Test-Szenarien

| Script | Ziel | Default VUs | Dauer |
|--------|------|-------------|-------|
| `web-apps.js` | SvelteKit Frontends (HTML-Responses) | 10→50→10 | 5 min |
| `auth-api.js` | Login, Register, Token Validation | 5→20→5 | 4 min |
| `sync-websocket.js` | mana-sync WebSocket Connections | 10→30→10 | 5 min |
| `llm-ollama.js` | Ollama Chat Completions | 1→3→1 | 3 min |

## Metriken interpretieren

| Metrik | Gut | Akzeptabel | Schlecht |
|--------|-----|-----------|---------|
| http_req_duration (p95) | < 200ms | < 1s | > 2s |
| http_req_failed | 0% | < 1% | > 5% |
| ws_connecting (p95) | < 100ms | < 500ms | > 1s |
| iterations | Steigend | Stabil | Fallend |

## Monitoring waehrend Tests

Grafana-Dashboard auf http://localhost:8080 (oder https://grafana.mana.how) beobachten:
- Container CPU/RAM (cAdvisor)
- PostgreSQL Connections
- Redis Commands/sec
- Netzwerk-Throughput
