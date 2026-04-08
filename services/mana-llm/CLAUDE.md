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
# Health check
curl http://localhost:3025/health

# Prometheus metrics
curl http://localhost:3025/metrics
```

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
