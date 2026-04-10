/**
 * Zitare module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalFavorite extends BaseRecord {
	quoteId: string;
	tagIds?: string[] | null;
	/** Personal notes / thoughts about this quote. */
	notes?: string | null;
}

export interface LocalQuoteList extends BaseRecord {
	name: string;
	description?: string | null;
	quoteIds: string[];
}

/** A user-created custom quote stored locally. */
export interface LocalCustomQuote extends BaseRecord {
	text: string;
	author: string;
	category?: string | null;
	source?: string | null;
	year?: number | null;
}
