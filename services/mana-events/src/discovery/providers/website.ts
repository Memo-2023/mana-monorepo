/**
 * Website provider — wraps the LLM-based website extractor as an EventProvider.
 */

import type { EventProvider, ProviderResult, ExternalServiceConfig } from './base';
import { extractEventsFromWebsite } from '../website-extractor';

export const websiteProvider: EventProvider = {
	type: 'website',

	async fetchEvents(
		url: string,
		name: string,
		_ctx,
		config?: ExternalServiceConfig
	): Promise<ProviderResult> {
		if (!config) {
			return { events: [], error: 'Missing research/LLM config for website extraction' };
		}
		try {
			const events = await extractEventsFromWebsite(
				url,
				name,
				config.manaResearchUrl,
				config.manaLlmUrl
			);
			return { events };
		} catch (err) {
			return {
				events: [],
				error: err instanceof Error ? err.message : 'Website extraction failed',
			};
		}
	},
};
