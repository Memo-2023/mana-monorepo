# mana-voice-bot

German voice-to-voice assistant. Wires together STT (mana-stt), an LLM (Ollama via mana-llm), and TTS (Edge TTS cloud or mana-tts) into a single end-to-end audio pipeline.

> ⚠️ **Not deployed yet.** This service exists in the repo and runs
> locally for development, but it has no Scheduled Task on the Windows
> GPU server, no launchd plist, no Cloudflare Tunnel hostname, and no
> entry in the production startup scripts. When you're ready to deploy
> it, target the Windows GPU server alongside the other AI services
> (`C:\mana\services\mana-voice-bot\`, Scheduled Task `ManaVoiceBot`,
> `service.pyw` runner, public URL `gpu-voice.mana.how` via the existing
> Mac Mini cloudflared+gpu-proxy chain).

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Python 3.11 + uvicorn |
| **Framework** | FastAPI |
| **STT** | Whisper via mana-stt |
| **LLM** | Ollama via mana-llm (Gemma/Qwen) |
| **TTS** | Edge TTS (Microsoft cloud) — could move to mana-tts later |

## Port: 3024

> The default was `3050` until 2026-04-08. That collided with `mana-sync`
> on the Mac Mini and was a latent footgun for any future deployment
> that put both on the same host. Moved to 3024 to fit in the AI/ML
> port range alongside mana-stt (3020), mana-tts (3022), mana-image-gen
> (3023), and mana-llm (3025).

## Quick Start (local dev)

```bash
cd services/mana-voice-bot
./setup.sh
./start.sh
# or directly:
uvicorn app.main:app --host 0.0.0.0 --port 3024 --reload
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| GET | `/voices` | List German TTS voices |
| GET | `/models` | List available Ollama models |
| POST | `/transcribe` | Audio → text (STT only) |
| POST | `/chat` | Text → text (LLM only) |
| POST | `/chat/audio` | Text → audio (LLM + TTS) |
| POST | `/tts` | Text → audio (TTS only) |
| POST | `/voice` | Audio → audio (full pipeline) |
| POST | `/voice/metadata` | Audio → JSON (full pipeline, no audio response) |

## Pipeline

```
Audio in → Whisper (STT) → Ollama (LLM) → Edge TTS → Audio out
              ↓                  ↓             ↓
         [German text]      [Response]    [MP3 audio]
```

## German Voices

| Voice ID | Description |
|----------|-------------|
| `de-DE-ConradNeural` | Male, professional (default) |
| `de-DE-KatjaNeural` | Female, natural |
| `de-DE-AmalaNeural` | Female, friendly |
| `de-DE-BerndNeural` | Male, calm |
| `de-DE-ChristophNeural` | Male, news |
| `de-DE-ElkeNeural` | Female, warm |
| `de-DE-KillianNeural` | Male, casual |
| `de-DE-KlarissaNeural` | Female, cheerful |
| `de-DE-KlausNeural` | Male, storyteller |
| `de-DE-LouisaNeural` | Female, assistant |
| `de-DE-TanjaNeural` | Female, business |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3024` | Service port |
| `STT_URL` | `http://localhost:3020` | mana-stt URL |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama URL |
| `DEFAULT_MODEL` | `gemma3:4b` | Default LLM model |
| `DEFAULT_VOICE` | `de-DE-ConradNeural` | Default TTS voice |
| `SYSTEM_PROMPT` | (German assistant) | LLM system prompt |

## Performance budget

Typical latency on the GPU server:
- STT (Whisper): 0.5–2 s
- LLM (Gemma 4B): 1–5 s
- TTS (Edge): 0.3–0.5 s
- **Total**: 2–7 s

## When you actually deploy this

1. Copy the directory to `C:\mana\services\mana-voice-bot\` on `mana-server-gpu`
2. Create the venv (`C:\mana\venvs\voice-bot\`) and install requirements
3. Write a `service.pyw` runner mirroring the other AI services (loads `.env`, redirects stdout/stderr to `service.log`, calls `uvicorn.run(... port=3024)`)
4. Create the Windows Scheduled Task `ManaVoiceBot` (AtLogOn) pointing at `service.pyw`
5. Add the firewall rule (`New-NetFirewallRule -DisplayName "Mana-Voice-Bot" -Direction Inbound -LocalPort 3024 -Protocol TCP -Action Allow`)
6. Add the cloudflared route in `cloudflared-config.yml`:
   `- hostname: gpu-voice.mana.how → service: http://192.168.178.11:3024`
7. Update `docs/WINDOWS_GPU_SERVER_SETUP.md` with the new task
