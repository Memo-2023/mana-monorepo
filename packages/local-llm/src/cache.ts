/**
 * Check if a model is cached in the browser's Cache API.
 * Wraps @mlc-ai/web-llm's hasModelInCache with a dynamic import
 * so it doesn't break SSR/Docker builds.
 */
export async function hasModelInCache(modelId: string): Promise<boolean> {
	try {
		const { hasModelInCache: check } = await import('@mlc-ai/web-llm');
		return await check(modelId);
	} catch {
		return false;
	}
}
