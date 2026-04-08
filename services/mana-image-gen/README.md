# Mana Image Generation Service

Local AI image generation using **FLUX.2 klein 4B** model via flux2.c.

## Features

- **Fast**: Sub-second generation on Apple Silicon
- **Efficient**: ~4-5 GB RAM (memory-mapped weights)
- **Open**: Apache 2.0 license (commercial use)
- **Local**: 100% on-device, no API keys needed

## Requirements

- macOS with Apple Silicon (M1/M2/M3/M4)
- 16 GB RAM minimum
- ~20 GB disk space (model + binary)
- Python 3.11+

## Quick Start

```bash
# 1. Run setup (installs flux2.c + downloads model)
./setup.sh

# 2. Start the service
source .venv/bin/activate
FLUX_BINARY=/opt/flux2/flux FLUX_MODEL_DIR=/opt/flux2/model \
  uvicorn app.main:app --host 0.0.0.0 --port 3025

# 3. Generate an image
curl -X POST http://localhost:3025/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat wearing sunglasses"}' | jq
```

## API

### Generate Image

```bash
POST /generate
Content-Type: application/json

{
  "prompt": "A beautiful mountain landscape",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": -1,
  "output_format": "png"
}
```

Response:
```json
{
  "success": true,
  "image_url": "/images/abc123.png",
  "prompt": "A beautiful mountain landscape",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 42,
  "generation_time": 0.85
}
```

### Get Image

```bash
GET /images/{filename}
```

### Health Check

```bash
GET /health
```

### Model Info

```bash
GET /models
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3025` | Service port |
| `FLUX_BINARY` | `/opt/flux2/flux` | flux2.c binary path |
| `FLUX_MODEL_DIR` | `/opt/flux2/model` | Model weights path |
| `DEFAULT_STEPS` | `4` | Sampling steps |
| `DEFAULT_WIDTH` | `1024` | Default width |
| `DEFAULT_HEIGHT` | `1024` | Default height |

## Model

**FLUX.2 klein 4B** by Black Forest Labs (January 2026)

- 4 billion parameters
- Apache 2.0 license
- Optimized for 4 sampling steps
- Sub-second inference on consumer GPUs

## Credits

- [flux2.c](https://github.com/antirez/flux2.c) - Pure C implementation by antirez
- [Black Forest Labs](https://bfl.ai) - FLUX.2 model
