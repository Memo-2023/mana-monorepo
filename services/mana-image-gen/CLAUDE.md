# CLAUDE.md - Mana Image Generation Service

## Service Overview

AI image generation microservice using FLUX.2 klein 4B model via flux2.c:

- **Port**: 3025
- **Host**: Mac Mini only — `setup.sh` hard-fails on anything other than macOS arm64
- **Framework**: Python + FastAPI
- **Model**: FLUX.2 klein 4B (Black Forest Labs)
- **Backend**: flux2.c (Pure C, MPS accelerated)

> ⚠️ **Two image-gen services exist with the same name.** This one is the
> Mac Mini implementation in the repo (flux2.c, MPS, Apple Silicon only).
> The Windows GPU server runs a *separate* image-gen on `gpu-img.mana.how`
> (port 3023, PyTorch + diffusers + CUDA) whose code lives outside the
> repo at `C:\mana\services\mana-image-gen\` on the GPU box. See
> `docs/WINDOWS_GPU_SERVER_SETUP.md` for that one.

## Features

- **Sub-second generation** on Apple Silicon (M4)
- **Memory efficient**: ~4-5 GB RAM usage (memory-mapped weights)
- **Apache 2.0 license**: Commercially usable
- **4 sampling steps**: Optimized for speed
- **1024x1024 default resolution**

## Commands

```bash
# Setup (installs flux2.c + downloads model)
./setup.sh

# Development
source .venv/bin/activate
FLUX_BINARY=/opt/flux2/flux FLUX_MODEL_DIR=/opt/flux2/model \
  uvicorn app.main:app --host 0.0.0.0 --port 3025 --reload

# Production
../../scripts/mac-mini/setup-image-gen.sh

# Test
curl http://localhost:3025/health
curl -X POST http://localhost:3025/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat in space"}' | jq
```

## File Structure

```
services/mana-image-gen/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI endpoints
│   └── flux_service.py      # flux2.c subprocess wrapper
├── setup.sh                 # Setup script
├── requirements.txt
├── CLAUDE.md
└── README.md
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/models` | GET | Model info |
| `/generate` | POST | Generate image |
| `/images/{filename}` | GET | Serve generated image |
| `/images/{filename}` | DELETE | Delete image |
| `/cleanup` | POST | Clean old images |

## Generate Request

```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": -1,
  "output_format": "png"
}
```

## Generate Response

```json
{
  "success": true,
  "image_url": "/images/abc123.png",
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "steps": 4,
  "seed": 42,
  "generation_time": 0.85
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3025` | Service port |
| `FLUX_BINARY` | `/opt/flux2/flux` | Path to flux2.c binary |
| `FLUX_MODEL_DIR` | `/opt/flux2/model` | Path to model weights |
| `DEFAULT_STEPS` | `4` | Default sampling steps |
| `DEFAULT_WIDTH` | `1024` | Default image width |
| `DEFAULT_HEIGHT` | `1024` | Default image height |
| `GENERATION_TIMEOUT` | `120` | Timeout in seconds |
| `MAX_PROMPT_LENGTH` | `2000` | Max prompt chars |
| `CORS_ORIGINS` | (production URLs) | CORS config |

## Model Details

### FLUX.2 klein 4B

- **Parameters**: 4 billion
- **License**: Apache 2.0 (commercial use allowed)
- **Download size**: ~16 GB
- **RAM usage**: ~4-5 GB (memory-mapped)
- **Optimal steps**: 4 (distilled model)
- **Release**: January 2026

## Integration with Other Apps

The service is designed to be used by:

- **Picture App** (`apps/picture/`) - AI image generation platform
- **Chat App** (`apps/chat/`) - Inline image generation
- **Matrix Bots** - Image generation via chat commands
- **API Gateway** - Public API access

### Example Integration (TypeScript)

```typescript
const response = await fetch('http://localhost:3025/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A futuristic city at night',
    width: 1024,
    height: 1024,
  }),
});

const result = await response.json();
const imageUrl = `http://localhost:3025${result.image_url}`;
```

## Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pillow` - Image processing
- `flux2.c` - Native binary (installed separately)

## Performance

On Mac Mini M4 (16 GB):

| Resolution | Steps | Time |
|------------|-------|------|
| 512x512 | 4 | ~0.3s |
| 1024x1024 | 4 | ~0.8s |
| 1024x1024 | 8 | ~1.5s |

## Troubleshooting

### flux2.c not found
```bash
# Verify installation
ls -la /opt/flux2/flux

# Reinstall
sudo rm -rf /opt/flux2
./setup.sh
```

### Model not found
```bash
# Check model directory
ls -la /opt/flux2/model/

# Re-download
cd /opt/flux2/src
./download-model.sh /opt/flux2/model
```

### Out of memory
- Reduce resolution to 512x512
- Close other applications
- The 16 GB Mac Mini should handle 1024x1024 fine

### Slow generation
- Ensure MPS build was used: `make mps`
- Check Metal GPU is being used
- Reduce steps (4 is optimal for klein)
