# BYOK — Bring Your Own Key

> Architecture and implementation plan for user-provided API keys.
> Status: planning (2026-04-14)

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

## Implementation order

**Phase 1 — Foundation (1.5h)**
1. Extend LlmTier with 'byok' in shared-llm
2. Create ByokKey vault (IndexedDB + encrypt/decrypt)
3. ByokBackend skeleton with provider registry
4. Wire into orchestrator

**Phase 2 — First provider (30min)**
5. OpenAI adapter (simplest — CORS ok)
6. Test via companion chat

**Phase 3 — More providers (1.5h)**
7. Anthropic adapter (with dangerous-header)
8. Gemini adapter (different message format)
9. Mistral adapter (OpenAI-compatible, trivial)

**Phase 4 — UI (1.5h)**
10. Settings/ai-keys page
11. Add + edit + delete key modals
12. Usage tracking (increment on each call)

**Phase 5 — Polish (30min)**
13. Pricing table + cost estimation
14. Companion toolbar dropdown extension (BYOK options)

**Total: ~5h**

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
