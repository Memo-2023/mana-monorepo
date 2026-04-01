/**
 * Zitare module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

export interface LocalFavorite extends BaseRecord {
	quoteId: string;
}

export interface LocalQuoteList extends BaseRecord {
	name: string;
	description?: string | null;
	quoteIds: string[];
}
