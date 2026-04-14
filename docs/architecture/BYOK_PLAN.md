# BYOK — Bring Your Own Key

> Architecture and as-built docs for user-provided API keys.
> Status: **implemented 2026-04-14** (Phase 1-5 complete, 35 unit tests passing).

## Quick start for users

1. Gehe zu `/settings/ai-keys`
2. Klicke "Key hinzufuegen", waehle Provider (OpenAI/Anthropic/Gemini/Mistral)
3. Label eingeben, API-Key einfuegen, optional Modell waehlen
4. Im Companion-Chat Toolbar → "KI-Modus" → "Dein API-Key"
5. Kosten + Usage werden pro Key auf der Settings-Page angezeigt

## Architecture summary (as built)

## Goals

- User hinterlegt eigene API-Keys (OpenAI, Anthropic, Gemini, Mistral)
- Keys verschluesselt in IndexedDB (User-Master-Key, AES-GCM)
- Keys verlassen das Geraet nie (Browser-direct calls)
- Orchestrator nutzt BYOK als 5. Tier neben browser/mana-server/cloud
- Kostenschaetzung pro Call via Pricing-Tabelle
- Multiple Keys pro Provider (Label-based, einer `isDefault`)

## Architecture

```
User (Browser)
    |
    v
CompanionChat / any LLM task
    |
    v
LlmOrchestrator.run(task, input)
    |
    v
tier === 'byok' ?
    |
    v
ByokBackend
    |
    v
getByokKey(provider)  [callback provided at app init]
    |
    v
byokKeyVault (IndexedDB, encrypted)
    |
    v
  decrypt via user master key
    |
    v
ByokBackend.callProvider(provider, key, messages)
    |
    v
Provider-specific adapter (openai/anthropic/gemini/mistral)
    |
    v
direct HTTPS to api.openai.com / api.anthropic.com / ...
```

## Tier placement

New tier order (ranked by "where data goes"):

```
none         (0) — stays on device
browser      (1) — stays on device
mana-server  (2) — Mana's own infrastructure
byok         (3) — User's third-party accounts (user-controlled)
cloud        (4) — Mana's cloud (charges user's Mana credits)
```

Reasoning: `byok` sits between `mana-server` and `cloud` because it
leaves the user's network but goes to an account the user manages
personally. `cloud` is last because it costs the user Mana credits.

## Files to create

```
packages/shared-llm/src/
  tiers.ts                          → extend with 'byok'
  types.ts                          → ByokKeyResolver callback type
  backends/
    byok.ts                         → ByokBackend class
    byok-providers/
      openai.ts                     → OpenAI API adapter
      anthropic.ts                  → Anthropic API adapter
      gemini.ts                     → Gemini REST adapter
      mistral.ts                    → Mistral API adapter (OpenAI-compat)
      types.ts                      → ByokProvider interface
  pricing.ts                        → per-model token pricing
  store.svelte.ts                   → register ByokBackend

apps/mana/apps/web/src/
  lib/byok/
    types.ts                        → ByokKey interface
    vault.ts                        → encrypted IndexedDB CRUD
    store.svelte.ts                 → reactive Svelte store
    init.ts                         → wire key resolver into ByokBackend
  routes/(app)/settings/ai-keys/
    +page.svelte                    → management UI

apps/mana/apps/web/src/lib/data/database.ts
  → add _byokKeys table (v15 schema)
```

## Data model

```typescript
// packages/shared-llm/src/backends/byok-providers/types.ts
export type ByokProviderId = 'openai' | 'anthropic' | 'gemini' | 'mistral';

export interface ByokProvider {
  id: ByokProviderId;
  displayName: string;
  defaultModel: string;
  availableModels: string[];
  needsDangerousHeader?: boolean;  // Anthropic
  /** Call the provider with the user's key, return GenerateResult */
  call(opts: {
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    onToken?: (token: string) => void;
  }): Promise<GenerateResult>;
}

// apps/mana/apps/web/src/lib/byok/types.ts
export interface ByokKey {
  id: string;
  provider: ByokProviderId;
  label: string;                 // "Work Anthropic"
  keyCipher: string;             // AES-GCM encrypted
  keyIv: string;                 // init vector
  model?: string;                // override default model
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
  totalTokens: number;
  deletedAt?: string;
}
```

