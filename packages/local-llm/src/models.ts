import type { ModelConfig } from './types';

/**
 * Pre-configured models for client-side inference.
 *
 * All models are ONNX builds loaded via @huggingface/transformers (transformers.js)
 * with the WebGPU backend. The default is Google's Gemma 4 E2B — the smallest
 * member of the Gemma 4 family released 2026-04-02. E2B stands for "Effective 2B"
 * and is multimodal (text + image + audio) at the model level, but our chat-only
 * code path only ever passes text.
 *
 * Adding a new model: pick a HuggingFace ONNX repo (look on huggingface.co/onnx-community
 * for community-converted models, or huggingface.co/{org}/{repo}-ONNX for first-party
 * builds), confirm it has a `q4f16` quantization in its `onnx/` directory, and add an
 * entry below. The /llm-test page picks up new entries automatically.
 */

export const MODELS = {
	'gemma-4-e2b': {
		modelId: 'onnx-community/gemma-4-E2B-it-ONNX',
		displayName: 'Gemma 4 E2B',
		dtype: 'q4f16',
		downloadSizeMb: 500,
		ramUsageMb: 1500,
	},
} as const satisfies Record<string, ModelConfig>;

export type ModelKey = keyof typeof MODELS;

export const DEFAULT_MODEL: ModelKey = 'gemma-4-e2b';
