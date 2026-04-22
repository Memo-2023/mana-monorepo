/**
 * settings/searchIndex — single source of truth for the settings sidebar
 * categories and the in-page search index. Editing a single entry here
 * updates both the navigation and the search results.
 */
import type { Component } from 'svelte';
import { Gear, Robot, ShieldCheck, Cloud, Tag } from '@mana/shared-icons';

export type CategoryId = 'general' | 'ai' | 'security' | 'data' | 'tag-presets';

export interface Category {
	id: CategoryId;
	label: string;
	description: string;
	icon: Component;
	/** Anchor ids in this category — used for hash-based deep-links. */
	anchors: string[];
}

export const categories: Category[] = [
	{
		id: 'general',
		label: 'Allgemein',
		description: 'Theme, Sprache, Benachrichtigungen',
		icon: Gear,
		anchors: ['global'],
	},
	{
		id: 'ai',
		label: 'KI',
		description: 'Compute-Backend & Modelle',
		icon: Robot,
		anchors: ['ai-options'],
	},
	{
		id: 'security',
		label: 'Sicherheit',
		description: 'Passkeys, 2FA, Verschlüsselung & Sitzungen',
		icon: ShieldCheck,
		anchors: ['passkeys', 'sessions', 'two-factor', 'vault', 'security-log'],
	},
	{
		id: 'data',
		label: 'Daten & Sync',
		description: 'Cloud-Sync, Export, Backup & DSGVO',
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
	},
	{
		id: 'tag-presets',
		label: 'Tag-Presets',
		description: 'Tag-Sets für neue Spaces',
		icon: Tag,
		anchors: ['tag-presets'],
	},
];

export interface SearchEntry {
	/** Display label shown in the result list */
	label: string;
	/** Extra search keywords (the label is always searched too) */
	keywords?: string[];
	category: CategoryId;
	anchor: string;
}

export const searchIndex: SearchEntry[] = [
	// General
	{
		label: 'Theme',
		keywords: ['dark', 'light', 'farbe', 'design'],
		category: 'general',
		anchor: 'global',
	},
	{
		label: 'Sprache',
		keywords: ['language', 'i18n', 'deutsch', 'english'],
		category: 'general',
		anchor: 'global',
	},
	{
		label: 'Benachrichtigungen',
		keywords: ['notification', 'sound'],
		category: 'general',
		anchor: 'global',
	},

	// AI
	{
		label: 'KI-Optionen',
		keywords: ['llm', 'ai', 'compute'],
		category: 'ai',
		anchor: 'ai-options',
	},
	{
		label: 'Browser-Modell (Gemma)',
		keywords: ['gemma', 'webgpu', 'lokal', 'offline'],
		category: 'ai',
		anchor: 'ai-options',
	},
	{
		label: 'Mana-Server (KI)',
		keywords: ['server', 'self-hosted'],
		category: 'ai',
		anchor: 'ai-options',
	},
	{
		label: 'Cloud-KI (Gemini)',
		keywords: ['google', 'cloud', 'gemini'],
		category: 'ai',
		anchor: 'ai-options',
	},

	// Security
	{
		label: 'Passkeys',
		keywords: ['webauthn', 'fido', 'biometrie'],
		category: 'security',
		anchor: 'passkeys',
	},
	{
		label: 'Aktive Sessions',
		keywords: ['logout', 'gerät', 'device'],
		category: 'security',
		anchor: 'sessions',
	},
	{
		label: 'Zwei-Faktor (2FA)',
		keywords: ['totp', '2fa', 'mfa'],
		category: 'security',
		anchor: 'two-factor',
	},
	{
		label: 'Verschlüsselung',
		keywords: ['vault', 'encryption', 'aes', 'schlüssel', 'zero-knowledge'],
		category: 'security',
		anchor: 'vault',
	},
	{
		label: 'Sicherheits-Log',
		keywords: ['audit', 'history', 'verlauf'],
		category: 'security',
		anchor: 'security-log',
	},

	// Data
	{
		label: 'Cloud Sync',
		keywords: ['sync', 'geräte'],
		category: 'data',
		anchor: 'cloud-sync',
	},
	{
		label: 'Daten exportieren',
		keywords: ['export', 'dsgvo', 'gdpr', 'json'],
		category: 'data',
		anchor: 'my-data',
	},
	{
		label: 'Authentifizierung',
		keywords: ['sessions', '2fa', 'login'],
		category: 'data',
		anchor: 'auth-data',
	},
	{
		label: 'Credits & Transaktionen',
		keywords: ['guthaben', 'transaktionen'],
		category: 'data',
		anchor: 'credits-data',
	},
	{
		label: 'Projektdaten',
		keywords: ['projekte', 'apps', 'statistik'],
		category: 'data',
		anchor: 'project-data',
	},
	{
		label: 'Aufbewahrungsfristen',
		keywords: ['retention', 'dsgvo', 'fristen'],
		category: 'data',
		anchor: 'retention',
	},
	{
		label: 'Backup & Wiederherstellung',
		keywords: ['backup', 'restore', 'import', 'archiv', '.mana'],
		category: 'data',
		anchor: 'backup',
	},
	{
		label: 'Konto löschen',
		keywords: ['delete', 'gdpr', 'dsgvo', 'gefahrenzone'],
		category: 'data',
		anchor: 'danger-zone',
	},
];

/** Tiny case-insensitive ranker — exact > prefix > contains. */
export function searchSettings(query: string, limit = 8): SearchEntry[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const results: { entry: SearchEntry; score: number }[] = [];
	for (const entry of searchIndex) {
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
