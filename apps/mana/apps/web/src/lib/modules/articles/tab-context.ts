/**
 * Cross-tab context for the articles module.
 *
 * ArticlesTabShell provides this to let deeply-nested section components
 * (HomeSectionFrisch's "Alle ungelesenen →" button etc.) switch the
 * active tab without navigating away from the current URL — critical
 * when the articles module is rendered inside a Workbench card where a
 * `goto(...)` would kick the user out of the card entirely.
 *
 * Consumers: call `getArticlesTabContext()` and, if non-null, use
 * `.switchTo(tab)` in place of a `goto(/articles/...)`. Falling through
 * to goto when no context exists is the explicit escape hatch for when
 * the component is rendered standalone (e.g. old tests).
 */

import { getContext } from 'svelte';

export type ArticlesTabId = 'list' | 'highlights' | 'favorites' | 'stats';

export interface ArticlesTabContext {
	switchTo(tab: ArticlesTabId): void;
}

export const ARTICLES_TAB_CONTEXT = Symbol('articles-tab-context');

export function getArticlesTabContext(): ArticlesTabContext | null {
	return getContext<ArticlesTabContext | undefined>(ARTICLES_TAB_CONTEXT) ?? null;
}