## Key resolver callback

The backend lives in `shared-llm` but keys live in the app's IndexedDB.
We inject a resolver at app init:

```typescript
// packages/shared-llm/src/backends/byok.ts
export type ByokKeyResolver = (
  provider: ByokProviderId,
  preferredLabel?: string,
) => Promise<{ apiKey: string; model: string } | null>;

export class ByokBackend implements LlmBackend {
  readonly tier = 'byok' as const;
  constructor(
    private resolver: ByokKeyResolver,
    private providers: Map<ByokProviderId, ByokProvider>,
  ) {}
  // ...
}

// apps/mana/apps/web/src/lib/byok/init.ts (app init)
import { llmOrchestrator } from '@mana/shared-llm';
import { getKeyForProvider } from './store.svelte';

llmOrchestrator.registerByokResolver(getKeyForProvider);
```

## Provider adapters

### OpenAI (CORS-friendly)

```typescript
fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model, messages, temperature, max_tokens: maxTokens, stream: true,
  }),
});
// SSE streaming response
```

### Anthropic (needs dangerous header)

```typescript
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({ model, messages, max_tokens, stream: true }),
});
// SSE streaming with different event schema than OpenAI
```

### Gemini (REST with key in URL)

```typescript
fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`, {
  method: 'POST',
  body: JSON.stringify({
    contents: messagesToGeminiFormat(messages),
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  }),
});
// Different message format!
```

### Mistral (OpenAI-compatible)

```typescript
fetch('https://api.mistral.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model, messages, temperature, max_tokens: maxTokens, stream: true,
  }),
});
// Same as OpenAI, can reuse adapter
```

## Pricing (for cost estimation)

```typescript
// packages/shared-llm/src/pricing.ts
export const PRICING: Record<string, { inputPer1k: number; outputPer1k: number }> = {
  // OpenAI (USD per 1K tokens)
  'gpt-5': { inputPer1k: 0.015, outputPer1k: 0.060 },
  'gpt-4o': { inputPer1k: 0.005, outputPer1k: 0.020 },
  'gpt-4o-mini': { inputPer1k: 0.0003, outputPer1k: 0.0012 },
  // Anthropic
  'claude-opus-4.6': { inputPer1k: 0.015, outputPer1k: 0.075 },
  'claude-sonnet-4.6': { inputPer1k: 0.003, outputPer1k: 0.015 },
  // Gemini
  'gemini-2.5-pro': { inputPer1k: 0.00125, outputPer1k: 0.005 },
  'gemini-2.5-flash': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  // Mistral
  'mistral-large-latest': { inputPer1k: 0.002, outputPer1k: 0.006 },
  'mistral-small-latest': { inputPer1k: 0.0002, outputPer1k: 0.0006 },
};

