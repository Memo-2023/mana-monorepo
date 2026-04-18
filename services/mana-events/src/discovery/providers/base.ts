/**
 * Base interface for event discovery providers.
 *
 * Each provider knows how to fetch events from a specific source type
 * (iCal, website, Eventbrite, Meetup, etc.). The crawl scheduler
 * dispatches to the correct provider based on the source type.
 */

import type { NormalizedEvent } from '../types';

/** Context passed to providers for region-aware searches. */
export interface ProviderContext {
	/** Region center latitude. */
	lat?: number;
	/** Region center longitude. */
	lon?: number;
	/** Search radius in km. */
	radiusKm?: number;
	/** Region label (e.g. "Freiburg"). */
	regionLabel?: string;
}

/** Result from a provider fetch. */
export interface ProviderResult {
	events: NormalizedEvent[];
	error?: string;
}

/** Configuration for external services (mana-research, mana-llm). */
export interface ExternalServiceConfig {
	manaResearchUrl: string;
	manaLlmUrl: string;
}

/**
 * Event provider interface — all source types implement this.
 */
export interface EventProvider {
	/** Source type this provider handles. */
	readonly type: string;

	/**
	 * Fetch events from a source.
	 *
	 * @param url - Source URL (iCal feed, website, or API endpoint)
	 * @param name - Human-readable source name
	 * @param ctx - Region context for location-aware providers
	 * @param config - External service URLs (for website/LLM providers)
	 */
	fetchEvents(
		url: string,
		name: string,
		ctx?: ProviderContext,
		config?: ExternalServiceConfig
	): Promise<ProviderResult>;
}
