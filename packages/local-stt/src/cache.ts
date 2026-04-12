/**
 * Check if a Whisper model is already cached in the browser.
 *
 * Same approach as @mana/local-llm: probe for the model's config.json
 * in the Cache API. Whisper models always have this file and it's
 * downloaded first, so its presence reliably indicates "downloaded before".
 */
export async function hasModelInCache(modelId: string): Promise<boolean> {
	if (typeof caches === 'undefined') return false;
	try {
		const cacheNames = await caches.keys();
		const url = `https://huggingface.co/${modelId}/resolve/main/config.json`;
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
