/**
 * Check if a transformers.js model is already cached in the browser.
 *
 * transformers.js stores HuggingFace shards in the standard Cache API under a
 * named cache (default "transformers-cache"). We probe for the model's
 * tokenizer.json — it's tiny (~few KB), always present, and downloaded
 * first, so its presence is a reliable proxy for "this model has been
 * loaded at least once before".
 */
export async function hasModelInCache(modelId: string): Promise<boolean> {
	if (typeof caches === 'undefined') return false;
	try {
		const cacheNames = await caches.keys();
		const url = `https://huggingface.co/${modelId}/resolve/main/tokenizer.json`;
		for (const name of cacheNames) {
			const cache = await caches.open(name);
			const match = await cache.match(url);
			if (match) return true;
		}
		return false;
	} catch {
		return false;
	}
}
