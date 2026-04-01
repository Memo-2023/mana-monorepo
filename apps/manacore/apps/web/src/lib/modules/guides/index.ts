/**
 * Guides module — barrel exports.
 *
 * Interactive guides and tutorials for the ManaCore ecosystem.
 * No local-first collections needed yet (static content).
 */

export interface Guide {
	id: string;
	title: string;
	description: string;
	category: GuideCategory;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedMinutes: number;
}

export type GuideCategory = 'getting-started' | 'productivity' | 'advanced' | 'integrations';

export const GUIDE_CATEGORIES: Record<GuideCategory, { label: string; color: string }> = {
	'getting-started': { label: 'Erste Schritte', color: 'bg-emerald-500' },
	productivity: { label: 'Produktivität', color: 'bg-blue-500' },
	advanced: { label: 'Fortgeschritten', color: 'bg-violet-500' },
	integrations: { label: 'Integrationen', color: 'bg-amber-500' },
};

export const GUIDES: Guide[] = [
	{
		id: 'welcome',
		title: 'Willkommen bei ManaCore',
		description: 'Ein Überblick über das ManaCore-Ökosystem und seine Apps.',
		category: 'getting-started',
		difficulty: 'beginner',
		estimatedMinutes: 5,
	},
	{
		id: 'local-first',
		title: 'Offline-First verstehen',
		description: 'Wie ManaCore lokal arbeitet und im Hintergrund synchronisiert.',
		category: 'getting-started',
		difficulty: 'beginner',
		estimatedMinutes: 8,
	},
	{
		id: 'keyboard-shortcuts',
		title: 'Tastaturkürzel',
		description: 'Navigiere schneller mit Tastaturkürzeln durch alle Apps.',
		category: 'productivity',
		difficulty: 'beginner',
		estimatedMinutes: 5,
	},
	{
		id: 'todo-workflows',
		title: 'Todo-Workflows',
		description: 'Projekte, Labels und Fokus-Modus effektiv nutzen.',
		category: 'productivity',
		difficulty: 'intermediate',
		estimatedMinutes: 10,
	},
	{
		id: 'ai-features',
		title: 'KI-Funktionen nutzen',
		description: 'Chat, Playground und KI-gestützte Features in ManaCore.',
		category: 'advanced',
		difficulty: 'intermediate',
		estimatedMinutes: 12,
	},
	{
		id: 'sync-setup',
		title: 'Sync einrichten',
		description: 'Geräteübergreifende Synchronisation konfigurieren.',
		category: 'integrations',
		difficulty: 'intermediate',
		estimatedMinutes: 8,
	},
];
