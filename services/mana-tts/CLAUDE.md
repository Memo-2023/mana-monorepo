# mana-tts

Text-to-Speech microservice. Wraps Kokoro (English presets), Piper (German, local ONNX), and F5-TTS (voice cloning) behind a small FastAPI surface. Lives on the Windows GPU server (`mana-server-gpu`, RTX 3090).

> ⚠️ **Earlier history**: this directory used to contain MLX-optimized
> Mac-Mini code (`f5-tts-mlx`, `mlx-audio`, `setup.sh` with Apple Silicon
> checks, `com.mana.mana-tts.plist` launchd setup). All of that moved to
> the Windows GPU box and was removed from the repo. If you need the
> MLX path, see git history.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Python 3.11 + uvicorn (Windows) |
| **Framework** | FastAPI |
| **English (preset)** | Kokoro-82M (`kokoro_service.py`) |
| **German (local)** | Piper ONNX with `kerstin_low.onnx` and `thorsten_medium.onnx` voices (`piper_service.py`) |
| **Voice cloning** | F5-TTS on CUDA (`f5_service.py`) |
| **Audio I/O** | `soundfile`, `pydub` |
| **Auth** | Per-key + internal-key API auth (`auth.py`) + JWT via mana-auth (`external_auth.py`) |
| **VRAM** | Shared `vram_manager.py` (same module as mana-stt + mana-image-gen) |
| **Process supervision** | Windows Scheduled Task `ManaTTS` (AtLogOn) |

## Port: 3022

## Where it runs

| Host | Path on disk | Entrypoint |
|------|--------------|------------|
| Windows GPU server (`192.168.178.11`) | `C:\mana\services\mana-tts\` | `service.pyw` via Scheduled Task `ManaTTS` |

Public URL: `https://gpu-tts.mana.how`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + which backends are loaded |
| GET | `/models` | Available TTS models |
| GET | `/voices` | List all voices (preset + custom) |
| POST | `/voices` | Register a custom voice (reference audio + transcript) |
| DELETE | `/voices/{voice_id}` | Delete a custom voice |
| POST | `/synthesize/kokoro` | Kokoro synthesis (English presets) |
| POST | `/synthesize` | F5-TTS voice cloning |
| POST | `/synthesize/auto` | Routing helper — picks the right backend for the requested voice |

All non-health endpoints require `Authorization: Bearer <token>` (per-app key, internal key, or mana-auth JWT).

## Voices

### Kokoro-82M (English presets)
~300 MB download. 30+ preset English voices. Fast, no reference audio needed.

### Piper (German, local ONNX)
~63 MB per voice. 100% local, GDPR-compliant. Available:
- `de_kerstin` (female, default)
- `de_thorsten` (male)

Fallback to Edge TTS cloud voices if Piper isn't loaded.

### F5-TTS (voice cloning)
~6 GB. Requires reference audio + transcript. Higher quality, slower. Custom voices live in `voices/` (reference audio + transcript per voice ID).

## Configuration (`.env` on the Windows GPU box)

```env
PORT=3022
PRELOAD_MODELS=false
MAX_TEXT_LENGTH=1000
REQUIRE_AUTH=true
API_KEYS=sk-app1:app1,sk-app2:app2
INTERNAL_API_KEY=...
CORS_ORIGINS=https://mana.how,https://chat.mana.how
```

## Code layout

```
services/mana-tts/
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI endpoints
│   ├── kokoro_service.py   # Kokoro (English presets)
│   ├── piper_service.py    # Piper (German, local ONNX)
│   ├── f5_service.py       # F5-TTS (voice cloning, CUDA)
│   ├── voice_manager.py    # Custom voice registry
│   ├── audio_utils.py      # Format conversion, resampling
│   ├── auth.py             # API-key auth
│   ├── external_auth.py    # JWT validation via mana-auth
│   └── vram_manager.py     # Shared VRAM accountant
└── service.pyw             # Windows runner (used by ManaTTS scheduled task)
```

The Piper voice ONNX files live alongside the service on the GPU box (`C:\mana\services\mana-tts\piper_voices\*.onnx`) — too big to commit, downloaded once during setup.

## Operations

```powershell
# Status
Get-ScheduledTask -TaskName "ManaTTS" | Format-List TaskName, State
Get-NetTCPConnection -LocalPort 3022 -State Listen

# Restart
Stop-ScheduledTask -TaskName "ManaTTS"
Start-ScheduledTask -TaskName "ManaTTS"

# Logs
Get-Content C:\mana\services\mana-tts\service.log -Tail 50
```

## Reference

- `docs/WINDOWS_GPU_SERVER_SETUP.md` — Windows box setup, scheduled tasks, firewall, Cloudflare tunnel
- `docs/PORT_SCHEMA.md` — port assignments across services
