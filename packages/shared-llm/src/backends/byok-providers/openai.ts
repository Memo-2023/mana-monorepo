import type { ByokProvider, ByokCallOptions } from './types';
import { callOpenAiCompat } from './openai-compat';
import type { GenerateResult } from '../../types';

export const openaiProvider: ByokProvider = {
	id: 'openai',
	displayName: 'OpenAI',
	defaultModel: 'gpt-4o-mini',
	availableModels: ['gpt-5', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini'],

	async call(opts: ByokCallOptions): Promise<GenerateResult> {
		return callOpenAiCompat({ baseUrl: 'https://api.openai.com/v1', providerName: 'OpenAI' }, opts);
	},
};
