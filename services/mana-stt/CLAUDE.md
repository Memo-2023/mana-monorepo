# mana-stt

Speech-to-Text service for the Mana ecosystem. Runs on the Mac Mini M4 (Apple Silicon) and exposes a small FastAPI surface that wraps multiple Whisper backends plus Mistral's hosted Voxtral API.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Python 3.11 + uvicorn |
| **Framework** | FastAPI |
| **Local model** | Whisper Large V3 via [`lightning-whisper-mlx`](https://github.com/mustafaaljadery/lightning-whisper-mlx) (Apple MLX) |
| **Local model (rich)** | WhisperX for word-level timestamps + diarization |
| **Cloud model** | Mistral Voxtral Mini API |
| **Optional** | vLLM Voxtral (GPU) — see `vllm_service.py` |
| **Auth** | JWT validation via mana-auth (`external_auth.py`) + API key fallback (`auth.py`) |
| **Process supervision** | launchd via `com.mana.mana-stt.plist` |

## Port: 3020

## Quick Start

```bash
cd services/mana-stt
./setup.sh                                          # Create venv + install
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3020
```

Production runs via launchd on the Mac Mini — `install-service.sh` (single service) or `install-services.sh` (mana-stt + vllm-voxtral together).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + which backends are loaded |
| GET | `/models` | List available STT models |
| POST | `/transcribe` | Whisper MLX (default, fastest local) |
| POST | `/transcribe/whisperx` | WhisperX with word-level timestamps + diarization |
| POST | `/transcribe/voxtral` | Local Voxtral (vLLM) |
| POST | `/transcribe/voxtral/api` | Mistral Voxtral API (cloud) |
| POST | `/transcribe/auto` | Tries WhisperX first, falls back to Whisper MLX |

All `/transcribe*` endpoints accept multipart `file` upload + optional `language` form field. Auth via `Authorization: Bearer <jwt>` or `X-API-Key`.

## Backends (`app/`)

| File | What it loads |
|------|---------------|
| `whisper_service.py` | Whisper Large V3 via MLX (local, default) |
| `whisper_service_cuda.py` | CUDA Whisper (only used on Windows GPU server) |
| `whisperx_service.py` | WhisperX with diarization (local, slower, richer output) |
| `voxtral_service.py` | Local Voxtral via vLLM (optional, needs the second launchd job) |
| `voxtral_api_service.py` | Mistral hosted Voxtral API (cloud) |
| `vllm_service.py` | vLLM client primitives shared with Voxtral |
| `auth.py` | API key auth (fallback path) |
| `external_auth.py` | JWT auth via mana-auth public key |

Backends are loaded lazily during the FastAPI lifespan and reported by `/health`. Missing dependencies (e.g. CUDA on Mac) are tolerated — the service starts without them.

## Configuration

Reads from `services/mana-stt/.env` (loaded by the launchd plist's `set -a; source .env; set +a`). Relevant variables:

```env
PORT=3020
MANA_AUTH_URL=http://localhost:3001     # JWKS source for JWT verification
MISTRAL_API_KEY=...                     # only needed for /transcribe/voxtral/api
STT_API_KEY=...                         # legacy API key fallback
```

## Operations

- **Logs**: launchd writes to `~/Library/Logs/mana-stt.{out,err}.log` (see plist)
- **Metrics**: Prometheus endpoint at `/metrics` if enabled in config; Grafana dashboard JSON checked in at `grafana-dashboard.json`
- **Restart**: `launchctl kickstart -k gui/$(id -u)/com.mana.mana-stt`

## Reference

- `services/mana-stt/README.md` — user-facing setup, model download instructions, language coverage
- `docs/LOCAL_STT_MODELS.md` — WER comparisons, model size/quality tradeoffs
