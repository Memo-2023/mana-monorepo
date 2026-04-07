/**
 * Cross-App Search — Provider Registry
 *
 * Central registry that fans out search queries to all registered providers
 * in parallel and merges results sorted by relevance.
 *
 * Providers can be registered eagerly (the synchronous `register()` API) or
 * lazily (`registerLazy()`). Lazy providers are loaded the first time
 * `search()` runs — this lets the unified web app keep all per-module search
 * code out of the initial JS bundle, since search is opened on demand.
 */

import type { SearchProvider, SearchOptions, GroupedSearchResults } from './types';

type LazyLoader = () => Promise<SearchProvider>;

export class SearchRegistry {
	private providers: SearchProvider[] = [];
	private lazyLoaders = new Map<string, LazyLoader>();

	register(provider: SearchProvider): void {
		// Avoid duplicate registration
		if (!this.providers.some((p) => p.appId === provider.appId)) {
			this.providers.push(provider);
		}
	}

	/**
	 * Register a provider that will be loaded on first search. The `appId` is
	 * required up front so the registry can resolve filter constraints
	 * (`options.appIds`) without ever loading providers the user filtered out.
	 */
	registerLazy(appId: string, loader: LazyLoader): void {
		// If something already registered eagerly, prefer it.
		if (this.providers.some((p) => p.appId === appId)) return;
		this.lazyLoaders.set(appId, loader);
	}

	/**
	 * Resolves the lazy loaders relevant to a search call (all of them, or just
	 * the ones matching the appIds filter) and registers them. Each loader runs
	 * at most once across the lifetime of the registry.
	 */
	private async hydrate(appIdFilter?: string[]): Promise<void> {
		if (this.lazyLoaders.size === 0) return;
		const targets = appIdFilter
			? appIdFilter.filter((id) => this.lazyLoaders.has(id))
			: Array.from(this.lazyLoaders.keys());
		if (targets.length === 0) return;

		const loaded = await Promise.all(
			targets.map(async (appId) => {
				const loader = this.lazyLoaders.get(appId)!;
				try {
					return await loader();
				} catch (err) {
					console.error(`[search] failed to load provider "${appId}":`, err);
					return null;
				}
			})
		);
		for (let i = 0; i < targets.length; i++) {
			const provider = loaded[i];
			this.lazyLoaders.delete(targets[i]);
			if (provider) this.register(provider);
		}
	}

	/**
	 * Search across all registered providers in parallel.
	 * Returns results grouped by app, each group sorted by score.
	 */
	async search(query: string, options?: SearchOptions): Promise<GroupedSearchResults[]> {
		const q = query.trim();
		if (!q) return [];

		await this.hydrate(options?.appIds);

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
