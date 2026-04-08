# mana-image-gen

AI image generation microservice using FLUX models via HuggingFace `diffusers` on NVIDIA CUDA. Lives on the Windows GPU server (`mana-server-gpu`, RTX 3090).

> ⚠️ **Earlier history**: this directory used to contain a Mac Mini–only
> implementation built on `flux2.c` (MPS, Apple Silicon arm64). That
> version was removed when the service moved fully onto the Windows GPU.
> If you're looking for the old code, see git history before this commit.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Python 3.11 + uvicorn (Windows) |
| **Framework** | FastAPI |
| **Inference** | HuggingFace `diffusers` + PyTorch CUDA |
| **Default model** | FLUX.1-schnell (BFL, Apache 2.0, 4-step distilled) |
| **GPU** | NVIDIA RTX 3090 (24 GB VRAM) |
| **Auth** | `GPU_API_KEY` middleware (`app/api_auth.py`) |
| **Process supervision** | Windows Scheduled Task `ManaImageGen` (AtLogOn) |

## Port: 3023

## Where it runs

| Host | Path on disk | Entrypoint |
|------|--------------|------------|
| Windows GPU server (`192.168.178.11`) | `C:\mana\services\mana-image-gen\` | `service.pyw` via Scheduled Task `ManaImageGen` |

The service is exposed publicly via Cloudflare Tunnel + the Mac Mini TCP-proxy (`gpu-proxy.py`):

```
Internet → Cloudflare → Mac Mini (gpu-proxy.py) → 192.168.178.11:3023
```

Public URL: `https://gpu-img.mana.how`

## Quick Start (Windows GPU)

```powershell
# As tills on mana-server-gpu
cd C:\mana\services\mana-image-gen
C:\mana\venvs\image-gen\Scripts\python.exe service.pyw

# Or kick the scheduled task
Start-ScheduledTask -TaskName "ManaImageGen"

# Health
curl http://localhost:3023/health
```

The Scheduled Task runs:
```
Execute:    C:\mana\venvs\image-gen\Scripts\python.exe
Arguments:  C:\mana\services\mana-image-gen\service.pyw
WorkingDir: C:\mana\services\mana-image-gen
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + GPU + model status |
| GET | `/models` | Loaded model info |
| POST | `/generate` | Generate an image (returns `{image_url, ...}`) |
| GET | `/images/{filename}` | Serve a generated image |
| DELETE | `/images/{filename}` | Delete a generated image |
| POST | `/cleanup?max_age_hours=24` | Sweep old images |

All non-health endpoints are gated by `ApiKeyMiddleware` — clients must send `Authorization: Bearer $GPU_API_KEY` (header name and verification details in `app/api_auth.py`).

### Generate request

```json
{
  "prompt": "A futuristic city skyline at sunset",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": -1
}
```

## Code layout

```
services/mana-image-gen/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI endpoints
│   ├── flux_service.py    # diffusers pipeline + generate_image()
│   ├── api_auth.py        # ApiKeyMiddleware (GPU_API_KEY)
│   └── vram_manager.py    # shared VRAM accounting helper
└── service.pyw            # Windows runner (used by Scheduled Task)
```

## Configuration (`.env` on the Windows GPU box)

```env
PORT=3023
IMAGE_MODEL_ID=black-forest-labs/FLUX.1-schnell
DEFAULT_STEPS=4
DEFAULT_WIDTH=1024
DEFAULT_HEIGHT=1024
MAX_STEPS=8
GUIDANCE_SCALE=0.0
GENERATION_TIMEOUT=120
OUTPUT_DIR=C:\mana\services\mana-image-gen\outputs
CORS_ORIGINS=https://mana.how,https://chat.mana.how
GPU_API_KEY=...                # cross-service auth, also used by mana-llm
```

The `service.pyw` runner loads `.env` from the service directory before
starting uvicorn.

## Operations

```powershell
# Status
Get-ScheduledTask -TaskName "ManaImageGen" | Format-List TaskName, State
Get-NetTCPConnection -LocalPort 3023 -State Listen

# Restart
Stop-ScheduledTask -TaskName "ManaImageGen"
Start-ScheduledTask -TaskName "ManaImageGen"

# Logs
Get-Content C:\mana\services\mana-image-gen\service.log -Tail 50
```

## Model details

| Field | Value |
|-------|-------|
| Model | `black-forest-labs/FLUX.1-schnell` |
| Parameters | ~12B |
| License | Apache 2.0 (commercial use OK) |
| Weights size | ~24 GB on disk |
| VRAM footprint | ~12 GB (with the default precision/optimization settings) |
| Optimal sampling steps | 4 (distilled "schnell" variant) |
| HuggingFace gate | Requires HF login + license accept |

## Reference

- `docs/WINDOWS_GPU_SERVER_SETUP.md` — full Windows GPU box setup, all
  AI services, scheduled task setup, firewall rules, Cloudflare tunnel
- `docs/PORT_SCHEMA.md` — port assignments across services
