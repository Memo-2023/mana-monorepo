import type { Model, ModelWithModality, Modality, Provider } from '$lib/types';
import { getModels } from '$lib/api/llm';

/**
 * Model metadata configuration
 * Add new models here when installing them on the server
 * See: docs/OLLAMA_MODELS.md for instructions
 */
export const MODEL_METADATA: Record<string, { description: string; modality: Modality }> = {
	// Text Models - General Purpose
	'gemma3:4b': {
		description: 'Fast general-purpose model (~53 t/s)',
		modality: 'text',
	},
	'gemma3:12b': {
		description: 'Balanced quality & speed (~30 t/s)',
		modality: 'text',
	},
	'gemma3:27b': {
		description: 'Best quality, slower (~15 t/s)',
		modality: 'text',
	},
	'phi3.5:latest': {
		description: 'Microsoft Phi-3.5 - compact & efficient',
		modality: 'text',
	},
	'ministral-3:3b': {
		description: 'Mistral Mini - fast for simple tasks',
		modality: 'text',
	},

	// Vision Models
	'llava:7b': {
		description: 'Image understanding & description',
		modality: 'vision',
	},
	'qwen3-vl:4b': {
		description: 'Qwen Vision-Language model',
		modality: 'vision',
	},
	'deepseek-ocr:latest': {
		description: 'OCR & document understanding',
		modality: 'vision',
	},

	// Code Models
	'qwen2.5-coder:7b': {
		description: 'Code generation & completion (7B)',
		modality: 'code',
	},
	'qwen2.5-coder:14b': {
		description: 'Advanced code generation (14B)',
		modality: 'code',
	},
};

/**
 * Detect modality from model ID
 * First checks MODEL_METADATA, then falls back to pattern matching
 */
function detectModality(modelId: string): Modality {
	const id = modelId.toLowerCase();

	// Extract model name from provider prefix (e.g., "ollama/gemma3:4b" -> "gemma3:4b")
	const modelName = id.includes('/') ? id.split('/').slice(1).join('/') : id;

	// Check metadata first
	if (MODEL_METADATA[modelName]) {
		return MODEL_METADATA[modelName].modality;
	}

	// Vision models (pattern matching fallback)
	if (
		id.includes('llava') ||
		id.includes('vision') ||
		id.includes('-vl') ||
		id.includes('ocr') ||
		id.includes('moondream')
	) {
		return 'vision';
	}

	// Code models (pattern matching fallback)
	if (id.includes('coder') || id.includes('codellama') || id.includes('starcoder')) {
		return 'code';
	}

	// Default to text
	return 'text';
}

/**
 * Get model description from metadata
 */
function getModelDescription(modelId: string): string | undefined {
	const modelName = modelId.includes('/') ? modelId.split('/').slice(1).join('/') : modelId;
	return MODEL_METADATA[modelName]?.description;
}

interface GroupedModels {
	provider: Provider;
	label: string;
	models: Model[];
}

function createModelsStore() {
	let models = $state<Model[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Models with modality information for comparison
	const modelsWithModality = $derived<ModelWithModality[]>(
		models.map((model) => ({
			...model,
			modality: detectModality(model.id),
			description: getModelDescription(model.id),
		}))
	);

	const groupedModels = $derived.by(() => {
		const groups: Record<Provider, Model[]> = {
			ollama: [],
			openrouter: [],
			groq: [],
			together: [],
		};

		for (const model of models) {
			const id = model.id;
			if (id.startsWith('ollama/')) {
				groups.ollama.push(model);
			} else if (id.startsWith('openrouter/')) {
				groups.openrouter.push(model);
			} else if (id.startsWith('groq/')) {
				groups.groq.push(model);
			} else if (id.startsWith('together/')) {
				groups.together.push(model);
			}
		}

		const result: GroupedModels[] = [];
		const labels: Record<Provider, string> = {
			ollama: 'Ollama (Local)',
			openrouter: 'OpenRouter',
			groq: 'Groq',
			together: 'Together AI',
		};

		for (const [provider, providerModels] of Object.entries(groups)) {
			if (providerModels.length > 0) {
				result.push({
					provider: provider as Provider,
					label: labels[provider as Provider],
					models: providerModels.sort((a, b) => a.id.localeCompare(b.id)),
				});
			}
		}

		return result;
	});

	return {
		get models() {
			return models;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get groupedModels() {
			return groupedModels;
		},
		get modelsWithModality() {
			return modelsWithModality;
		},

		async loadModels() {
			loading = true;
			error = null;

			try {
				const response = await getModels();
				models = response.data;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load models';
				models = [];
			} finally {
				loading = false;
			}
		},
	};
}

export const modelsStore = createModelsStore();
