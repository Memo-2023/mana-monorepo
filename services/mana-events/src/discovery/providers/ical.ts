/**
 * iCal provider — wraps the existing ical-parser as an EventProvider.
 */

import type { EventProvider, ProviderResult } from './base';
import { parseIcalFeed } from '../ical-parser';

export const icalProvider: EventProvider = {
	type: 'ical',

	async fetchEvents(url: string, name: string): Promise<ProviderResult> {
		try {
			const events = await parseIcalFeed(url, name);
			return { events };
		} catch (err) {
			return { events: [], error: err instanceof Error ? err.message : 'iCal parse failed' };
		}
	},
};
