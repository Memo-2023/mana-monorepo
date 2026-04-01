import type { ModelConfig } from './types';

/**
 * Pre-configured models for client-side inference.
 * All models are quantized for browser use via WebLLM/MLC.
 */

export const MODELS = {
	/** Default model — fast, good at structured output, multilingual */
	'qwen-2.5-1.5b': {
		modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
		displayName: 'Qwen 2.5 1.5B',
		downloadSizeMb: 1000,
		ramUsageMb: 1800,
	},
	/** Smaller variant for low-end devices */
	'qwen-2.5-0.5b': {
		modelId: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
		displayName: 'Qwen 2.5 0.5B',
		downloadSizeMb: 400,
		ramUsageMb: 800,
	},
} as const satisfies Record<string, ModelConfig>;

export type ModelKey = keyof typeof MODELS;

export const DEFAULT_MODEL: ModelKey = 'qwen-2.5-1.5b';
