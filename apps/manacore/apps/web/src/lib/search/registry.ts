/**
 * Cross-App Search — Provider Registry
 *
 * Central registry that fans out search queries to all registered providers
 * in parallel and merges results sorted by relevance.
 */

import type { SearchProvider, SearchResult, SearchOptions, GroupedSearchResults } from './types';

export class SearchRegistry {
	private providers: SearchProvider[] = [];

	register(provider: SearchProvider): void {
		// Avoid duplicate registration
		if (!this.providers.some((p) => p.appId === provider.appId)) {
			this.providers.push(provider);
		}
	}

	getProviders(): SearchProvider[] {
		return this.providers;
	}

	/**
	 * Search across all registered providers in parallel.
	 * Returns results grouped by app, each group sorted by score.
	 */
	async search(query: string, options?: SearchOptions): Promise<GroupedSearchResults[]> {
		const q = query.trim();
		if (!q) return [];

		const limit = options?.limit ?? 5;
		const targetProviders = options?.appIds
			? this.providers.filter((p) => options.appIds!.includes(p.appId))
			: this.providers;

		const settled = await Promise.allSettled(
			targetProviders.map((provider) =>
				provider.search(q, { ...options, limit }).then((results) => ({
					provider,
					results,
				}))
			)
		);

		const groups: GroupedSearchResults[] = [];

		for (const result of settled) {
			if (result.status !== 'fulfilled') continue;
			const { provider, results } = result.value;
			if (results.length === 0) continue;

			groups.push({
				appId: provider.appId,
				appName: provider.appName,
				appIcon: provider.appIcon,
				appColor: provider.appColor,
				results: results.sort((a, b) => b.score - a.score).slice(0, limit),
			});
		}

		// Sort groups by their best result's score (descending)
		groups.sort((a, b) => (b.results[0]?.score ?? 0) - (a.results[0]?.score ?? 0));

		return groups;
	}
}
