/**
 * Reactive queries and pure helpers for the Website module.
 *
 * All queries return the full scoped collection — consumers filter by
 * id/siteId/pageId with `$derived`. Dexie's liveQuery re-runs on every
 * write to the backing table; it does NOT re-run when caller-side
 * parameters change, which is why we don't accept id params here.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type {
	LocalWebsite,
	LocalWebsitePage,
	LocalWebsiteBlock,
	Website,
	WebsitePage,
	WebsiteBlock,
} from './types';
import { DEFAULT_THEME, DEFAULT_NAV, DEFAULT_FOOTER, DEFAULT_SETTINGS } from './constants';

// ─── Type Converters ─────────────────────────────────────

export function toWebsite(local: LocalWebsite): Website {
	const now = new Date().toISOString();
	return {
		id: local.id,
		slug: local.slug,
		name: local.name,
		theme: local.theme ?? DEFAULT_THEME,
		navConfig: local.navConfig ?? DEFAULT_NAV,
		footerConfig: local.footerConfig ?? DEFAULT_FOOTER,
		settings: local.settings ?? DEFAULT_SETTINGS,
		publishedVersion: local.publishedVersion ?? null,
		draftUpdatedAt: local.draftUpdatedAt ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toWebsitePage(local: LocalWebsitePage): WebsitePage {
	const now = new Date().toISOString();
	return {
		id: local.id,
		siteId: local.siteId,
		path: local.path,
		title: local.title,
		seo: local.seo ?? {},
		order: local.order,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

export function toWebsiteBlock(local: LocalWebsiteBlock): WebsiteBlock {
	const now = new Date().toISOString();
	return {
		id: local.id,
		pageId: local.pageId,
		parentBlockId: local.parentBlockId ?? null,
		slotKey: local.slotKey ?? null,
		type: local.type,
		props: local.props,
		schemaVersion: local.schemaVersion,
		order: local.order,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Live Queries ─────────────────────────────────────────

export function useAllSites() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalWebsite, string>('website', 'websites').toArray();
		const visible = locals.filter((s) => !s.deletedAt);
		return visible.map(toWebsite).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}, [] as Website[]);
}

export function useAllPages() {
	return useScopedLiveQuery(async () => {
		const locals = await db.table<LocalWebsitePage>('websitePages').toArray();
		const visible = locals.filter((p) => !p.deletedAt);
		return visible.map(toWebsitePage).sort((a, b) => a.order - b.order);
	}, [] as WebsitePage[]);
}

export function useAllBlocks() {
	return useScopedLiveQuery(async () => {
		const locals = await db.table<LocalWebsiteBlock>('websiteBlocks').toArray();
		const visible = locals.filter((b) => !b.deletedAt);
		return visible.map(toWebsiteBlock).sort((a, b) => a.order - b.order);
	}, [] as WebsiteBlock[]);
}

// ─── Pure Helpers (filter inside views) ──────────────────

export function findSite(sites: Website[], id: string | null | undefined): Website | null {
	if (!id) return null;
	return sites.find((s) => s.id === id) ?? null;
}

export function findPage(pages: WebsitePage[], id: string | null | undefined): WebsitePage | null {
	if (!id) return null;
	return pages.find((p) => p.id === id) ?? null;
}

export function pagesForSite(
	pages: WebsitePage[],
	siteId: string | null | undefined
): WebsitePage[] {
	if (!siteId) return [];
	return pages.filter((p) => p.siteId === siteId).sort((a, b) => a.order - b.order);
}

export function blocksForPage(
	blocks: WebsiteBlock[],
	pageId: string | null | undefined
): WebsiteBlock[] {
	if (!pageId) return [];
	return blocks.filter((b) => b.pageId === pageId).sort((a, b) => a.order - b.order);
}

/**
 * Arrange flat block list into a tree keyed by parentBlockId. Top-level
 * blocks live under the `null` key. Children are sorted by `order`.
 */
export function buildBlockTree(blocks: WebsiteBlock[]): Map<string | null, WebsiteBlock[]> {
	const tree = new Map<string | null, WebsiteBlock[]>();
	const sorted = [...blocks].sort((a, b) => a.order - b.order);
	for (const block of sorted) {
		const parent = block.parentBlockId;
		const existing = tree.get(parent);
		if (existing) existing.push(block);
		else tree.set(parent, [block]);
	}
	return tree;
}
