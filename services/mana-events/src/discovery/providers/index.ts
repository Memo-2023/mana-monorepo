/**
 * Provider registry — maps source types to their EventProvider implementation.
 */

import type { EventProvider } from './base';
import { icalProvider } from './ical';
import { websiteProvider } from './website';
import { eventbriteProvider } from './eventbrite';
import { meetupProvider } from './meetup';

export type { EventProvider, ProviderContext, ProviderResult, ExternalServiceConfig } from './base';

const PROVIDERS: Record<string, EventProvider> = {
	ical: icalProvider,
	website: websiteProvider,
	eventbrite: eventbriteProvider,
	meetup: meetupProvider,
};

/** Get the provider for a source type, or null if unknown. */
export function getProvider(type: string): EventProvider | null {
	return PROVIDERS[type] ?? null;
}

/** All registered provider types. */
export const PROVIDER_TYPES = Object.keys(PROVIDERS);
