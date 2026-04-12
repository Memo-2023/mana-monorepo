# `@mana/local-stt` — Browser-Local Speech-to-Text

Client-side speech-to-text that runs **entirely in the user's browser** via WebGPU (WASM fallback). No server roundtrips, no API keys, no audio leaving the device. Uses OpenAI's Whisper models through `@huggingface/transformers` v4 — the same library that powers `@mana/local-llm`.

**Don't confuse this with the server-side STT** (`services/mana-stt`). The server-side service runs Whisper on the GPU server (RTX 3090). This package is the **only** STT path that keeps audio on the user's device.

## What's in the box

| Field | Value |
|---|---|
| Engine library | [`@huggingface/transformers`](https://huggingface.co/docs/transformers.js/index) v4 (transformers.js) |
| Backend | WebGPU (primary), WASM (fallback) |
| Default model | `onnx-community/whisper-tiny` (~150 MB, multilingual) |
| Pipeline | `automatic-speech-recognition` (Whisper encoder-decoder) |
| Audio input | Float32Array, 16 kHz mono PCM |
| Chunking | 30s chunks with 5s stride overlap (handled by the pipeline) |

## Available models

| Key | Model | Size | English WER | Multilingual |
|-----|-------|------|------------|-------------|
| `whisper-tiny` | Whisper Tiny | ~150 MB | ~5.6% | Yes (auto-detect) |
| `whisper-tiny.en` | Whisper Tiny EN | ~150 MB | ~5.6% | No (English only) |
| `whisper-base` | Whisper Base | ~290 MB | ~4.3% | Yes |
| `whisper-base.en` | Whisper Base EN | ~290 MB | ~4.3% | No |
| `whisper-small` | Whisper Small | ~950 MB | ~3.4% | Yes |

Default is `whisper-tiny` — smallest, fastest, multilingual. Users can switch in settings.

## Architecture

Mirrors `@mana/local-llm` exactly:

```
Consumer (Svelte component)
    │
    ▼
svelte.svelte.ts — reactive status ($state), loadLocalStt(), transcribe()
    │
    ▼
engine.ts — main-thread proxy (LocalSttEngine singleton)
    │  postMessage / onmessage
    ▼
worker.ts — Web Worker entry point
    │
    ▼
engine-impl.ts — transformers.js pipeline('automatic-speech-recognition')
    │
    ▼
@huggingface/transformers — ONNX runtime (WebGPU or WASM)
```

The Web Worker isolates the heavy Whisper inference (~3-5s for 60s audio on WebGPU) from the main thread. Audio processing never blocks the UI.

## API surface (Svelte 5 usage)

```svelte
<script lang="ts">
  import {
    getLocalSttStatus,
    loadLocalStt,
    transcribe,
    isLocalSttSupported,
    MODELS,
    DEFAULT_MODEL,
  } from '@mana/local-stt';

  const status = getLocalSttStatus();
  const supported = isLocalSttSupported();

  // Load on-demand (idempotent)
  async function start() {
    await loadLocalStt(DEFAULT_MODEL);
  }

  // Transcribe audio
  let result = $state('');
  async function handleAudio(pcm16k: Float32Array) {
    const out = await transcribe({
      audio: pcm16k,
      language: 'de',
      onChunk: (text) => { result += text; },
    });
    result = out.text;
  }
</script>

{#if !supported}
  <p>WebGPU not available.</p>
{:else if status.current.state === 'downloading'}
  <p>Downloading: {(status.current.progress * 100).toFixed(0)}%</p>
{:else if status.current.state === 'ready'}
  <button onclick={start}>Ready</button>
{/if}
```

Status union: `idle | checking | downloading | loading | ready | error` (same as `@mana/local-llm`).

## Audio input format

The `transcribe()` function expects **Float32Array of 16 kHz mono PCM** samples (values -1.0 to 1.0). The consumer is responsible for:

1. Capturing audio (e.g. `navigator.mediaDevices.getUserMedia`)
2. Extracting raw PCM from the `AudioContext`
3. Resampling to 16 kHz if the mic runs at a different rate (typically 44.1/48 kHz)

The high-level `useLocalStt()` composable in `apps/mana/apps/web/src/lib/components/voice/use-local-stt.svelte.ts` handles all of this automatically.

## High-level composable: `useLocalStt()`

Located at `apps/mana/apps/web/src/lib/components/voice/use-local-stt.svelte.ts`. Combines mic capture + resampling + transcription in one call:

```svelte
<script lang="ts">
  import { useLocalStt } from '$lib/components/voice/use-local-stt.svelte';

  const stt = useLocalStt({ language: 'de' });
  // stt.state   — 'idle' | 'loading' | 'recording' | 'transcribing'
  // stt.text    — final transcribed text
  // stt.partial — streaming partial text (per chunk)
  // stt.error   — error message or null
  // stt.toggle()  — start recording or stop + transcribe
  // stt.cancel()  — abort without transcribing
</script>

<button onclick={() => stt.toggle()}>
  {stt.state === 'recording' ? 'Stop' : 'Record'}
</button>
<p>{stt.text}</p>
```

Audio pipeline inside the composable:

```
getUserMedia (native sample rate, e.g. 48 kHz)
  → AudioContext + ScriptProcessorNode → collect Float32 chunks
  → on stop: merge all chunks + linear resample to 16 kHz mono
  → transcribe() via @mana/local-stt worker
  → text result
```

## UI integration

The QuickInputBar in `(app)/+layout.svelte` has a mic button (left slot) that uses `useLocalStt()`:

- **Idle**: Microphone icon
- **Loading**: Disabled, pulsing (model downloading)
- **Recording**: Red stop icon with pulse animation
- **Transcribing**: Disabled, fading

When transcription completes, the text is fed into `inputBarAdapter.onCreate()` — making it context-aware: on `/todo` it creates a task, on `/calendar` an event, on `/` it searches.

## CSP requirements

Same as `@mana/local-llm` — no new CSP rules needed. The existing config in `apps/mana/apps/web/src/hooks.server.ts` already allows:

- `script-src`: `'wasm-unsafe-eval'`, `https://cdn.jsdelivr.net`, `blob:`
- `connect-src`: `https://huggingface.co`, `https://*.huggingface.co`, `https://*.hf.co`, `https://cdn.jsdelivr.net`

## Browser cache

Models are cached in the browser Cache API under HuggingFace URLs (same as local-llm). `hasModelInCache(modelId)` probes for `config.json` to detect cached models. After first download, subsequent loads are instant.

## Browser support

- WebGPU: Chrome/Edge 113+, Safari 18+ (fastest, ~3-5s for 60s audio)
- WASM fallback: all modern browsers (~15-20s for 60s audio)
- Requires `getUserMedia` for mic access (HTTPS or localhost)

## Adding a new model

Add an entry to `src/models.ts`:

```ts
'whisper-medium': {
  modelId: 'onnx-community/whisper-medium',
  displayName: 'Whisper Medium',
  dtype: 'fp32',
  downloadSizeMb: 3000,
  ramUsageMb: 4000,
},
```

The model must be an ONNX build on HuggingFace with a Whisper architecture.

## Relationship to existing voice features

| Component | Purpose | Uses local-stt? |
|-----------|---------|----------------|
| `voiceRecorder` singleton | Record audio as Blob (webm/opus) for server transcription | No |
| `VoiceCaptureBar` | UI bar for dreams/memoro voice capture → sends to mana-stt server | No |
| `useLocalStt()` | Record + transcribe entirely on-device | **Yes** |
| QuickInputBar mic button | Voice-to-text for any module via useLocalStt | **Yes** |

The existing `voiceRecorder` and `VoiceCaptureBar` are still used for features that need server-side processing (e.g. dreams with server STT). `useLocalStt()` is the privacy-first alternative that never sends audio off-device.
