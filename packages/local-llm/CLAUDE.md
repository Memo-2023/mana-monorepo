# `@mana/local-llm` — Browser-Local LLM Inference

Client-side LLM inference that runs **entirely in the user's browser** via WebGPU. No server roundtrips, no API keys, no data leaving the device. Used by `/llm-test` (developer tool) and the `playground` module in `apps/mana/apps/web`.

**Don't confuse this with the server-side LLM** (`services/mana-llm`). The server-side proxy is what backs the **`mana-server`** and **`cloud`** tiers in `@mana/shared-llm`'s tiered orchestrator — it speaks OpenAI-compatible HTTP and routes to a configured Ollama instance or to Gemini. The Ollama instance is **not** the Mac Mini's local Ollama: traffic goes via `~/gpu-proxy.py` (a Python TCP forwarder running as a LaunchAgent on the Mac Mini host) to the Windows GPU server's Ollama at `192.168.178.11:11434`, where inference runs on the **RTX 3090**. See `docs/MAC_MINI_SERVER.md` and `docs/WINDOWS_GPU_SERVER_SETUP.md` for the full topology. This package (`@mana/local-llm`) is the **only** path that uses the user's own device — `mana-server` and `cloud` both leave the device.

## What's currently in the box

| Field | Value |
|---|---|
| Engine library | [`@huggingface/transformers`](https://huggingface.co/docs/transformers.js/index) v4 (transformers.js) |
| Backend | WebGPU (mandatory; no WASM/CPU fallback enabled) |
| Default model | `onnx-community/gemma-4-E2B-it-ONNX` (Google Gemma 4 E2B, q4f16, ~500 MB on disk) |
| Quantization | 4-bit weights, fp16 activations (`q4f16`) |
| API surface | `LocalLLMEngine` class + Svelte 5 reactive bindings (`getLocalLlmStatus`, `loadLocalLlm`, `generate`, `extractJson`, `classify`) |

The exposed `LocalLLMEngine` API is intentionally engine-agnostic — `load()`, `generate()`, `prompt()`, `extractJson()`, `classify()`, `onStatusChange()`, `isSupported()`. Caller code (the test page, the playground module) **does not know** whether the underlying engine is WebLLM, transformers.js, or anything else. This was deliberate so future engine swaps don't ripple outward.

## Why transformers.js and not WebLLM

The package was originally built on `@mlc-ai/web-llm` with Qwen 2.5 1.5B. We swapped to transformers.js + Gemma 4 on **2026-04-08** because:

1. **MLC compilation lag.** WebLLM only runs models that have been pre-compiled to WGSL shaders by the MLC team. Gemma 4 was released 2026-04-02 and MLC had not (and as of the swap still hadn't) published Gemma 4 builds. Waiting was the alternative — we chose not to.
2. **transformers.js Gemma 4 is shipped.** HuggingFace's `onnx-community` org published `gemma-4-E2B-it-ONNX` six days after release, with a `Gemma4ForConditionalGeneration` class in transformers.js v4.0.0.
3. **Future flexibility.** ONNX is a much broader catalog than MLC's pre-compiled list. Switching to transformers.js opens the door to thousands of community-converted models without a per-model wait.

The trade-off accepted: transformers.js is a generic ONNX runtime, so per-token throughput is **~20–40% lower** than WebLLM would deliver for the same model size. For a 2B model on a modern WebGPU device that's still well above interactive latency. The JS bundle gains ~2–3 MB (the ONNX runtime), negligible against the 500 MB model download.

**If MLC ships Gemma 4 builds in the future** and you want to swap back: rewrite `engine.ts` to use the WebLLM API again (which is OpenAI-compatible, simpler), keep the same `LocalLLMEngine` class shape, and update `models.ts` with the MLC model id. The svelte bindings, the `/llm-test` page, and the playground module need no changes.

## CSP requirements (the seven layers)

Browser-local inference is unusually CSP-hungry. Every Mana web app that bundles `@mana/local-llm` needs **all** of the following directives or model loading silently breaks at one of seven different points. Discovered the hard way through seven sequential console errors during the Gemma 4 bring-up.

### `script-src`

```
'wasm-unsafe-eval'    — instantiate WASM modules (ONNX runtime)
https://cdn.jsdelivr.net    — dynamic import() of onnxruntime-web loader .mjs
blob:                 — Web Worker spawned via URL.createObjectURL
```

`wasm-unsafe-eval` is in the shared default in `packages/shared-utils/src/security-headers.ts`. The other two are added per-app in `apps/mana/apps/web/src/hooks.server.ts` via the `scriptSrc` option (see "Vite cache gotcha" below for why they live in the per-app hook, not the shared default).

### `connect-src`

```
https://huggingface.co              — repo metadata
https://*.huggingface.co            — legacy CDN hosts (cdn-lfs-*.huggingface.co etc.)
https://cdn-lfs.huggingface.co      — explicit fallback for older CSP-strict browsers
https://cdn-lfs-us-1.huggingface.co — same
https://*.hf.co                     — new XET-backed CDN host family
https://cas-bridge.xethub.hf.co     — explicit XET CAS bridge
https://cdn.jsdelivr.net            — fetch() of onnxruntime-web .wasm + .mjs
```

HF rotates exact CDN hostnames every few months as they migrate from LFS to XET. The wildcards (`*.huggingface.co`, `*.hf.co`) catch most rotations; the explicit entries are belt-and-suspenders for browsers that prefer narrow matches.

### Why jsDelivr is needed twice

`@huggingface/transformers` lazy-loads the `onnxruntime-web` WASM-loader shim from jsDelivr at backend selection time. There are **two** separate fetches with different CSP semantics:

1. `import('https://cdn.jsdelivr.net/.../ort-wasm-simd-threaded.asyncify.mjs')` — dynamic ESM import → routed through `script-src`.
2. `fetch('https://cdn.jsdelivr.net/.../ort-wasm-simd-threaded.asyncify.wasm')` — pre-load of the WASM binary → routed through `connect-src`.

Allowlisting only one of the two looks like the same identical error message ("no available backend found / Failed to fetch dynamically imported module") because the second failure is masked behind the first. Both directives have to include `cdn.jsdelivr.net`.

### Why `blob:` is needed

After successfully fetching the loader .mjs from jsDelivr, onnxruntime-web wraps it in `URL.createObjectURL(new Blob([...]))` and instantiates the result as a multi-threaded Web Worker. The `blob:` URL scheme is treated as its own CSP source by browsers — neither `'self'` nor `https://cdn.jsdelivr.net` matches it. Adding `blob:` to `script-src` allowlists workers spawned from blob URLs scoped to our document origin (you cannot `URL.createObjectURL` a Blob from another origin, so this does not loosen remote-script protection).

## Vite cache gotcha — keep CSP additions in `hooks.server.ts`

When changing CSP additions, **always edit them directly in `apps/mana/apps/web/src/hooks.server.ts`**, not in `packages/shared-utils/src/security-headers.ts`. The shared-utils file holds the *default* CSP that applies to every Mana web app, but adding to it from a workspace package boundary triggers a Vite SSR module-cache pitfall:

- `hooks.server.ts` is in the SvelteKit app's own source tree → Vite hot-reloads it on every file change. CSP additions made here take effect immediately.
- `packages/shared-utils/src/security-headers.ts` is imported as `@mana/shared-utils/security-headers` from a different workspace package → Vite's SSR module cache holds the OLD compiled version even after a source edit. The dev server has to be restarted (or `apps/mana/apps/web/node_modules/.vite` deleted) before the change takes effect.

**Diagnostic:** if you add a CSP entry and the next browser console error still shows the old CSP without your addition, you got bitten by this. The fix is to move the addition into `hooks.server.ts` via `setSecurityHeaders(response, { scriptSrc: [...], connectSrc: [...] })`.

## API surface (Svelte 5 usage)

```svelte
<script lang="ts">
  import {
    getLocalLlmStatus,
    loadLocalLlm,
    generate,
    extractJson,
    classify,
    isLocalLlmSupported,
    MODELS,
    DEFAULT_MODEL,
  } from '@mana/local-llm';

  const status = getLocalLlmStatus();
  const supported = isLocalLlmSupported();

  // Load on-demand (idempotent — safe to call repeatedly)
  async function start() {
    await loadLocalLlm(DEFAULT_MODEL);
  }

  // Streaming chat
  let response = $state('');
  async function chat(prompt: string) {
    response = '';
    await generate({
      messages: [{ role: 'user', content: prompt }],
      onToken: (t) => { response += t; },
      temperature: 0.7,
      maxTokens: 1024,
    });
  }
</script>

{#if !supported}
  <p>WebGPU not available — Chrome/Edge 113+ or Safari 18+ required.</p>
{:else if status.current.state === 'downloading'}
  <p>Downloading model: {(status.current.progress * 100).toFixed(0)}%</p>
{:else if status.current.state === 'ready'}
  <button onclick={() => chat('Hello')}>Chat</button>
  <pre>{response}</pre>
{/if}
```

The full status union is in `src/types.ts`: `idle | checking | downloading | loading | ready | error`. The downloading state carries `progress: number` (0..1) and `text: string` (human-readable summary including byte counts).

## Adding a new model

Append an entry to `src/models.ts`:

```ts
'phi-4-mini': {
  modelId: 'onnx-community/Phi-4-mini-instruct-ONNX',
  displayName: 'Phi-4 Mini',
  dtype: 'q4f16',
  downloadSizeMb: 850,
  ramUsageMb: 2200,
},
```

The `/llm-test` picker reads `MODELS` dynamically so new entries appear without UI changes. Constraints:

- Model must be ONNX-converted (look on `huggingface.co/onnx-community` for community converts, or `huggingface.co/{org}/{repo}-ONNX` for first-party builds).
- The `q4f16` quantization should exist in the repo's `onnx/` subdirectory. Other valid `dtype` values: `fp32`, `fp16`, `q8`, `q4`, `q4f16`.
- Architecture-specific model classes: Gemma 4 needs `Gemma4ForConditionalGeneration`. For other architectures you may need a different class import in `engine.ts`. Most LLMs work with `AutoModelForCausalLM` if they're text-only; multimodal-capable models (like Gemma 4) require their architecture-specific class.

## Two-step tokenization gotcha

Inside `engine.ts`, input prep is **two-step**:

```ts
const promptText = processor.apply_chat_template(messages, {
  add_generation_prompt: true,
  tokenize: false,
});
const inputs = processor.tokenizer(promptText, { return_tensors: 'pt' });
```

Do **not** be tempted to collapse this into a single `apply_chat_template(messages, { return_dict: true })` call. For multimodal-capable processors (Gemma4Processor in particular), the all-in-one mode does not produce a Tensor-backed `{ input_ids, attention_mask }` pair — it returns a shape that has no `.dims` on `input_ids`, and `model.generate()` then crashes deep inside the forward pass with `Cannot read properties of null (reading 'dims')`. The two-step pattern is what every transformers.js example for multimodal-capable processors uses.

Note the API name collision: `apply_chat_template`'s tensor option is `return_tensor` (singular, boolean), while `tokenizer()`'s tensor option is `return_tensors` (plural, accepts Python-style `'pt'` string). The JS port intentionally diverges from Python here.

## `model.generate()` returns null when streaming

In transformers.js v4, `model.generate({ ..., streamer })` returns `null` instead of a tensor when a `TextStreamer` is attached — the streamer is the only output channel. The engine always attaches a streamer (even when no caller `onToken` is provided) so we have one stable text channel that works on every version. Token counts are computed from the tensor return value when present, and fall back to a `chars/4` estimate when it isn't.

## Deploy notes — base image rebuild required

`@mana/local-llm` itself is **not** baked into `sveltekit-base:local`; it's COPYed fresh by `apps/mana/apps/web/Dockerfile` on every build. So a change to this package alone does not require a base image rebuild — just `./scripts/mac-mini/build-app.sh mana-web`.

**However**, the CSP additions live in `apps/mana/apps/web/src/hooks.server.ts` (in the app's own source tree, also COPYed fresh) — those also propagate via a normal `mana-web` build.

The only time you need a base image rebuild for local-llm-related work is if you change `packages/shared-utils/src/security-headers.ts` (because shared-utils IS baked into the base). The `is_base_image_stale` helper in `build-app.sh` (added 2026-04-08) detects this automatically and triggers a base rebuild before the per-app build.

## Browser cache and download size

Models are cached in the standard browser Cache API under `https://huggingface.co/{model_id}/resolve/main/...` URLs. The package's `hasModelInCache(modelId)` helper probes for the model's `tokenizer.json` (always present, downloaded first) as a reliable proxy for "this model has been loaded before". If the user clears site data or the browser evicts the cache under quota pressure, the model has to re-download.

The default Gemma 4 E2B model is **~500 MB on first load**. Show the download size in any UI that triggers a model load — users will assume the app is broken if a 500 MB silent download starts.

## Browser support

Hard requirements:

- WebGPU available — `navigator.gpu` must exist. Chrome/Edge 113+, Safari 18+. Firefox is still gated behind a flag and not supported.
- Cache API available — present in all modern browsers; no fallback path.
- Sufficient VRAM — Gemma 4 E2B with q4f16 needs roughly 1.5–2 GB of WebGPU device memory. On low-end devices the WebGPU adapter request will fail with `RequestDeviceFailed` or the inference will OOM. The user-facing fallback is "use the server-side LLM proxy via `services/mana-llm`" — there is no smaller browser-local model in the registry right now.

`LocalLLMEngine.isSupported()` only checks for WebGPU presence. It does not probe VRAM — there's no reliable WebGPU API for that.
