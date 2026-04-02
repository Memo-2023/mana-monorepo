/**
 * Fallback Adapter — Global cross-app search for non-module pages.
 *
 * Used on /home, /dashboard, /settings, etc. where no specific module
 * is active. Delegates to the SearchRegistry to search across all apps.
 */

import { goto } from '$app/navigation';
import type { QuickInputItem } from '@manacore/shared-ui';
import type { SearchRegistry } from '$lib/search/registry';
import type { InputBarAdapter } from './types';

export function createFallbackAdapter(searchRegistry: SearchRegistry): InputBarAdapter {
	return {
		placeholder: 'Suchen...',
		appIcon: 'search',
		deferSearch: false,
		emptyText: 'Keine Ergebnisse gefunden',

		async onSearch(query: string): Promise<QuickInputItem[]> {
			const groups = await searchRegistry.search(query, { limit: 5 });
			return groups
				.flatMap((g) =>
					g.results.map((r) => ({
						id: `${r.appId}:${r.id}`,
						title: r.title,
						subtitle: `${g.appName} · ${r.subtitle ?? r.type}`,
						icon: g.appIcon,
						_href: r.href,
					}))
				)
				.slice(0, 10) as QuickInputItem[];
		},

		onSelect(item: QuickInputItem) {
			const href = (item as QuickInputItem & { _href?: string })._href;
			if (href) goto(href);
		},
	};
}
