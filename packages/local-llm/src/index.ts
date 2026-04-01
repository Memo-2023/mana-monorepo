// Engine
export { LocalLLMEngine, localLLM } from './engine';

// Models
export { MODELS, DEFAULT_MODEL } from './models';
export type { ModelKey } from './models';

// Types
export type {
	ChatMessage,
	GenerateOptions,
	GenerateResult,
	ModelConfig,
	LoadingStatus,
} from './types';

// Svelte 5 reactive helpers
export {
	getLocalLlmStatus,
	loadLocalLlm,
	unloadLocalLlm,
	isLocalLlmSupported,
	generate,
	generateText,
	extractJson,
	classify,
} from './svelte.svelte';
