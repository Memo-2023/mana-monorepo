# Mana TTS

Text-to-Speech microservice with voice cloning support, optimized for Apple Silicon.

## Features

- **Kokoro TTS**: Fast preset voices (~300 MB model)
- **F5-TTS**: Voice cloning with reference audio (~6 GB model)
- **MLX Optimized**: Runs efficiently on Apple Silicon
- **REST API**: FastAPI with OpenAPI documentation

## Quick Start

### Setup

```bash
# Run setup script
./setup.sh

# Or manually
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Start Service

```bash
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3022
```

### Test

```bash
# Health check
curl http://localhost:3022/health

# Synthesize with Kokoro
curl -X POST http://localhost:3022/synthesize/kokoro \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice": "af_heart"}' \
  --output test.wav

# Play audio (macOS)
afplay test.wav
```

## API Endpoints

### Health & Info

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/models` | GET | Available models |
| `/voices` | GET | All available voices |

### Synthesis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/synthesize/kokoro` | POST | Kokoro preset voices |
| `/synthesize` | POST | F5-TTS voice cloning |
| `/synthesize/auto` | POST | Auto-select model |

### Voice Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/voices` | POST | Register custom voice |
| `/voices/{id}` | DELETE | Delete custom voice |

## Synthesis Examples

### Kokoro (Fast Preset Voices)

```bash
curl -X POST http://localhost:3022/synthesize/kokoro \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to Mana TTS, your personal voice synthesis service.",
    "voice": "af_heart",
    "speed": 1.0,
    "output_format": "wav"
  }' \
  --output output.wav
```

### F5-TTS (Voice Cloning)

```bash
# With reference audio upload
curl -X POST http://localhost:3022/synthesize \
  -F "text=Hello, this is a cloned voice speaking." \
  -F "reference_audio=@reference.wav" \
  -F "reference_text=This is what the reference audio says." \
  -F "output_format=wav" \
  --output cloned.wav

# With registered voice
curl -X POST http://localhost:3022/synthesize \
  -F "text=Hello from my registered voice." \
  -F "voice_id=my_custom_voice" \
  --output output.wav
```

### Auto-Select

```bash
# Uses Kokoro for preset voices, F5-TTS for custom
curl -X POST http://localhost:3022/synthesize/auto \
  -H "Content-Type: application/json" \
  -d '{"text": "Auto-selected synthesis", "voice": "af_bella"}' \
  --output output.wav
```

## Available Kokoro Voices

### American Female
- `af_heart` - Warm, emotional (default)
- `af_alloy` - Neutral, professional
- `af_bella` - Friendly, approachable
- `af_jessica` - Confident, clear
- `af_nicole` - Bright, energetic
- `af_nova` - Modern, dynamic
- `af_sarah` - Warm, conversational
- ... and more

### American Male
- `am_adam` - Deep, authoritative
- `am_echo` - Resonant, clear
- `am_eric` - Professional, neutral
- `am_michael` - Warm, trustworthy
- ... and more

### British Female
- `bf_alice` - Refined, elegant
- `bf_emma` - Clear, professional
- `bf_lily` - Soft, gentle

### British Male
- `bm_daniel` - Classic, authoritative
- `bm_fable` - Storyteller, expressive
- `bm_george` - Traditional, clear

## Voice Registration

Register a custom voice for F5-TTS voice cloning:

```bash
curl -X POST http://localhost:3022/voices \
  -F "voice_id=my_voice" \
  -F "name=My Custom Voice" \
  -F "description=A sample voice for testing" \
  -F "transcript=Hello, this is the text spoken in the reference audio." \
  -F "reference_audio=@my_reference.wav"
```

Pre-defined voices can also be placed in the `voices/` directory:

```
voices/
└── my_voice/
    ├── reference.wav       # Reference audio (required)
    ├── transcript.txt      # Transcript of reference (required)
    └── metadata.json       # Name and description (optional)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3022` | API port |
| `PRELOAD_MODELS` | `false` | Load models on startup |
| `MAX_TEXT_LENGTH` | `1000` | Max characters per request |
| `CORS_ORIGINS` | `https://mana.how,...` | Allowed CORS origins |
| `F5_MODEL` | `lucasnewman/f5-tts-mlx` | F5-TTS model |
| `KOKORO_MODEL` | `mlx-community/Kokoro-82M-bf16` | Kokoro model |

## Mac Mini Deployment

```bash
# Install and start as launchd service
../../scripts/mac-mini/setup-tts.sh

# Service management
launchctl list | grep com.mana.tts
launchctl unload ~/Library/LaunchAgents/com.mana.tts.plist
launchctl load ~/Library/LaunchAgents/com.mana.tts.plist

# View logs
tail -f /tmp/mana-tts.log
```

## Requirements

- Python 3.10+
- macOS with Apple Silicon (recommended)
- ~7 GB disk space for models
- 16 GB RAM recommended
- ffmpeg (for MP3 output)

## Troubleshooting

### Models Not Loading

```bash
# Check MLX installation
python -c "import mlx; print(mlx.__version__)"

# Check mlx-audio
python -c "import mlx_audio; print('OK')"

# Check f5-tts-mlx
python -c "from f5_tts_mlx import F5TTS; print('OK')"
```

### MP3 Output Not Working

```bash
# Install ffmpeg
brew install ffmpeg

# Verify
ffmpeg -version
```

### Memory Issues

- Reduce `MAX_TEXT_LENGTH` for less memory usage
- Set `PRELOAD_MODELS=false` for lazy loading
- F5-TTS requires ~6 GB, Kokoro ~500 MB

## API Documentation

When running, visit http://localhost:3022/docs for interactive API documentation.
