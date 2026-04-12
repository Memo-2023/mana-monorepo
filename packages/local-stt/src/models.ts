import type { SttModelConfig } from './types';

/**
 * Pre-configured Whisper models for client-side speech-to-text.
 *
 * All models are ONNX builds loaded via @huggingface/transformers (transformers.js)
 * with the WebGPU backend. English-only variants are smaller and faster for
 * single-language use; multilingual models auto-detect the spoken language.
 *
 * Model quality/size trade-off (English WER on LibriSpeech test-clean):
 *   tiny.en:  ~5.6%  — 39M params, very fast, good enough for dictation
 *   base.en:  ~4.3%  — 74M params, noticeably better on accents/noise
 *   small.en: ~3.4%  — 244M params, near-human accuracy, slower
 *   tiny:     ~7.6%  — multilingual, auto-detects language
 *   base:     ~5.0%  — multilingual
 *   small:    ~3.9%  — multilingual
 */

export const MODELS = {
	'whisper-tiny': {
		modelId: 'onnx-community/whisper-tiny',
		displayName: 'Whisper Tiny',
		dtype: 'fp32',
		downloadSizeMb: 150,
		ramUsageMb: 300,
	},
	'whisper-small': {
		modelId: 'onnx-community/whisper-small',
		displayName: 'Whisper Small',
		dtype: 'fp32',
		downloadSizeMb: 950,
		ramUsageMb: 1500,
	},
} as const satisfies Record<string, SttModelConfig>;

export type ModelKey = keyof typeof MODELS;

export const DEFAULT_MODEL: ModelKey = 'whisper-tiny';
