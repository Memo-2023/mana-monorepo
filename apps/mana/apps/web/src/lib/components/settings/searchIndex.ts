/**
 * settings/searchIndex — single source of truth for the settings sidebar
 * categories and the in-page search index. Editing a single entry here
 * updates both the navigation and the search results.
 *
 * Labels and keywords come from the `settings` i18n namespace at runtime;
 * pass the svelte-i18n `$_` formatter into `getCategories()` /
 * `getSearchIndex()` so components stay reactive to locale changes.
 */
import type { Component } from 'svelte';
import { Gear, Robot, ShieldCheck, Cloud, Tag } from '@mana/shared-icons';

export type CategoryId = 'general' | 'ai' | 'security' | 'privacy' | 'data' | 'tag-presets';

export interface Category {
	id: CategoryId;
	label: string;
	description: string;
	icon: Component;
	/** Anchor ids in this category — used for hash-based deep-links. */
	anchors: string[];
}

type TranslatorValue = string | number | boolean | Date | null | undefined;
type Translator = (key: string, opts?: { values?: Record<string, TranslatorValue> }) => string;

interface CategoryDef {
	icon: Component;
	anchors: string[];
	i18nKey: string;
}

const CATEGORY_DEFS: Record<CategoryId, CategoryDef> = {
	general: { icon: Gear, anchors: ['global'], i18nKey: 'general' },
	ai: { icon: Robot, anchors: ['ai-options'], i18nKey: 'ai' },
	security: {
		icon: ShieldCheck,
		anchors: ['passkeys', 'sessions', 'two-factor', 'vault', 'security-log'],
		i18nKey: 'security',
	},
	privacy: { icon: ShieldCheck, anchors: ['privacy'], i18nKey: 'privacy' },
	data: {
		icon: Cloud,
		anchors: [
			'cloud-sync',
			'my-data',
			'auth-data',
			'credits-data',
			'project-data',
			'retention',
			'backup',
			'danger-zone',
		],
		i18nKey: 'data',
	},
	'tag-presets': { icon: Tag, anchors: ['tag-presets'], i18nKey: 'tag_presets' },
};

const CATEGORY_IDS = Object.keys(CATEGORY_DEFS) as CategoryId[];

export function getCategories(t: Translator): Category[] {
	return CATEGORY_IDS.map((id) => {
		const def = CATEGORY_DEFS[id];
		return {
			id,
			label: t(`settings.categories.${def.i18nKey}.label`),
			description: t(`settings.categories.${def.i18nKey}.description`),
			icon: def.icon,
			anchors: def.anchors,
		};
	});
}

/** Locate the category that owns a given anchor — used by hash deep-links. */
export function findCategoryByAnchor(anchor: string): CategoryId | undefined {
	return CATEGORY_IDS.find((id) => CATEGORY_DEFS[id].anchors.includes(anchor));
}

export interface SearchEntry {
	/** Display label shown in the result list */
	label: string;
	/** Extra search keywords (the label is always searched too) */
	keywords?: string[];
	category: CategoryId;
	anchor: string;
}

interface SearchEntryDef {
	i18nKey: string;
	category: CategoryId;
	anchor: string;
}

const SEARCH_ENTRY_DEFS: SearchEntryDef[] = [
	// General
	{ i18nKey: 'theme', category: 'general', anchor: 'global' },
	{ i18nKey: 'language', category: 'general', anchor: 'global' },
	{ i18nKey: 'notifications', category: 'general', anchor: 'global' },
	// AI
	{ i18nKey: 'ai_options', category: 'ai', anchor: 'ai-options' },
	{ i18nKey: 'browser_model', category: 'ai', anchor: 'ai-options' },
	{ i18nKey: 'mana_server', category: 'ai', anchor: 'ai-options' },
	{ i18nKey: 'cloud_ai', category: 'ai', anchor: 'ai-options' },
	// Security
	{ i18nKey: 'passkeys', category: 'security', anchor: 'passkeys' },
	{ i18nKey: 'sessions', category: 'security', anchor: 'sessions' },
	{ i18nKey: 'two_factor', category: 'security', anchor: 'two-factor' },
	{ i18nKey: 'vault', category: 'security', anchor: 'vault' },
	{ i18nKey: 'security_log', category: 'security', anchor: 'security-log' },
	// Privacy
	{ i18nKey: 'privacy_overview', category: 'privacy', anchor: 'privacy' },
	{ i18nKey: 'reset_all_private', category: 'privacy', anchor: 'privacy' },
	// Data
	{ i18nKey: 'cloud_sync', category: 'data', anchor: 'cloud-sync' },
	{ i18nKey: 'data_export', category: 'data', anchor: 'my-data' },
	{ i18nKey: 'auth_data', category: 'data', anchor: 'auth-data' },
	{ i18nKey: 'credits_data', category: 'data', anchor: 'credits-data' },
	{ i18nKey: 'project_data', category: 'data', anchor: 'project-data' },
	{ i18nKey: 'retention', category: 'data', anchor: 'retention' },
	{ i18nKey: 'backup', category: 'data', anchor: 'backup' },
	{ i18nKey: 'delete_account', category: 'data', anchor: 'danger-zone' },
];

export function getSearchIndex(t: Translator): SearchEntry[] {
	return SEARCH_ENTRY_DEFS.map((def) => {
		const keywordsRaw = t(`settings.search.${def.i18nKey}.keywords`);
		return {
			label: t(`settings.search.${def.i18nKey}.label`),
			keywords: keywordsRaw
				? keywordsRaw
						.split(',')
						.map((k) => k.trim())
						.filter(Boolean)
				: [],
			category: def.category,
			anchor: def.anchor,
		};
	});
}

/** Tiny case-insensitive ranker — exact > prefix > contains. */
export function searchSettings(t: Translator, query: string, limit = 8): SearchEntry[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const index = getSearchIndex(t);
	const results: { entry: SearchEntry; score: number }[] = [];
	for (const entry of index) {
		const haystacks = [
			entry.label.toLowerCase(),
			...(entry.keywords ?? []).map((k) => k.toLowerCase()),
		];
		let score = 0;
		for (const h of haystacks) {
			if (h === q) score = Math.max(score, 100);
			else if (h.startsWith(q)) score = Math.max(score, 50);
			else if (h.includes(q)) score = Math.max(score, 20);
		}
		if (score > 0) results.push({ entry, score });
	}
	results.sort((a, b) => b.score - a.score);
	return results.slice(0, limit).map((r) => r.entry);
}
