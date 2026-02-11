# ManaCore STT Service

Speech-to-Text API service with **Whisper (Lightning MLX)** and **Voxtral (Mistral API)**.

Optimized for Mac Mini M4 (Apple Silicon).

## Architecture

```
                    ┌─────────────────────┐
                    │   mana-stt (3020)   │
                    │    FastAPI          │
                    └─────────┬───────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Whisper    │  │  Voxtral API │  │   vLLM       │
    │  MLX (Local) │  │  (Mistral)   │  │ (Optional)   │
    └──────────────┘  └──────────────┘  └──────────────┘
```

## Features

- **Whisper Large V3** - Best quality, 99+ languages, German WER 6-9% (local, MLX)
- **Voxtral Mini** - Mistral API, speaker diarization support (cloud)
- **Apple Silicon Optimized** - Uses MLX for fast local inference
- **Automatic Fallback** - Falls back between backends automatically
- **REST API** - Simple HTTP endpoints for integration

## Quick Start

### Installation

```bash
cd services/mana-stt
./setup.sh
```

### Run Locally

```bash
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3020
```

### Setup as System Service (Mac Mini)

```bash
./scripts/mac-mini/setup-stt.sh
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/models` | GET | List available models |
| `/transcribe` | POST | Whisper transcription |
| `/transcribe/voxtral` | POST | Voxtral transcription |
| `/transcribe/auto` | POST | Auto-select best model |

## Usage Examples

### Transcribe with Whisper (Recommended)

```bash
curl -X POST http://localhost:3020/transcribe \
  -F "file=@recording.mp3" \
  -F "language=de"
```

Response:
```json
{
  "text": "Das ist ein Beispieltext...",
  "language": "de",
  "model": "whisper-large-v3-turbo"
}
```

### Transcribe with Voxtral

```bash
curl -X POST http://localhost:3020/transcribe/voxtral \
  -F "file=@recording.mp3" \
  -F "language=de"
```

### Auto-Select Model

```bash
curl -X POST http://localhost:3020/transcribe/auto \
  -F "file=@recording.mp3" \
  -F "prefer=whisper"
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3020` | API server port |
| `WHISPER_MODEL` | `large-v3` | Default Whisper model |
| `PRELOAD_MODELS` | `false` | Load models on startup |
| `CORS_ORIGINS` | `https://mana.how,...` | Allowed CORS origins |
| `MISTRAL_API_KEY` | - | Required for Voxtral API |
| `USE_VLLM` | `false` | Enable vLLM backend (experimental) |
| `VLLM_URL` | `http://localhost:8100` | vLLM server URL |

## Supported Audio Formats

- MP3, WAV, M4A, FLAC, OGG, WebM, MP4
- Max file size: 100MB
- Any sample rate (automatically resampled to 16kHz)

## Model Comparison

| Model | German WER | Speed | VRAM | License |
|-------|------------|-------|------|---------|
| Whisper Large V3 Turbo | 6-9% | Fast | ~6 GB | MIT |
| Voxtral Mini (3B) | 8-12% | Medium | ~4 GB | Apache 2.0 |

## Logs

```bash
# Service logs
tail -f /tmp/manacore-stt.log

# Error logs
tail -f /tmp/manacore-stt.error.log
```

## Troubleshooting

### Model Download Slow

First run downloads ~1.6 GB for Whisper and ~6 GB for Voxtral. Be patient.

### Out of Memory

Reduce batch size or use smaller model:
```bash
export WHISPER_MODEL=medium
```

### MPS Not Available

Ensure PyTorch is installed with MPS support:
```bash
pip install torch torchvision torchaudio
python -c "import torch; print(torch.backends.mps.is_available())"
```

## Integration

### From Chat Backend (NestJS)

```typescript
const formData = new FormData();
formData.append('file', audioBuffer, 'recording.webm');
formData.append('language', 'de');

const response = await fetch('http://localhost:3020/transcribe', {
  method: 'POST',
  body: formData,
});

const { text } = await response.json();
```

### From SvelteKit Web

```typescript
const formData = new FormData();
formData.append('file', audioBlob, 'recording.webm');

const response = await fetch('https://stt-api.mana.how/transcribe', {
  method: 'POST',
  body: formData,
});

const { text } = await response.json();
```
