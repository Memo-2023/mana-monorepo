# Mana TTS

Text-to-Speech microservice running on the Windows GPU server (`mana-server-gpu`, RTX 3090). Wraps **Kokoro** (English presets), **Piper** (German, local ONNX), and **F5-TTS** (CUDA voice cloning).

For architecture, deployment, configuration, and operations see [`CLAUDE.md`](./CLAUDE.md) and [`docs/WINDOWS_GPU_SERVER_SETUP.md`](../../docs/WINDOWS_GPU_SERVER_SETUP.md).

## Port: 3022

## Public URL

`https://gpu-tts.mana.how` (via Cloudflare Tunnel + Mac Mini gpu-proxy)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check + which backends are loaded |
| `/models` | GET | List available models |
| `/voices` | GET | List preset + custom voices |
| `/voices` | POST | Register a custom voice (reference audio + transcript) |
| `/voices/{id}` | DELETE | Delete a custom voice |
| `/synthesize/kokoro` | POST | Kokoro (English presets) |
| `/synthesize` | POST | F5-TTS voice cloning |
| `/synthesize/auto` | POST | Auto-select best backend for the requested voice |

All non-health endpoints require `Authorization: Bearer <token>`.

## Quick Test

```bash
curl -X POST https://gpu-tts.mana.how/synthesize/kokoro \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"af_heart"}' \
  --output test.wav
```
