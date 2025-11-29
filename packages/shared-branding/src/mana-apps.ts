/**
 * Central configuration for all Mana ecosystem apps
 * This is the single source of truth for AppSlider components
 */

import { APP_ICONS, type AppIconId } from './app-icons';

export type AppStatus = 'published' | 'beta' | 'development' | 'planning';

export interface ManaApp {
	id: AppIconId;
	name: string;
	description: {
		de: string;
		en: string;
	};
	longDescription: {
		de: string;
		en: string;
	};
	icon: string; // Data URL from APP_ICONS
	color: string;
	comingSoon: boolean;
	status: AppStatus;
	url?: string; // Optional URL for the app
	/** Whether this app is archived (in apps-archived folder) */
	archived?: boolean;
}

/**
 * All apps in the Mana ecosystem
 * Order determines display order in AppSlider
 */
export const MANA_APPS: ManaApp[] = [
	{
		id: 'chat',
		name: 'ManaChat',
		description: {
			de: 'KI Chat Assistent',
			en: 'AI Chat Assistant',
		},
		longDescription: {
			de: 'Dein intelligenter KI-Begleiter für Gespräche, Fragen und kreative Aufgaben.',
			en: 'Your intelligent AI companion for conversations, questions, and creative tasks.',
		},
		icon: APP_ICONS.chat,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'beta',
	},
	{
		id: 'memoro',
		name: 'Memoro',
		description: {
			de: 'KI Sprachnotizen',
			en: 'AI Voice Memos',
		},
		longDescription: {
			de: 'Verwandle deine Sprachnotizen in organisiertes, durchsuchbares Wissen mit KI-gestützter Transkription.',
			en: 'Transform your voice memos into organized, searchable knowledge with AI-powered transcription.',
		},
		icon: APP_ICONS.memoro,
		color: '#f8d62b',
		comingSoon: false,
		status: 'published',
		archived: true,
	},
	{
		id: 'presi',
		name: 'Presi',
		description: {
			de: 'Präsentations-Creator',
			en: 'Presentation Creator',
		},
		longDescription: {
			de: 'Erstelle beeindruckende Präsentationen mit KI-gestützten Design-Vorschlägen.',
			en: 'Create stunning presentations with AI-powered design suggestions.',
		},
		icon: APP_ICONS.presi,
		color: '#f97316',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'manadeck',
		name: 'ManaDeck',
		description: {
			de: 'KI Karteikarten',
			en: 'AI Flashcards',
		},
		longDescription: {
			de: 'Lerne intelligenter mit KI-generierten Karteikarten und Spaced Repetition.',
			en: 'Learn smarter with AI-generated flashcards and spaced repetition.',
		},
		icon: APP_ICONS.manadeck,
		color: '#8b5cf6',
		comingSoon: true,
		status: 'development',
	},
	{
		id: 'maerchenzauber',
		name: 'Märchenzauber',
		description: {
			de: 'KI Geschichten',
			en: 'AI Stories',
		},
		longDescription: {
			de: 'Erstelle magische, personalisierte Geschichten für Kinder mit KI-gestütztem Storytelling.',
			en: 'Create magical, personalized stories for children with AI-powered storytelling.',
		},
		icon: APP_ICONS.maerchenzauber,
		color: '#FF6B9D',
		comingSoon: true,
		status: 'beta',
		archived: true,
	},
	{
		id: 'picture',
		name: 'ManaPicture',
		description: {
			de: 'KI Bildgenerierung',
			en: 'AI Image Generation',
		},
		longDescription: {
			de: 'Erschaffe einzigartige Bilder mit der Kraft künstlicher Intelligenz.',
			en: 'Create unique images with the power of artificial intelligence.',
		},
		icon: APP_ICONS.picture,
		color: '#22c55e',
		comingSoon: true,
		status: 'development',
	},
	{
		id: 'zitare',
		name: 'Zitare',
		description: {
			de: 'Tägliche Inspiration',
			en: 'Daily Inspiration',
		},
		longDescription: {
			de: 'Entdecke inspirierende Zitate und Weisheiten für jeden Tag.',
			en: 'Discover inspiring quotes and wisdom for every day.',
		},
		icon: APP_ICONS.zitare,
		color: '#f59e0b',
		comingSoon: true,
		status: 'development',
	},
	{
		id: 'wisekeep',
		name: 'WiseKeep',
		description: {
			de: 'KI Wissensextraktion',
			en: 'AI Knowledge Extraction',
		},
		longDescription: {
			de: 'Extrahiere Weisheiten und Erkenntnisse aus Videos und Texten.',
			en: 'Extract wisdom and insights from videos and texts.',
		},
		icon: APP_ICONS.wisekeep,
		color: '#6366f1',
		comingSoon: true,
		status: 'planning',
		archived: true,
	},
	{
		id: 'nutriphi',
		name: 'Nutriphi',
		description: {
			de: 'KI Ernährungstracker',
			en: 'AI Nutrition Tracker',
		},
		longDescription: {
			de: 'Tracke deine Ernährung mit KI-gestützter Foto-Analyse und erhalte detaillierte Nährwertinformationen.',
			en: 'Track your nutrition with AI-powered photo analysis and get detailed nutritional information.',
		},
		icon: APP_ICONS.nutriphi,
		color: '#10b981',
		comingSoon: false,
		status: 'development',
		archived: true,
	},
];

