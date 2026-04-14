import type { ByokProvider, ByokCallOptions } from './types';
import { callOpenAiCompat } from './openai-compat';
import type { GenerateResult } from '../../types';

export const mistralProvider: ByokProvider = {
	id: 'mistral',
	displayName: 'Mistral AI',
	defaultModel: 'mistral-small-latest',
	availableModels: [
		'mistral-large-latest',
		'mistral-small-latest',
		'mistral-medium-latest',
		'open-mistral-nemo',
		'codestral-latest',
	],

	async call(opts: ByokCallOptions): Promise<GenerateResult> {
		return callOpenAiCompat(
			{ baseUrl: 'https://api.mistral.ai/v1', providerName: 'Mistral' },
			opts
		);
	},
};
