/**
 * Spiral DB Store for Zitare
 * Manages SpiralDB state for visual quote storage
 */

import {
	SpiralDB,
	createQuoteSchema,
	type SpiralImage,
	type SpiralRecord,
	exportToPngBytes,
	importFromPngBytes,
	downloadPng,
} from '@manacore/spiral-db';

interface QuoteData extends Record<string, unknown> {
	id: number;
	status: number;
	category: number;
	language: number;
	createdAt: Date;
	quoteId: string;
	author: string;
	text: string;
}

interface SpiralStats {
	imageSize: number;
	totalPixels: number;
	usedPixels: number;
	totalRecords: number;
	activeRecords: number;
	deletedRecords: number;
	currentRing: number;
	compressionRatio: number;
}

const CATEGORY_MAP: Record<string, number> = {
	motivation: 0,
	weisheit: 1,
	liebe: 2,
	leben: 3,
	erfolg: 4,
	glueck: 5,
	freundschaft: 6,
	mut: 7,
	hoffnung: 8,
	natur: 9,
};

const CATEGORY_NAMES: Record<number, string> = Object.fromEntries(
	Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k])
);

const LANGUAGE_MAP: Record<string, number> = {
	original: 0,
	de: 1,
	en: 2,
	it: 3,
	fr: 4,
	es: 5,
};

class SpiralStore {
	private db: SpiralDB<QuoteData>;

	image = $state<SpiralImage | null>(null);
	stats = $state<SpiralStats | null>(null);
	records = $state<SpiralRecord<QuoteData>[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	constructor() {
		this.db = new SpiralDB<QuoteData>({
			schema: createQuoteSchema(),
			compression: true,
		});
		this.updateState();
	}

	private updateState() {
		this.image = this.db.getImage();
		this.records = this.db.getAll();

		const dbStats = this.db.getStats();
		const jsonSize = JSON.stringify(this.records.map((r) => r.data)).length || 1;
		const pixelBytes = Math.ceil((dbStats.usedPixels * 3) / 8);

		this.stats = {
			...dbStats,
			compressionRatio: Math.round((1 - pixelBytes / jsonSize) * 100),
		};
	}

	/**
	 * Import favorites from the favorites store, merged with quote data
	 */
	importFavorites(
		favorites: Array<{
			quoteId: string;
			createdAt?: string | Date;
		}>,
		getQuote: (quoteId: string) => {
			author: string;
			text: string;
			category: string;
			language?: string;
		} | null
	) {
		this.db = new SpiralDB<QuoteData>({
			schema: createQuoteSchema(),
			compression: true,
		});

		for (const fav of favorites) {
			const quote = getQuote(fav.quoteId);
			if (!quote) continue;

			const result = this.db.insert({
				id: 0,
				status: 2, // favorited
				category: CATEGORY_MAP[quote.category] ?? 0,
				language: LANGUAGE_MAP[quote.language ?? 'de'] ?? 1,
				createdAt: fav.createdAt ? new Date(fav.createdAt) : new Date(),
				quoteId: fav.quoteId.slice(0, 100),
				author: quote.author.slice(0, 100),
				text: quote.text.slice(0, 255),
			});

			if (result.success) {
				this.db.complete(result.recordId!);
			}
		}

		this.updateState();
	}

	/**
	 * Add a single quote to the spiral
	 */
	addQuote(quote: {
		quoteId: string;
		author: string;
		text: string;
		category: string;
		language?: string;
	}) {
		const result = this.db.insert({
			id: 0,
			status: 0,
			category: CATEGORY_MAP[quote.category] ?? 0,
			language: LANGUAGE_MAP[quote.language ?? 'de'] ?? 1,
			createdAt: new Date(),
			quoteId: quote.quoteId.slice(0, 100),
			author: quote.author.slice(0, 100),
			text: quote.text.slice(0, 255),
		});

		if (result.success) {
			this.updateState();
		}
		return result;
	}

	/**
	 * Remove a quote (soft delete)
	 */
	removeQuote(id: number) {
		const result = this.db.delete(id);
		if (result.success) {
			this.updateState();
		}
		return result;
	}

	/**
	 * Mark a quote as favorited
	 */
	favoriteQuote(id: number) {
		const result = this.db.complete(id);
		if (result.success) {
			this.updateState();
		}
		return result;
	}

	downloadPng(filename = 'spiral-quotes.png') {
		if (this.image) {
			downloadPng(this.image, filename);
		}
	}

	getPngBytes(): Uint8Array | null {
		if (!this.image) return null;
		return exportToPngBytes(this.image);
	}

	clear() {
		this.db = new SpiralDB<QuoteData>({
			schema: createQuoteSchema(),
			compression: true,
		});
		this.updateState();
	}

	async importFromPng(file: File): Promise<{ success: boolean; error?: string }> {
		try {
			this.isLoading = true;
			this.error = null;

			const buffer = await file.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			const image = await importFromPngBytes(bytes);

			this.db = SpiralDB.fromImage<QuoteData>(image, createQuoteSchema());
			this.updateState();

			return { success: true };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			this.error = errorMessage;
			return { success: false, error: errorMessage };
		} finally {
			this.isLoading = false;
		}
	}

	getCategoryName(index: number): string {
		return CATEGORY_NAMES[index] ?? 'unknown';
	}
}

export const spiralStore = new SpiralStore();
