# CLAUDE.md - Mana Voice Bot

## Service Overview

German voice-to-voice assistant combining:
- **STT**: Whisper via mana-stt (Port 3020)
- **LLM**: Ollama with Gemma/Qwen (Port 11434)
- **TTS**: Edge TTS (Microsoft, cloud API)

**Port**: 3050

## Architecture

```
Audio Input → Whisper (STT) → Ollama (LLM) → Edge TTS → Audio Output
     ↓              ↓              ↓              ↓
  [WAV/MP3]    [German Text]  [Response]     [MP3 Audio]
```

## Commands

```bash
# Setup
./setup.sh

# Development
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3050 --reload

# Production
./start.sh

# Test
curl http://localhost:3050/health
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/voices` | GET | List German TTS voices |
| `/models` | GET | List available Ollama models |
| `/transcribe` | POST | Audio → Text (STT only) |
| `/chat` | POST | Text → Text (LLM only) |
| `/chat/audio` | POST | Text → Audio (LLM + TTS) |
| `/tts` | POST | Text → Audio (TTS only) |
| `/voice` | POST | Audio → Audio (Full pipeline) |
| `/voice/metadata` | POST | Audio → JSON (Full pipeline, no audio) |

## Usage Examples

### Full Voice Pipeline
```bash
# Record audio and send to voice bot
curl -X POST http://localhost:3050/voice \
  -F "audio=@input.wav" \
  -F "model=gemma3:4b" \
  -F "voice=de-DE-ConradNeural" \
  -o response.mp3
```

### Text to Audio
```bash
curl -X POST http://localhost:3050/chat/audio \
  -H "Content-Type: application/json" \
  -d '{"message": "Was ist die Hauptstadt von Deutschland?", "voice": "de-DE-KatjaNeural"}' \
  -o response.mp3
```

### TTS Only
```bash
curl -X POST http://localhost:3050/tts \
  -F "text=Hallo, wie geht es dir?" \
  -F "voice=de-DE-ConradNeural" \
  -o hello.mp3
```

## German Voices

| Voice ID | Description |
|----------|-------------|
| `de-DE-ConradNeural` | Male - Professional (Default) |
| `de-DE-KatjaNeural` | Female - Natural |
| `de-DE-AmalaNeural` | Female - Friendly |
| `de-DE-BerndNeural` | Male - Calm |
| `de-DE-ChristophNeural` | Male - News |
| `de-DE-ElkeNeural` | Female - Warm |
| `de-DE-KillianNeural` | Male - Casual |
| `de-DE-KlarissaNeural` | Female - Cheerful |
| `de-DE-KlausNeural` | Male - Storyteller |
| `de-DE-LouisaNeural` | Female - Assistant |
| `de-DE-TanjaNeural` | Female - Business |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3050` | Service port |
| `STT_URL` | `http://localhost:3020` | mana-stt URL |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama URL |
| `DEFAULT_MODEL` | `gemma3:4b` | Default LLM model |
| `DEFAULT_VOICE` | `de-DE-ConradNeural` | Default TTS voice |
| `SYSTEM_PROMPT` | (German assistant) | LLM system prompt |

## Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `aiohttp` - Async HTTP client
- `edge-tts` - Microsoft TTS
- `python-multipart` - File uploads

## Performance

Typical latency breakdown:
- STT (Whisper): 0.5-2s
- LLM (Gemma 4B): 1-5s
- TTS (Edge): 0.3-0.5s
- **Total**: 2-7s

## Mac Mini Deployment

```bash
# On Mac Mini
cd ~/projects/manacore-monorepo/services/mana-voice-bot
./setup.sh
./start.sh

# Or with launchd (autostart)
# See scripts/mac-mini/setup-voice-bot.sh
```
