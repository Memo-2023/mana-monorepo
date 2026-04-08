# Mana STT Service

Speech-to-Text API service running on the Windows GPU server (`mana-server-gpu`, RTX 3090). Wraps **WhisperX** (CUDA, large-v3 + word alignment + pyannote diarization), local **Voxtral via vLLM**, and the hosted **Mistral Voxtral API**.

For architecture, deployment, configuration, and operations see [`CLAUDE.md`](./CLAUDE.md) and [`docs/WINDOWS_GPU_SERVER_SETUP.md`](../../docs/WINDOWS_GPU_SERVER_SETUP.md).

## Port: 3020

## Public URL

`https://gpu-stt.mana.how` (via Cloudflare Tunnel + Mac Mini gpu-proxy)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check + which backends are loaded |
| `/models` | GET | List available models |
| `/transcribe` | POST | Whisper / WhisperX transcription |
| `/transcribe/voxtral` | POST | Voxtral transcription (local vLLM) |
| `/transcribe/auto` | POST | Auto-select best backend for the input |

All endpoints (except `/health`) require `Authorization: Bearer <token>`.

## Quick Test

```bash
curl -F "file=@audio.wav" -F "language=de" \
  -H "Authorization: Bearer $INTERNAL_API_KEY" \
  https://gpu-stt.mana.how/transcribe
```
