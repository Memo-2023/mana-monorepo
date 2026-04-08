# mana-stt

Speech-to-Text microservice. Wraps Whisper (CUDA, with WhisperX for word-level timestamps + diarization), local Voxtral via vLLM, and Mistral's hosted Voxtral API behind a small FastAPI surface. Lives on the Windows GPU server (`mana-server-gpu`, RTX 3090).

> ⚠️ **Earlier history**: this directory used to contain Mac-Mini–targeted
> code (Whisper Lightning MLX, com.mana.mana-stt.plist launchd setup,
> setup.sh with Apple-Silicon checks). That all moved to the Windows
> GPU box and was removed from the repo. If you're looking for the MLX
> path, see git history.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Python 3.11 + uvicorn (Windows) |
| **Framework** | FastAPI |
| **Whisper** | `whisperx` on CUDA (large-v3 + word alignment + pyannote diarization) |
| **Voxtral (local)** | vLLM serving Voxtral 3B/4B/24B (`vllm_service.py`) |
| **Voxtral (cloud)** | Mistral API (`voxtral_api_service.py`) |
| **Auth** | Per-key + internal-key API auth (`app/auth.py`, JWT via mana-auth in `app/external_auth.py`) |
| **VRAM** | Shared `vram_manager.py` accountant — coordinated with mana-tts and mana-image-gen so multiple GPU services don't OOM each other |
| **Process supervision** | Windows Scheduled Task `ManaSTT` (AtLogOn) |

## Port: 3020

## Where it runs

| Host | Path on disk | Entrypoint |
|------|--------------|------------|
| Windows GPU server (`192.168.178.11`) | `C:\mana\services\mana-stt\` | `service.pyw` via Scheduled Task `ManaSTT` |

Public URL: `https://gpu-stt.mana.how` (via Cloudflare Tunnel + Mac Mini gpu-proxy).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + which backends are loaded |
| GET | `/models` | Available STT models |
| POST | `/transcribe` | Whisper (WhisperX, default) — multipart `file` + optional `language` |
| POST | `/transcribe/voxtral` | Local Voxtral via vLLM |
| POST | `/transcribe/auto` | Routing helper — picks the best backend for the input |

All endpoints (except `/health`) require `Authorization: Bearer <token>`. Tokens are validated against `API_KEYS` (per-app keys) or `INTERNAL_API_KEY` (no rate limit), and JWTs from mana-auth are also accepted via `external_auth.py`.

## Backends (`app/`)

| File | What it loads |
|------|---------------|
| `whisper_service.py` | WhisperX on CUDA (large-v3 + alignment + pyannote diarization) |
| `voxtral_service.py` | Local Voxtral via vLLM (slower start, richer multilingual) |
| `voxtral_api_service.py` | Mistral hosted Voxtral API (cloud, no GPU needed) |
| `vllm_service.py` | vLLM client primitives shared by Voxtral |
| `vram_manager.py` | Shared VRAM accounting — same module also used by mana-tts and mana-image-gen |
| `auth.py` | API-key auth (internal + per-app keys) |
| `external_auth.py` | JWT validation via mana-auth |

Backends are loaded lazily during the FastAPI lifespan and reported by `/health`.

## Configuration (`.env` on the Windows GPU box)

```env
PORT=3020
WHISPER_MODEL=large-v3
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
WHISPER_DEFAULT_LANGUAGE=de
PRELOAD_MODELS=true
USE_VLLM=false
HF_TOKEN=...                    # required for pyannote diarization models
REQUIRE_AUTH=true
API_KEYS=sk-app1:app1,sk-app2:app2
INTERNAL_API_KEY=...            # cross-service, no rate limit
CORS_ORIGINS=https://mana.how,https://chat.mana.how
```

## Operations

```powershell
# Status
Get-ScheduledTask -TaskName "ManaSTT" | Format-List TaskName, State
Get-NetTCPConnection -LocalPort 3020 -State Listen

# Restart
Stop-ScheduledTask -TaskName "ManaSTT"
Start-ScheduledTask -TaskName "ManaSTT"

# Logs
Get-Content C:\mana\services\mana-stt\service.log -Tail 50
```

## Reference

- `docs/WINDOWS_GPU_SERVER_SETUP.md` — Windows box setup, scheduled tasks, firewall, Cloudflare tunnel
- `docs/LOCAL_STT_MODELS.md` — model comparisons (WER, latency, language coverage)
- `services/mana-stt/grafana-dashboard.json` — Prometheus metrics dashboard
