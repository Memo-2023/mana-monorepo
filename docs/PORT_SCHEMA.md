# Port Schema

> ⚠️ **ASPIRATIONAL — does not match running services as of 2026-04-08.**
>
> This document describes a *planned* reorganization of port assignments
> into clean ranges (3000–3009 core, 3010–3019 infra, 3020–3029 AI/ML, …).
> The reorg has not been executed: the actual ports the services bind to
> live in their `app/main.py` / `start.sh` / `config.ts` and currently
> follow a different scheme. Per-service ports are documented in each
> `services/*/CLAUDE.md`. Notable real-world ports today:
>
> - mana-auth `3001`, mana-credits `3061`, mana-user `3062`,
>   mana-subscriptions `3063`, mana-analytics `3064`, mana-events `3065`
> - mana-media `3015`, mana-sync `3050`, mana-search `3021`,
>   mana-notify `3040`, mana-crawler `3023`
> - mana-llm `3025`, mana-stt `3020`, mana-tts `3022`,
>   mana-image-gen `3026`, mana-video-gen `3026` ⚠️ **collision**,
>   mana-voice-bot `3050` ⚠️ **collision with mana-sync**
>
> Two real port collisions exist (image-gen ↔ video-gen, voice-bot ↔ sync)
> that are masked by the fact that they don't all run on the same host
> today. Either execute the reorg below, or pick non-colliding ports and
> update this doc to match reality.

**Originally drafted:** 2026-03-28

## Principles

1. Each range has a clear purpose (100 ports per range)
2. Backend 30xx and Frontend 50xx use matching last digits where possible
3. No conflicts - every port assigned exactly once
4. Room for growth in each range

## 3000-3009: Core Platform Services

| Port | Service | Runtime | Description |
|------|---------|---------|-------------|
| 3001 | mana-auth | Hono/Bun | Authentication, JWT, sessions |
| 3002 | mana-credits | Go | Credit system, billing |
| 3003 | mana-subscriptions | Go | Stripe subscriptions |
| 3004 | mana-user | Go | User profiles, settings |
| 3005 | mana-analytics | Go | Usage analytics, DuckDB |
| 3006-3009 | *(reserved)* | | |

## 3010-3019: Core Infrastructure Services

| Port | Service | Runtime | Description |
|------|---------|---------|-------------|
| 3010 | mana-sync | Go | Local-first data sync (WebSocket + HTTP) |
| 3011 | mana-media | NestJS | Content-addressable storage, thumbnails |
| 3012 | mana-search | Go | Web search via SearXNG |
| 3013 | mana-notify | Go | Notifications (email, push, Matrix) |
| 3014 | mana-crawler | Go | Web crawler, content extraction |
| 3015 | mana-landing-builder | NestJS | Org landing page builder |
| 3016 | mana-api-gateway | Go | API keys, rate limiting, usage tracking |
| 3017-3019 | *(reserved)* | | |

## 3020-3029: AI/ML Services

| Port | Service | Runtime | Description |
|------|---------|---------|-------------|
| 3020 | mana-llm | Python | LLM abstraction (Ollama, OpenRouter) |
| 3021 | mana-stt | Python | Speech-to-Text (Whisper) |
| 3022 | mana-tts | Python | Text-to-Speech (Kokoro, Piper) |
| 3023 | mana-image-gen | Python | Image generation (FLUX) |
| 3024 | mana-voice-bot | Python | Voice-to-voice assistant |
| 3025-3029 | *(reserved)* | | |

## 3030-3059: App Compute Servers

Only apps that need server-side compute (AI, external APIs, file operations).
Pure CRUD apps use mana-sync directly.

