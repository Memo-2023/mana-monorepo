/**
 * Hook for loading and managing help content in mobile apps
 */

import { useState, useMemo } from 'react';
import type { HelpContent } from '@manacore/shared-help-types';
import { mergeContent, createEmptyContent, createSearcher } from '@manacore/shared-help-content';
import type { UseHelpContentOptions, UseHelpContentResult } from '../types';

export function useHelpContent(options: UseHelpContentOptions): UseHelpContentResult {
	const { appId, locale, centralContent, appContent } = options;
	const [loading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Merge central and app-specific content
	const content = useMemo(() => {
		try {
			const base = centralContent ?? createEmptyContent();
			if (appContent) {
				return mergeContent(base, appContent, {
					appId,
					locale,
				});
			}
			return base;
		} catch (err) {
			setError(err instanceof Error ? err : new Error('Failed to merge content'));
			return createEmptyContent();
		}
	}, [centralContent, appContent, appId, locale]);

	return {
		content,
		loading,
		error,
	};
}

/**
 * Hook for searching help content
 */
export function useHelpSearch(content: HelpContent) {
	const searcher = useMemo(() => createSearcher(content), [content]);

	return {
		search: (query: string, limit?: number) => {
			if (!query.trim()) return [];
			return searcher(query, { limit: limit ?? 10 });
		},
	};
}
