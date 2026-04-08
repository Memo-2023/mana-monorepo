# Mana Image Generation Service

AI image generation via **FLUX.1-schnell** (HuggingFace `diffusers` + PyTorch CUDA). Runs on the Windows GPU server (`mana-server-gpu`, NVIDIA RTX 3090).

For architecture, deployment, and operations, see [`CLAUDE.md`](./CLAUDE.md) and [`docs/WINDOWS_GPU_SERVER_SETUP.md`](../../docs/WINDOWS_GPU_SERVER_SETUP.md).

## Port: 3023

## Public URL

`https://gpu-img.mana.how` (via Cloudflare Tunnel + Mac Mini gpu-proxy)

## Quickly

```bash
curl https://gpu-img.mana.how/health

curl -X POST https://gpu-img.mana.how/generate \
  -H "Authorization: Bearer $GPU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A serene mountain lake at dawn","width":1024,"height":1024,"steps":4}'
```

## Model

| Field | Value |
|-------|-------|
| Model | `black-forest-labs/FLUX.1-schnell` |
| License | Apache 2.0 |
| Sampling | 4 steps (distilled) |
| VRAM | ~12 GB |