/**
 * Get a specific app by ID
 */
export function getManaApp(id: AppIconId): ManaApp | undefined {
	return MANA_APPS.find((app) => app.id === id);
}

/**
 * Get apps filtered by status
 */
export function getManaAppsByStatus(status: AppStatus): ManaApp[] {
	return MANA_APPS.filter((app) => app.status === status);
}

/**
 * Get only published/available apps
 */
export function getAvailableManaApps(): ManaApp[] {
	return MANA_APPS.filter((app) => !app.comingSoon);
}

/**
 * Get only active (non-archived) apps
 */
export function getActiveManaApps(): ManaApp[] {
	return MANA_APPS.filter((app) => !app.archived);
}

/**
 * Status labels in German and English
 */
export const APP_STATUS_LABELS = {
	de: {
		published: 'Live',
		beta: 'Beta',
		development: 'In Entwicklung',
		planning: 'Geplant',
	},
	en: {
		published: 'Live',
		beta: 'Beta',
		development: 'In Development',
		planning: 'Planned',
	},
} as const;

/**
 * Common labels for AppSlider in German and English
 */
export const APP_SLIDER_LABELS = {
	de: {
		title: 'Teil des Mana Ecosystems',
		comingSoon: 'Demnächst',
		openApp: 'App öffnen',
	},
	en: {
		title: 'Part of the Mana Ecosystem',
		comingSoon: 'Coming Soon',
		openApp: 'Open App',
	},
} as const;

/**
 * Default app URLs for local development and production
 */
export const APP_URLS: Record<AppIconId, { dev: string; prod: string }> = {
	chat: { dev: 'http://localhost:5174', prod: 'https://chat.manacore.app' },
	memoro: { dev: 'http://localhost:5175', prod: 'https://memoro.manacore.app' },
	presi: { dev: 'http://localhost:5176', prod: 'https://presi.manacore.app' },
	manadeck: { dev: 'http://localhost:5177', prod: 'https://manadeck.manacore.app' },
	maerchenzauber: { dev: 'http://localhost:5178', prod: 'https://maerchenzauber.manacore.app' },
	picture: { dev: 'http://localhost:5179', prod: 'https://picture.manacore.app' },
	zitare: { dev: 'http://localhost:5180', prod: 'https://zitare.manacore.app' },
	wisekeep: { dev: 'http://localhost:5181', prod: 'https://wisekeep.manacore.app' },
	nutriphi: { dev: 'http://localhost:5182', prod: 'https://nutriphi.manacore.app' },
};

/**
 * App item type for PillNavigation app switcher
 */
export interface PillAppItemConfig {
	id: string;
	name: string;
	url: string;
	icon?: string;
	color?: string;
	isCurrent?: boolean;
}

/**
 * Get app items for PillNavigation app switcher
 * Only returns active (non-archived) apps
 * @param currentAppId - The ID of the current app to mark as active
 * @param isDev - Whether to use development URLs (default: auto-detect)
 * @param customUrls - Optional custom URL overrides per app
 */
export function getPillAppItems(
	currentAppId?: AppIconId,
	isDev?: boolean,
	customUrls?: Partial<Record<AppIconId, string>>
): PillAppItemConfig[] {
	const isDevMode = isDev ?? (typeof window !== 'undefined' && window.location.hostname === 'localhost');

	// Only show active (non-archived) apps
	return getActiveManaApps().map((app) => ({
		id: app.id,
		name: app.name,
		url: customUrls?.[app.id] || (isDevMode ? APP_URLS[app.id].dev : APP_URLS[app.id].prod),
		icon: app.icon,
		color: app.color,
		isCurrent: app.id === currentAppId,
	}));
}