| Port | Service | Runtime | Description |
|------|---------|---------|-------------|
| 3030 | chat-server | Hono/Bun | AI chat, streaming, spaces |
| 3031 | todo-server | Hono/Bun | RRULE expansion, reminders |
| 3032 | calendar-server | Hono/Bun | CalDAV sync, Google Calendar, notifications |
| 3033 | contacts-server | Hono/Bun | Google Contacts, vCard import/export |
| 3034 | storage-server | Hono/Bun | S3 file ops, versioning, shares |
| 3035 | picture-server | Hono/Bun | Replicate AI, generation orchestration |
| 3036 | cards-server | Hono/Bun | AI card generation |
| 3037 | mukke-server | Hono/Bun | Audio processing, BPM, ID3 tags |
| 3038 | nutriphi-server | Hono/Bun | Gemini meal analysis |
| 3039 | planta-server | Hono/Bun | Gemini plant analysis |
| 3040 | presi-server | Hono/Bun | Share links |
| 3041-3059 | *(reserved)* | | |

## 4000-4099: Matrix/Chat Stack

| Port | Service | Description |
|------|---------|-------------|
| 4000 | synapse | Matrix homeserver |
| 4001 | mana-matrix-bot | Go bot (health/metrics) |
| 4010 | element-web | Element web client |
| 4011 | matrix-web | SvelteKit Matrix client |
| 4400 | landings | Nginx static landing pages |

## 5000-5059: Web Frontends (SvelteKit)

| Port | Service | Corresponds to Server |
|------|---------|----------------------|
| 5000 | mana-web | Hub/Dashboard |
| 5010 | chat-web | 3030 chat-server |
| 5011 | todo-web | 3031 todo-server |
| 5012 | calendar-web | 3032 calendar-server |
| 5013 | clock-web | *(local-first only)* |
| 5014 | contacts-web | 3033 contacts-server |
| 5015 | storage-web | 3034 storage-server |
| 5016 | presi-web | 3040 presi-server |
| 5017 | nutriphi-web | 3038 nutriphi-server |
| 5018 | zitare-web | *(local-first only)* |
| 5019 | photos-web | *(local-first + mana-media)* |
| 5020 | skilltree-web | *(local-first only)* |
| 5021 | picture-web | 3035 picture-server |
| 5022 | citycorners-web | *(local-first only)* |
| 5023 | cards-web | 3036 cards-server |
| 5024 | mukke-web | 3037 mukke-server |
| 5025 | inventar-web | *(local-first only)* |
| 5026 | context-web | *(local-first only)* |
| 5027 | questions-web | *(local-first only)* |
| 5028 | planta-web | 3039 planta-server |
| 5029 | moodlit-web | *(future)* |
| 5030-5049 | *(reserved)* | |

## 5050-5059: Playground/Dev Tools

| Port | Service | Description |
|------|---------|-------------|
| 5050 | llm-playground | LLM testing UI |

## 5100-5199: Games

| Port | Service | Description |
|------|---------|-------------|
| 5100 | whopixels | Pixel art game |

## 8000-8099: Monitoring Dashboards

| Port | Service | Description |
|------|---------|-------------|
| 8000 | grafana | Metrics dashboards |
| 8010 | umami | Web analytics |
| 8020 | glitchtip | Error tracking |

## 9000-9199: Infrastructure & Exporters

| Port | Service | Description |
|------|---------|-------------|
| 5432 | postgres | PostgreSQL |
| 6379 | redis | Redis cache |
| 9000 | minio (S3 API) | Object storage |
| 9001 | minio (Console) | MinIO admin UI |
| 9090 | victoriametrics | Metrics storage |
| 9091 | pushgateway | Deploy metrics |
| 9093 | alertmanager | Alert routing |
| 9095 | alert-notifier | Matrix alert bridge |
| 9100 | node-exporter | Host metrics |
| 9110 | cadvisor | Container metrics |
| 9121 | redis-exporter | Redis metrics |
| 9187 | postgres-exporter | Postgres metrics |

## SearXNG (Internal Only)

| Port | Service | Description |
|------|---------|-------------|
| 8080 | searxng | Meta-search (not exposed to host) |

## Adding a New Service

1. Pick the next free port in the appropriate range
2. Update this document
3. Update `docker-compose.macmini.yml`
4. Update `scripts/generate-env.mjs` if the service has a dev env
5. Update `docker/prometheus/prometheus.yml` if the service exposes metrics
