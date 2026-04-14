// Tiers + types
export { ALL_TIERS, TIER_RANK, tierLabel, type LlmTier } from './tiers';
export type {
	CapabilityRequirements,
	ChatMessage,
	ContentClass,
	GenerateOptions,
	GenerateResult,
	LlmBackend,
	LlmSettings,
	LlmTaskRequest,
	LlmTaskResult,
} from './types';
export { DEFAULT_LLM_SETTINGS } from './types';

// Errors
export {
	BackendUnreachableError,
	EdgeLoadFailedError,
	LlmError,
	NoTierAvailableError,
	ProviderBlockedError,
	TierTooLowError,
} from './errors';

// Task contract
export { buildTaskRequest, type LlmTask } from './task';

// Persistent task queue
export {
	LlmTaskQueue,
	type EnqueueOptions,
	type LlmTaskQueueOptions,
	type QueuedTask,
	type QueuedTaskState,
	type TaskRegistry,
} from './queue';

// Orchestrator (rarely instantiated directly — most consumers use the
// store's singleton instead)
export { LlmOrchestrator, type LlmOrchestratorOptions } from './orchestrator';

// Backends (exported for tests + custom orchestrator setups)
export { BrowserBackend } from './backends/browser';
export { CloudBackend, type CloudBackendOptions } from './backends/cloud';
export { ManaServerBackend, type ManaServerBackendOptions } from './backends/mana-server';
export {
	ByokBackend,
	type ByokBackendOptions,
	type ByokKeyResolver,
	type ResolvedByokKey,
	type ByokUsageCallback,
} from './backends/byok';
export {
	BUILTIN_BYOK_PROVIDERS,
	openaiProvider,
	anthropicProvider,
	geminiProvider,
	mistralProvider,
	type ByokProvider,
	type ByokProviderId,
	type ByokCallOptions,
} from './backends/byok-providers';

// Pricing
export { MODEL_PRICING, estimateCost, formatCost, type ModelPricing } from './pricing';

// Singleton store + Svelte 5 reactive hooks
export {
	llmOrchestrator,
	llmSettingsState,
	updateLlmSettings,
	useTaskAvailability,
} from './store.svelte';
