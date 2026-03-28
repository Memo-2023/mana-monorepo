/**
 * Content Merger
 * Merges central help content with app-specific content
 */

import type { HelpContent, MergeContentOptions } from './content';

/**
 * Filter content items by locale and app
 */
function filterItems<T extends { language: string; appSpecific?: boolean; apps?: string[] }>(
	items: T[],
	locale: string,
	appId: string
): T[] {
	return items.filter((item) => {
		// Filter by language
		if (item.language !== locale) {
			return false;
		}

		// Include non-app-specific items
		if (!item.appSpecific) {
			return true;
		}

		// Include app-specific items for this app
		return item.apps?.includes(appId) ?? false;
	});
}

/**
 * Merge two arrays, optionally replacing items with same ID
 */
function mergeArrays<T extends { id: string }>(
	central: T[],
	appSpecific: T[],
	overrideById: boolean
): T[] {
	if (!overrideById) {
		return [...central, ...appSpecific];
	}

	const appIds = new Set(appSpecific.map((item) => item.id));
	const filtered = central.filter((item) => !appIds.has(item.id));
	return [...filtered, ...appSpecific];
}

/**
 * Sort items by order property
 */
function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Merge central help content with app-specific content
 */
export function mergeContent(
	central: HelpContent,
	appSpecific: Partial<HelpContent>,
	options: MergeContentOptions
): HelpContent {
	const { appId, locale, overrideById = true } = options;

	// Filter central content by locale and app
	const filteredCentral: HelpContent = {
		faq: filterItems(central.faq, locale, appId),
		features: filterItems(central.features, locale, appId),
		shortcuts: filterItems(central.shortcuts, locale, appId),
		gettingStarted: filterItems(central.gettingStarted, locale, appId),
		changelog: filterItems(central.changelog, locale, appId),
		contact: central.contact?.language === locale ? central.contact : null,
	};

	// Filter app-specific content
	const filteredApp: Partial<HelpContent> = {
		faq: appSpecific.faq ? filterItems(appSpecific.faq, locale, appId) : [],
		features: appSpecific.features ? filterItems(appSpecific.features, locale, appId) : [],
		shortcuts: appSpecific.shortcuts ? filterItems(appSpecific.shortcuts, locale, appId) : [],
		gettingStarted: appSpecific.gettingStarted
			? filterItems(appSpecific.gettingStarted, locale, appId)
			: [],
		changelog: appSpecific.changelog ? filterItems(appSpecific.changelog, locale, appId) : [],
		contact: appSpecific.contact?.language === locale ? appSpecific.contact : null,
	};

	// Merge and sort
	return {
		faq: sortByOrder(mergeArrays(filteredCentral.faq, filteredApp.faq ?? [], overrideById)),
		features: sortByOrder(
			mergeArrays(filteredCentral.features, filteredApp.features ?? [], overrideById)
		),
		shortcuts: sortByOrder(
			mergeArrays(filteredCentral.shortcuts, filteredApp.shortcuts ?? [], overrideById)
		),
		gettingStarted: sortByOrder(
			mergeArrays(filteredCentral.gettingStarted, filteredApp.gettingStarted ?? [], overrideById)
		),
		changelog: sortByOrder(
			mergeArrays(filteredCentral.changelog, filteredApp.changelog ?? [], overrideById)
		),
		contact: filteredApp.contact ?? filteredCentral.contact,
	};
}

/**
 * Create an empty HelpContent object
 */
export function createEmptyContent(): HelpContent {
	return {
		faq: [],
		features: [],
		shortcuts: [],
		gettingStarted: [],
		changelog: [],
		contact: null,
	};
}
