/**
 * Eventbrite provider — discovers events via Eventbrite's public search pages.
 *
 * Eventbrite shut down their public Event Search API (/v3/events/search)
 * in 2023. Location-based search is no longer available via API.
 *
 * Strategy: use the website extractor (mana-research + LLM) to scrape
 * Eventbrite's public search pages (eventbrite.com/d/{region}/events/).
 * No API key required — this uses the same pipeline as any website source.
 */

import type { EventProvider, ProviderContext, ProviderResult, ExternalServiceConfig } from './base';
import { extractEventsFromWebsite } from '../website-extractor';

export const eventbriteProvider: EventProvider = {
	type: 'eventbrite',

	async fetchEvents(
		_url: string,
		_name: string,
		ctx?: ProviderContext,
		config?: ExternalServiceConfig
	): Promise<ProviderResult> {
		if (!ctx?.regionLabel) {
			return { events: [], error: 'Region label required for Eventbrite search' };
		}
		if (!config) {
			return { events: [], error: 'Missing research/LLM config for Eventbrite extraction' };
		}

		const regionSlug = ctx.regionLabel
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
		const searchUrl = `https://www.eventbrite.com/d/germany--${regionSlug}/events/`;

		try {
			const events = await extractEventsFromWebsite(
				searchUrl,
				`Eventbrite ${ctx.regionLabel}`,
				config.manaResearchUrl,
				config.manaLlmUrl
			);

			for (const event of events) {
				if (!event.externalId) {
					event.externalId = `eventbrite:${event.title.slice(0, 30)}`;
				}
			}

			return { events };
		} catch (err) {
			return {
				events: [],
				error: err instanceof Error ? err.message : 'Eventbrite fetch failed',
			};
		}
	},
};
