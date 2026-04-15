import { parseFeedMeta } from './parse';
import type { FeedValidation } from './types';

const SAMPLE_LIMIT = 5;

export async function validateFeed(url: string): Promise<FeedValidation> {
	try {
		const parsed = await parseFeedMeta(url);
		return {
			ok: parsed.items.length > 0,
			itemCount: parsed.items.length,
			title: parsed.title,
			sample: parsed.items.slice(0, SAMPLE_LIMIT),
		};
	} catch (err) {
		return {
			ok: false,
			itemCount: 0,
			title: null,
			sample: [],
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
