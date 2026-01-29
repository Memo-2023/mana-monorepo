# CLAUDE.md - Mana TTS Service

## Service Overview

Text-to-Speech microservice using MLX-optimized models for Apple Silicon:

- **Port**: 3022
- **Framework**: Python + FastAPI
- **Models**: Kokoro-82M (fast), F5-TTS (voice cloning)

## Commands

```bash
# Setup
./setup.sh

# Development
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3022 --reload

# Production (Mac Mini)
../../scripts/mac-mini/setup-tts.sh

# Test
curl http://localhost:3022/health
curl -X POST http://localhost:3022/synthesize/kokoro \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice": "af_heart"}' \
  --output test.wav
```

## File Structure

```
services/mana-tts/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI endpoints
│   ├── kokoro_service.py    # Kokoro TTS (preset voices)
│   ├── f5_service.py        # F5-TTS (voice cloning)
│   ├── voice_manager.py     # Custom voice registry
│   └── audio_utils.py       # Audio format conversion
├── voices/                  # Custom voice storage
├── mlx_models/             # Model cache
├── setup.sh                # Setup script
├── requirements.txt
└── README.md
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/models` | GET | Model info |
| `/voices` | GET | List all voices |
| `/voices` | POST | Register custom voice |
| `/voices/{id}` | DELETE | Delete custom voice |
| `/synthesize/kokoro` | POST | Kokoro synthesis |
| `/synthesize` | POST | F5-TTS voice cloning |
| `/synthesize/auto` | POST | Auto-select model |

## Models

### Kokoro-82M
- ~300 MB download
- 30+ preset voices
- Fast inference
- No reference audio needed

### F5-TTS
- ~6 GB download
- Voice cloning capability
- Requires reference audio + transcript
- Higher quality, slower

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3022` | Service port |
| `PRELOAD_MODELS` | `false` | Load on startup |
| `MAX_TEXT_LENGTH` | `1000` | Max chars |
| `CORS_ORIGINS` | (production URLs) | CORS config |

## Key Dependencies

- `fastapi` - Web framework
- `f5-tts-mlx` - Voice cloning model
- `mlx-audio` - Kokoro implementation
- `mlx` - Apple Silicon ML framework
- `soundfile` - Audio I/O
- `pydub` - MP3 conversion

## Development Notes

- Models load lazily on first request (unless `PRELOAD_MODELS=true`)
- Custom voices stored in `voices/` with reference audio + transcript
- Singleton pattern for model instances
- Audio returned as raw bytes with headers for metadata
