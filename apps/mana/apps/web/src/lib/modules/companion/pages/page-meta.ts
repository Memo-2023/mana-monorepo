/**
 * Static metadata for every page the Companion carousel can render.
 *
 * Matches the shape modules like `/todo` use in their
 * `PAGE_META: Record<string, { title; color }>` — adapted here to the
 * Companion's own page set. Colors map loosely to the activity type
 * (data: muted, creative: primary-ish, health: green, policy: orange).
 */

import { Sparkle, ChatCircle, Flag, Notebook, Lightning, Heartbeat } from '@mana/shared-icons';
import type { Component } from 'svelte';
import type { CompanionPageId } from '../stores/workbench-settings.svelte';

export interface CompanionPageMeta {
	id: CompanionPageId;
	title: string;
	shortLabel: string;
	color: string;
	icon: Component;
	description: string;
}

export const COMPANION_PAGE_META: Record<CompanionPageId, CompanionPageMeta> = {
	home: {
		id: 'home',
		title: 'Companion',
		shortLabel: 'Home',
		color: '#6B5BFF',
		icon: Sparkle,
		description: 'Übersicht, schnelle Einstiege, letzte Aktivität.',
	},
	chat: {
		id: 'chat',
		title: 'Chat',
		shortLabel: 'Chat',
		color: '#3B82F6',
		icon: ChatCircle,
		description: 'Gespräch mit der KI.',
	},
	missions: {
		id: 'missions',
		title: 'Missions',
		shortLabel: 'Missions',
		color: '#22C55E',
		icon: Flag,
		description: 'Langlebige Aufträge an die KI anlegen, pausieren, ausführen.',
	},
	workbench: {
		id: 'workbench',
		title: 'Workbench',
		shortLabel: 'Workbench',
		color: '#F59E0B',
		icon: Notebook,
		description: 'Timeline aller KI-Aktivität; rückgängig machen.',
	},
	rituals: {
		id: 'rituals',
		title: 'Rituale',
		shortLabel: 'Rituale',
		color: '#EC4899',
		icon: Lightning,
		description: 'Geführte Routinen (Morgen, Abend, …).',
	},
	policy: {
		id: 'policy',
		title: 'Policy',
		shortLabel: 'Policy',
		color: '#F97316',
		icon: Flag,
		description: 'Pro Tool festlegen: auto / propose / deny.',
	},
	insights: {
		id: 'insights',
		title: 'Insights',
		shortLabel: 'Insights',
		color: '#8B5CF6',
		icon: Notebook,
		description: 'Approval-Raten, Feedback-Muster, Stats pro Mission.',
	},
	health: {
		id: 'health',
		title: 'Health',
		shortLabel: 'Health',
		color: '#10B981',
		icon: Heartbeat,
		description: 'Runner-Status, letzter Tick, LLM-Backend.',
	},
};

export const ALL_COMPANION_PAGE_IDS: readonly CompanionPageId[] = [
	'home',
	'chat',
	'missions',
	'workbench',
	'rituals',
	'policy',
	'insights',
	'health',
];
