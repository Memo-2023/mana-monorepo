/**
 * ManaLink — Display Data Resolvers
 *
 * Helpers to build cached display data from app metadata.
 */

import { getManaApp } from '@mana/shared-branding';
import type { AppIconId } from '@mana/shared-branding';
import type { LinkCachedData } from './types.js';

/**
 * Build LinkCachedData from app branding + a title.
 * Called by the app creating the link to populate offline-friendly display data.
 */
export function buildCachedData(appId: string, title: string, subtitle?: string): LinkCachedData {
	const app = getManaApp(appId as AppIconId);
	return {
		title,
		subtitle,
		icon: app?.icon,
		color: app?.color,
		appName: app?.name,
		fetchedAt: new Date().toISOString(),
	};
}

/**
 * Check if cached data is stale (older than threshold).
 * Default: 24 hours.
 */
export function isCacheStale(cached: LinkCachedData, maxAgeMs = 24 * 60 * 60 * 1000): boolean {
	const age = Date.now() - new Date(cached.fetchedAt).getTime();
	return age > maxAgeMs;
}
