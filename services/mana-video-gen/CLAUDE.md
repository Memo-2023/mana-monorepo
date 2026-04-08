# CLAUDE.md - Mana Video Generation Service

## Service Overview

AI video generation microservice using LTX-Video via HuggingFace diffusers:

- **Port**: 3026
- **Framework**: Python + FastAPI
- **Model**: LTX-Video (~2B params, Lightricks)
- **Backend**: diffusers + PyTorch CUDA
- **Target Hardware**: NVIDIA RTX 3090 (24 GB VRAM)

## Features

- **Fast generation**: 10-30 seconds per clip on RTX 3090
- **Text-to-video**: 480p-720p, up to ~6 seconds
- **Low VRAM**: ~10 GB — leaves room for other GPU services
- **Lazy model loading**: Model loads on first request, stays in VRAM
- **VRAM management**: POST /unload to free GPU memory for other services
- **MP4 output**: Direct video file serving

## Commands

```bash
# Setup (installs PyTorch CUDA + diffusers + LTX-Video)
chmod +x setup.sh && ./setup.sh

# Development
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3026 --reload

# Test
curl http://localhost:3026/health
curl -X POST http://localhost:3026/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat walking in a garden"}' | jq

# Free VRAM (e.g. before running image generation)
curl -X POST http://localhost:3026/unload
```

## File Structure

```
services/mana-video-gen/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI endpoints
│   └── ltx_service.py       # LTX-Video diffusers pipeline
├── setup.sh                 # Setup script (CUDA + Python deps)
├── requirements.txt
├── .env.example
└── CLAUDE.md
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check + GPU info |
| `/models` | GET | Model info |
| `/generate` | POST | Generate video from text prompt |
| `/videos/{filename}` | GET | Serve generated video |
| `/videos/{filename}` | DELETE | Delete video |
| `/unload` | POST | Unload model, free VRAM |
| `/cleanup` | POST | Clean old videos |

## Generate Request

```json
{
  "prompt": "A timelapse of a flower blooming",
  "negative_prompt": "blurry, low quality",
  "width": 704,
  "height": 480,
  "num_frames": 81,
  "fps": 25,
  "steps": 30,
  "guidance_scale": 7.5,
  "seed": null
}
```

## Generate Response

```json
{
  "success": true,
  "video_url": "/videos/abc123.mp4",
  "prompt": "A timelapse of a flower blooming",
  "width": 704,
  "height": 480,
  "num_frames": 81,
  "fps": 25,
  "duration": 3.24,
  "steps": 30,
  "seed": 42,
  "generation_time": 18.5
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3026` | Service port |
| `LTX_MODEL_ID` | `Lightricks/LTX-Video` | HuggingFace model ID |
| `DEVICE` | `cuda` | PyTorch device |
| `DEFAULT_WIDTH` | `704` | Default video width |
| `DEFAULT_HEIGHT` | `480` | Default video height |
| `DEFAULT_NUM_FRAMES` | `81` | Default frame count (~3.2s) |
| `DEFAULT_FPS` | `25` | Default framerate |
| `DEFAULT_STEPS` | `30` | Default inference steps |
| `DEFAULT_GUIDANCE_SCALE` | `7.5` | Default CFG scale |
| `GENERATION_TIMEOUT` | `600` | Timeout in seconds |
| `MAX_PROMPT_LENGTH` | `2000` | Max prompt chars |
| `MAX_FRAMES` | `161` | Max frames (~6.4s) |
| `CORS_ORIGINS` | (production URLs) | CORS config |

## Model Details

### LTX-Video

- **Parameters**: ~2 billion
- **License**: Lightricks Open License (commercial use allowed)
- **Download size**: ~4 GB (auto-downloaded on first use)
- **VRAM usage**: ~10 GB
- **Optimal settings**: 704x480, 30 steps, 7.5 guidance
- **Speed on RTX 3090**: 10-30 seconds per clip

## VRAM Management

The GPU server runs multiple AI services. LTX-Video uses ~10 GB VRAM:

- Model loads lazily on first `/generate` request
- Use `POST /unload` to free VRAM when not generating videos
- Other services (mana-image-gen, mana-stt, mana-tts) share the same GPU
- `enable_model_cpu_offload()` moves unused layers to CPU automatically

## Performance (RTX 3090)

| Resolution | Frames | Steps | Time |
|------------|--------|-------|------|
| 512x320 | 41 | 20 | ~8s |
| 704x480 | 81 | 30 | ~20s |
| 704x480 | 41 | 20 | ~10s |
| 1280x720 | 41 | 30 | ~45s |

## Integration

Used by:
- **Picture App** — video generation alongside images
- **Chat App** — inline video generation

### Example (TypeScript)

```typescript
const response = await fetch('http://192.168.178.11:3026/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Ocean waves crashing on rocks at sunset',
    width: 704,
    height: 480,
    num_frames: 81,
  }),
});

const result = await response.json();
const videoUrl = `http://192.168.178.11:3026${result.video_url}`;
```
