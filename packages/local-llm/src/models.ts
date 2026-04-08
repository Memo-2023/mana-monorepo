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
	/** Google Gemma 2 — strong general-purpose model, similar size class to Qwen 1.5B */
	'gemma-2-2b': {
		modelId: 'gemma-2-2b-it-q4f16_1-MLC',
		displayName: 'Gemma 2 2B',
		downloadSizeMb: 1400,
		ramUsageMb: 2200,
	},
	/** Google Gemma 2 9B — much higher quality, needs a beefy GPU (~6GB VRAM) */
	'gemma-2-9b': {
		modelId: 'gemma-2-9b-it-q4f16_1-MLC',
		displayName: 'Gemma 2 9B',
		downloadSizeMb: 5300,
		ramUsageMb: 6500,
	},
} as const satisfies Record<string, ModelConfig>;

export type ModelKey = keyof typeof MODELS;

export const DEFAULT_MODEL: ModelKey = 'qwen-2.5-1.5b';
