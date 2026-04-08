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

// Orchestrator (rarely instantiated directly — most consumers use the
// store's singleton instead)
export { LlmOrchestrator, type LlmOrchestratorOptions } from './orchestrator';

// Backends (exported for tests + custom orchestrator setups)
export { BrowserBackend } from './backends/browser';
export { CloudBackend, type CloudBackendOptions } from './backends/cloud';
export { ManaServerBackend, type ManaServerBackendOptions } from './backends/mana-server';

// Singleton store + Svelte 5 reactive hooks
export {
	llmOrchestrator,
	llmSettingsState,
	updateLlmSettings,
	useTaskAvailability,
} from './store.svelte';
