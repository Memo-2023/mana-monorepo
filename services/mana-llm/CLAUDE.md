# mana-llm

Central LLM abstraction service providing a unified OpenAI-compatible API for Ollama and cloud LLM providers.

## Overview

mana-llm acts as a central gateway for all LLM requests in the monorepo, providing:
- Unified OpenAI-compatible API
- Provider routing (Ollama, OpenRouter, Groq, Together)
- Streaming via Server-Sent Events (SSE)
- Vision/multimodal support
- Embeddings generation
- Prometheus metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Consumer Apps                                 │
│  chat-backend │ mana web │ todo (LLM enrich) │ etc.                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP/SSE
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     mana-llm (Port 3025)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Router    │  │   Cache     │  │   Metrics   │                 │
│  │ (Provider)  │  │  (Redis)    │  │ (Prometheus)│                 │
│  └──────┬──────┘  └─────────────┘  └─────────────┘                 │
│         │                                                           │
│  ┌──────┴──────────────────────────────────────────┐               │
│  │              Provider Adapters                   │               │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │               │
│  │  │  Ollama  │  │ OpenAI   │  │  OpenRouter  │  │               │
│  │  │  Adapter │  │ Adapter  │  │   Adapter    │  │               │
│  │  └──────────┘  └──────────┘  └──────────────┘  │               │
│  └─────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Ollama running locally (http://localhost:11434)
- Redis (optional, for caching)

### Development

```bash
cd services/mana-llm

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start Redis (optional)
docker-compose -f docker-compose.dev.yml up -d

# Run service
python -m uvicorn src.main:app --port 3025 --reload
```

### Docker

```bash
# Full stack (mana-llm + Redis)
docker-compose up -d

# View logs
docker-compose logs -f mana-llm
```

## API Endpoints

### Chat Completions

```bash
# Non-streaming
curl -X POST http://localhost:3025/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:4b",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'

# Streaming (SSE)
curl -X POST http://localhost:3025/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:4b",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### Vision/Multimodal

```bash
curl -X POST http://localhost:3025/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/llava:7b",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "What is in this image?"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
      ]
    }]
  }'
```

### Models

```bash
# List all models
curl http://localhost:3025/v1/models

# Get specific model
curl http://localhost:3025/v1/models/ollama/gemma3:4b
```

### Embeddings

```bash
curl -X POST http://localhost:3025/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/nomic-embed-text",
    "input": "Text to embed"
  }'
```

### Health & Metrics

```bash
# Liveness summary (legacy, terse shape — only status + per-provider status string)
curl http://localhost:3025/health

# Detailed per-provider liveness snapshot (M4)
curl http://localhost:3025/v1/health

