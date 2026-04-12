// Engine
export { LocalSttEngine, localSTT } from './engine';

// Models
export { MODELS, DEFAULT_MODEL } from './models';
export type { ModelKey } from './models';

// Types
export type {
	TranscribeOptions,
	TranscribeResult,
	TranscribeSegment,
	SttModelConfig,
	LoadingStatus,
	TranscriptionStatus,
} from './types';

// Cache utilities
export { hasModelInCache } from './cache';

// Svelte 5 reactive helpers
export {
	getLocalSttStatus,
	loadLocalStt,
	unloadLocalStt,
	isLocalSttSupported,
	transcribe,
} from './svelte.svelte';
