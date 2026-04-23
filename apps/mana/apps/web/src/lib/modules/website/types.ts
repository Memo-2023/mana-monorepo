/**
 * Website module types — block-tree CMS for the Mana website builder.
 *
 * Three tables, all space-scoped, all plaintext (public content by
 * design — see docs/plans/website-builder.md §D4):
 *   - websites:      root entity per space (slug, theme, nav, footer)
 *   - websitePages:  multi-page support (path + seo + order)
 *   - websiteBlocks: block-tree via parentBlockId + fractional order
 *
 * Block.props is untyped (`unknown`) at the TS level because the shape
 * depends on block.type. Runtime validation goes through
 * `@mana/website-blocks`'s registry (Zod schemas per type).
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Theme / Nav / Footer config shapes ──────────────────

export type ThemePreset = 'classic' | 'modern' | 'warm';

export interface ThemeConfig {
	preset: ThemePreset;
	overrides?: {
		primary?: string;
		background?: string;
		foreground?: string;
	};
}

export interface NavItem {
	label: string;
	pagePath: string;
}

export interface NavConfig {
	items: NavItem[];
}

export interface FooterLink {
	label: string;
	href: string;
}

export interface FooterConfig {
	text: string;
	links: FooterLink[];
}

export interface SiteSettings {
	favicon?: string | null;
	defaultSeo?: {
		title?: string;
		description?: string;
	};
	analytics?: {
		plausibleDomain?: string;
	};
}

// ─── SEO (per page) ──────────────────────────────────────

export interface PageSeo {
	title?: string;
	description?: string;
	ogImage?: string;
	noindex?: boolean;
}

// ─── Local records (Dexie) ───────────────────────────────

export interface LocalWebsite extends BaseRecord {
	slug: string;
	name: string;
	theme: ThemeConfig;
	navConfig: NavConfig;
	footerConfig: FooterConfig;
	settings: SiteSettings;
	/** UUID pointing at the currently-live published_snapshots row. */
	publishedVersion: string | null;
	/** Bumped on every draft mutation — surfaces "unveröffentlichte Änderungen". */
	draftUpdatedAt: string | null;
}

export interface LocalWebsitePage extends BaseRecord {
	siteId: string;
	/** URL path — '/' for home, '/about' for subpage. */
	path: string;
	title: string;
	seo: PageSeo;
	/** Fractional index for reorder-without-reindex. */
	order: number;
}

export interface LocalWebsiteBlock extends BaseRecord {
	pageId: string;
	parentBlockId: string | null;
	/** Slot name within a container block (future — unused in M1). */
	slotKey: string | null;
	/** Block type id — must match a registered spec in @mana/website-blocks. */
	type: string;
	/** Block-type-specific props. Runtime-validated against the registry. */
	props: unknown;
	schemaVersion: number;
	order: number;
}

// ─── Domain types (UI-facing, nulls coalesced) ───────────

export interface Website {
	id: string;
	slug: string;
	name: string;
	theme: ThemeConfig;
	navConfig: NavConfig;
	footerConfig: FooterConfig;
	settings: SiteSettings;
	publishedVersion: string | null;
	draftUpdatedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface WebsitePage {
	id: string;
	siteId: string;
	path: string;
	title: string;
	seo: PageSeo;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface WebsiteBlock {
	id: string;
	pageId: string;
	parentBlockId: string | null;
	slotKey: string | null;
	type: string;
	props: unknown;
	schemaVersion: number;
	order: number;
	createdAt: string;
	updatedAt: string;
}