# Prometheus metrics
curl http://localhost:3025/metrics
```

### Aliases (M4 — see `aliases.yaml` and the fallback section below)

```bash
# What does each `mana/<class>` resolve to?
curl http://localhost:3025/v1/aliases
```

## Aliases & Fallback

> Background: [`docs/plans/llm-fallback-aliases.md`](../../docs/plans/llm-fallback-aliases.md)

### What callers send

Two acceptable shapes for the `model` field of `/v1/chat/completions`:

1. **Aliases** in the reserved `mana/` namespace — recommended for product code.
   The router resolves them via `aliases.yaml` to a chain of concrete
   `provider/model` strings and tries them in order.
2. **Direct `provider/model`** — bypasses the alias layer, no fallback.
   Useful for tests, debugging, and one-off integrations.

| Alias | Class |
|---|---|
| `mana/fast-text` | Short answers, classification, single-shot Q&A |
| `mana/long-form` | Writing, essays, stories, longer prose |
| `mana/structured` | JSON output (comic storyboards, research subqueries, tag suggestions) |
| `mana/reasoning` | Agent missions, tool calls, multi-step plans |
| `mana/vision` | Multimodal (image + text) |

The chain for each alias lives in `services/mana-llm/aliases.yaml`. Edit
the file and `kill -HUP <pid>` to reload — no restart needed. Reload
errors keep the previous good state; check the service logs.

### Fallback semantics

Every chain is tried in order. The router skips an entry if the provider
isn't configured at this deployment (no API key) or is currently marked
unhealthy by the health-cache. For each remaining entry the request is
attempted; on a **retryable** error (connection failure, timeout, 5xx,
rate-limit, RemoteProtocolError) the provider is marked unhealthy and
the next entry is tried. **Non-retryable** errors (auth, capability,
content-blocked, 4xx, unknown exception types) propagate immediately —
no fallback, the cache is not poisoned.

Streaming follows the same logic up to the **first byte**. Once a chunk
has been yielded the provider is committed; mid-stream errors surface
as-is so we never splice two providers' voices into one output.

If every entry was skipped or failed, the response is `503` carrying a
structured `attempts: list[(model, reason)]` log so the cause is
visible to the caller, not only in service logs.

### Resolved-model header

Non-streaming responses carry `X-Mana-LLM-Resolved: <provider>/<model>`
(e.g. `groq/llama-3.3-70b-versatile`) — the concrete model that
actually answered. Use this for token-cost attribution when the request
used an alias. For streaming, each chunk's `model` field carries the
same info (headers go out before the chain is walked).

### Health-cache + probe

`ProviderHealthCache` keeps a per-provider circuit-breaker:

* 1 failure: still healthy (transient blip, don't bounce).
* 2 consecutive failures: `is_healthy → False` for 60 s; the router
  fail-fasts straight to the next chain entry.
* After 60 s: half-open. Next call exercises the provider; success
  fully resets, failure re-arms the backoff.

A background `HealthProbe` task runs every 30 s with a 3 s timeout per
provider, calling cheap endpoints (`/api/tags` for Ollama, `/v1/models`
for OpenAI-compat). One bad probe can't sink the loop; results feed
into the same cache as the call-site fallback.

### Prometheus metrics added in M4

| Metric | Labels | Purpose |
|---|---|---|
| `mana_llm_alias_resolved_total` | `alias`, `target` | How often an alias resolved to which concrete model — useful for spotting cases where the primary always falls through. |
| `mana_llm_fallback_total` | `from_model`, `to_model`, `reason` | Each fallback transition. `reason` is the exception class name or `cache-unhealthy` / `unconfigured`. |
| `mana_llm_provider_healthy` | `provider` | Gauge: 1 healthy, 0 in backoff. Mirrors the circuit-breaker. |

## Provider Routing

Models use the format `provider/model`:

| Model | Provider | Target |
|-------|----------|--------|
| `ollama/gemma3:4b` | Ollama | localhost:11434 |
| `ollama/llava:7b` | Ollama | localhost:11434 |
| `openrouter/meta-llama/llama-3.1-8b-instruct` | OpenRouter | api.openrouter.ai |
| `groq/llama-3.1-8b-instant` | Groq | api.groq.com |
| `together/meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` | Together | api.together.xyz |

**Default:** If no provider prefix is given (e.g., `gemma3:4b`), Ollama is used.

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3025 | Service port |
| `LOG_LEVEL` | info | Logging level |
| `OLLAMA_URL` | http://localhost:11434 | Ollama server URL |
| `OLLAMA_DEFAULT_MODEL` | gemma3:4b | Default Ollama model |
| `OLLAMA_TIMEOUT` | 120 | Ollama request timeout (seconds) |
| `OPENROUTER_API_KEY` | - | OpenRouter API key |
| `GROQ_API_KEY` | - | Groq API key |
| `TOGETHER_API_KEY` | - | Together API key |
| `REDIS_URL` | - | Redis URL for caching |
| `CACHE_TTL` | 3600 | Cache TTL in seconds |
| `CORS_ORIGINS` | localhost | Allowed CORS origins |

## Project Structure

```
services/mana-llm/
├── src/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings via pydantic-settings
│   ├── providers/
│   │   ├── base.py             # Abstract provider interface
│   │   ├── ollama.py           # Ollama provider
│   │   ├── openai_compat.py    # OpenAI-compatible provider
│   │   └── router.py           # Provider routing logic
│   ├── models/
│   │   ├── requests.py         # Request Pydantic models
│   │   └── responses.py        # Response Pydantic models
│   ├── streaming/
│   │   └── sse.py              # SSE response handling
│   └── utils/
│       ├── cache.py            # Redis caching
│       └── metrics.py          # Prometheus metrics
├── tests/
│   ├── test_api.py             # API endpoint tests
│   ├── test_providers.py       # Provider tests
│   └── test_streaming.py       # Streaming tests
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── requirements.txt
├── pyproject.toml
└── .env.example
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_providers.py -v
```

## Integration Example

### TypeScript/Node.js Client

```typescript
// Using fetch
const response = await fetch('http://localhost:3025/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'ollama/gemma3:4b',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: false,
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### Streaming with EventSource

```typescript
const response = await fetch('http://localhost:3025/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'ollama/gemma3:4b',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

  for (const line of lines) {
    const data = line.slice(6);
    if (data === '[DONE]') break;

    const parsed = JSON.parse(data);
    const content = parsed.choices[0]?.delta?.content;
    if (content) process.stdout.write(content);
  }
}
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| mana-tts | 3022 | Text-to-speech service |
| mana-stt | 3023 | Speech-to-text service |
| mana-search | 3021 | Web search & extraction |
