import type { Model, ModelWithModality, Modality, Provider } from '$lib/types';
import { getModels } from '$lib/api/llm';

// Detect modality from model ID
function detectModality(modelId: string): Modality {
	const id = modelId.toLowerCase();

	// Vision models
	if (
		id.includes('llava') ||
		id.includes('vision') ||
		id.includes('-vl') ||
		id.includes('ocr') ||
		id.includes('moondream')
	) {
		return 'vision';
	}

	// Code models
	if (id.includes('coder') || id.includes('codellama') || id.includes('starcoder')) {
		return 'code';
	}

	// Default to text
	return 'text';
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