export function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (promptTokens / 1000) * p.inputPer1k + (completionTokens / 1000) * p.outputPer1k;
}
```

## Privacy rules

```typescript
// In orchestrator routing
if (task.contentClass === 'sensitive') {
  // BYOK blocked by default — leaves device to third-party
  candidates = candidates.filter(t => t !== 'byok');
}
// User can opt-in per provider via
// settings.byok.sensitiveOptIn = ['anthropic']
```

## Settings schema extensions

```typescript
// LlmSettings (in shared-llm/src/types.ts)
export interface LlmSettings {
  allowedTiers: LlmTier[];
  taskOverrides: Record<string, LlmTier>;  // + 'byok' now valid
  fallbackToRulesOnError: boolean;
  showSourceInUi: boolean;
  cloudConsentGiven: boolean;
  // NEW:
  byok?: {
    defaultProvider?: ByokProviderId;
    sensitiveOptIn: ByokProviderId[];  // explicit consent for sensitive content
    preferredModel?: Record<ByokProviderId, string>;  // per-provider model override
  };
}
```

## Implementation (as built)

| Phase | Status | Commit |
|-------|--------|--------|
| 1. Foundation (LlmTier, ByokBackend, provider abstraction) | ✅ | `a33857fa3` |
| 2. OpenAI provider | ✅ | `a33857fa3` |
| 3. Anthropic + Gemini + Mistral providers | ✅ | `a33857fa3` |
| 4. Settings UI + IndexedDB vault | ✅ | `db8c2574d` |
| 5. Pricing table + usage tracking | ✅ | `db8c2574d` |
| Tests (35 unit tests) | ✅ | (this commit) |

## Deviations from the original plan

These things ended up different from what the plan called for:

- **Server-proxy fallback dropped.** The plan said "Browser-direct primary,
  server-proxy fallback on CORS." In practice I kept only browser-direct
  and left CORS as a user-facing error. All 4 providers support direct
  browser fetches (Anthropic via `anthropic-dangerous-direct-browser-access`).

- **Sensitive-content opt-in UI not built.** The orchestrator STILL blocks
  BYOK for `sensitive` content by default — that invariant holds — but
  there is no UI for users to opt-in per-provider yet. Add when a user
  actually asks for it.

- **Per-task BYOK provider overrides (e.g. `byok:anthropic`) not wired.**
  The tier-selector in the Companion chat only lets you pick `byok` in
  aggregate. The resolver currently picks the most-recently-used key
  across all providers. Extending this to support `byok:{provider}`
  syntax in `taskOverrides` is a small follow-up.

- **Default-provider setting not surfaced.** The `LlmSettings.byok.defaultProvider`
  field in the plan isn't in the settings type yet. The resolver uses
  "most-recently-used" as a proxy, which is actually a reasonable
  default UX-wise.

## Test coverage

| Area | Tests | File |
|------|-------|------|
| `estimateCost` + `formatCost` (pricing) | 14 | `packages/shared-llm/src/pricing.test.ts` |
| `ByokBackend` (dispatch, resolver, usage callback) | 10 | `packages/shared-llm/src/backends/byok.test.ts` |
| `byokVault` (CRUD + encryption + defaults) | 11 | `apps/mana/apps/web/src/lib/byok/vault.test.ts` |
| **Total** | **35** | All passing |

**NOT tested** (would need fetch mocking + SSE parsing):
- OpenAI adapter (`openai-compat.ts`)
- Anthropic adapter (different SSE event schema)
- Gemini adapter (different REST format)
- Mistral adapter (reuses OpenAI)

These run against real provider APIs in production — manual smoke tests
are the current verification path.

## Troubleshooting

### "Vault ist gesperrt" on the Settings page

Keys are encrypted with your user master key. Sign out/in to re-derive it,
or if that fails check `key-provider.ts` → `getActiveKey()`.

### "Kein BYOK-Schluessel konfiguriert" in the Companion

No keys have been added yet. Go to `/settings/ai-keys` and add one.

### CORS error in browser console

Some networks or proxies block direct-to-provider fetches. Options:
1. Try a different network
2. Use `mana-server` or `cloud` tier instead (server-proxied)
3. File an issue — we can add server-proxy fallback per-provider if needed

### Anthropic returns 401 with a valid key

Make sure the key starts with `sk-ant-`. Make sure
`anthropic-dangerous-direct-browser-access: true` is being sent (it is,
by default — inspect in DevTools Network tab).

### Gemini key works in Google's API Explorer but not here

Gemini keys are tied to specific Google Cloud projects. Make sure the
project has the Generative Language API enabled. Free-tier keys may
have rate limits that trigger 429.

## Follow-ups

Small, fast wins for v2:
- Per-task provider override syntax (`byok:anthropic`)
- Settings page for `LlmSettings.byok.defaultProvider`
- Sensitive-content opt-in toggle per provider
- Ollama-BYOK (user's self-hosted Ollama)
- Provider adapter tests with fetch mocking

## Decisions

| Question | Decision |
|----------|----------|
| Browser-direct vs. server-proxy? | Browser-direct primary. No server-proxy fallback in v1 — if CORS blocks, show error with link to docs. |
| Providers in v1 | OpenAI, Anthropic, Gemini, Mistral |
| Multiple keys per provider | Yes, one `isDefault`, others by label |
| Cost estimation | Yes, hardcoded pricing table (update manually) |
| Ollama BYOK (self-hosted) | Skip for v1 |
| Sensitive content + BYOK | Blocked by default, explicit per-provider opt-in |
| Key encryption | AES-GCM-256 via user master key (existing vault) |
| Key sync across devices | NO — keys stay device-local (user must add on each device) |
