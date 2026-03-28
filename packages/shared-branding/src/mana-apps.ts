/**
 * Central configuration for all Mana ecosystem apps
 * This is the single source of truth for AppSlider components
 */

import { APP_ICONS } from './app-icons';
import type { AppIconId } from './app-icons';

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
	{
		id: 'contacts',
		name: 'ManaContacts',
		description: {
			de: 'Kontaktverwaltung',
			en: 'Contact Management',
		},
		longDescription: {
			de: 'Verwalte deine Kontakte übersichtlich mit Gruppen, Tags und Notizen.',
			en: 'Manage your contacts clearly with groups, tags, and notes.',
		},
		icon: APP_ICONS.contacts,
		color: '#3b82f6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'calendar',
		name: 'Kalender',
		description: {
			de: 'Smarte Kalenderverwaltung',
			en: 'Smart Calendar Management',
		},
		longDescription: {
			de: 'Organisiere deine Zeit intelligent mit persönlichen und geteilten Kalendern, wiederkehrenden Terminen und Erinnerungen.',
			en: 'Organize your time intelligently with personal and shared calendars, recurring events, and reminders.',
		},
		icon: APP_ICONS.calendar,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'storage',
		name: 'Storage',
		description: {
			de: 'Cloud-Speicherung',
			en: 'Cloud Storage',
		},
		longDescription: {
			de: 'Sichere Cloud-Speicherung für deine Dateien mit Ordnern, Versionierung, Sharing und mehr.',
			en: 'Secure cloud storage for your files with folders, versioning, sharing, and more.',
		},
		icon: APP_ICONS.storage,
		color: '#3b82f6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'clock',
		name: 'Clock',
		description: {
			de: 'Uhren & Wecker',
			en: 'Clocks & Alarms',
		},
		longDescription: {
			de: 'Weltzeituhr, Wecker, Timer und stilvolle Uhren-Widgets in einer App.',
			en: 'World clock, alarms, timers, and stylish clock widgets in one app.',
		},
		icon: APP_ICONS.clock,
		color: '#f59e0b',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'todo',
		name: 'Todo',
		description: {
			de: 'Aufgabenverwaltung',
			en: 'Task Management',
		},
		longDescription: {
			de: 'Verwalte Aufgaben mit Projekten, Labels, Subtasks und wiederkehrenden Terminen.',
			en: 'Manage tasks with projects, labels, subtasks, and recurring schedules.',
		},
		icon: APP_ICONS.todo,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'mail',
		name: 'ManaMail',
		description: {
			de: 'Smart Email Client',
			en: 'Smart Email Client',
		},
		longDescription: {
			de: 'Intelligenter E-Mail-Client mit KI-Zusammenfassungen, Smart Reply und Multi-Account-Unterstützung.',
			en: 'Intelligent email client with AI summaries, smart reply, and multi-account support.',
		},
		icon: APP_ICONS.mail,
		color: '#6366f1',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'moodlit',
		name: 'Moodlit',
		description: {
			de: 'Ambient Lighting & Moods',
			en: 'Ambient Lighting & Moods',
		},
		longDescription: {
			de: 'Erstelle beruhigende Lichtstimmungen mit animierten Farbverläufen für entspannte Atmosphäre.',
			en: 'Create calming ambient lighting with animated color gradients for a relaxed atmosphere.',
		},
		icon: APP_ICONS.moodlit,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'inventory',
		name: 'Inventory',
		description: {
			de: 'Besitz-Verwaltung',
			en: 'Inventory Management',
		},
		longDescription: {
			de: 'Verwalte deinen Besitz mit Fotos, Kaufbelegen, Garantie-Dokumenten, Kategorien und Standorten.',
			en: 'Manage your belongings with photos, receipts, warranty documents, categories, and locations.',
		},
		icon: APP_ICONS.inventory,
		color: '#14b8a6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'questions',
		name: 'Questions',
		description: {
			de: 'KI Recherche-Assistent',
			en: 'AI Research Assistant',
		},
		longDescription: {
			de: 'Sammle Fragen und erhalte umfassende Antworten durch KI-gestützte Web-Recherche.',
			en: 'Collect questions and get comprehensive answers through AI-powered web research.',
		},
		icon: APP_ICONS.questions,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'matrix',
		name: 'Mana Matrix',
		description: {
			de: 'Matrix Chat Client',
			en: 'Matrix Chat Client',
		},
		longDescription: {
			de: 'Verbinde dich mit dem dezentralen Matrix-Netzwerk für sichere, föderierte Kommunikation.',
			en: 'Connect to the decentralized Matrix network for secure, federated communication.',
		},
		icon: APP_ICONS.matrix,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'context',
		name: 'Context',
		description: {
			de: 'Wissensmanagement',
			en: 'Knowledge Management',
		},
		longDescription: {
			de: 'AI-gestütztes Dokumenten- und Wissensmanagement mit Spaces, Kontextreferenzen und KI-Generierung.',
			en: 'AI-powered document and knowledge management with spaces, context references, and AI generation.',
		},
		icon: APP_ICONS.context,
		color: '#0ea5e9',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'taktik',
		name: 'Taktik',
		description: {
			de: 'Zeiterfassung & Timetracking',
			en: 'Time Tracking',
		},
		longDescription: {
			de: 'Professionelle Zeiterfassung mit Timer, Projekten, Kunden, Reports und Gilden-Integration.',
			en: 'Professional time tracking with timer, projects, clients, reports, and guild integration.',
		},
		icon: APP_ICONS.taktik,
		color: '#f59e0b',
		comingSoon: false,
		status: 'development',
	},
	{
		id: 'citycorners',
		name: 'CityCorners',
		description: {
			de: 'Stadtführer für Konstanz',
			en: 'City Guide for Konstanz',
		},
		longDescription: {
			de: 'Entdecke Sehenswürdigkeiten, Restaurants, Museen und Läden in Konstanz am Bodensee.',
			en: 'Discover sights, restaurants, museums, and shops in Konstanz at Lake Constance.',
		},
		icon: APP_ICONS.citycorners,
		color: '#2563eb',
		comingSoon: false,
		status: 'development',
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
	chat: { dev: 'http://localhost:5174', prod: 'https://chat.mana.how' },
	memoro: { dev: 'http://localhost:5175', prod: 'https://memoro.mana.how' },
	presi: { dev: 'http://localhost:5176', prod: 'https://presi.mana.how' },
	manadeck: { dev: 'http://localhost:5177', prod: 'https://manadeck.mana.how' },
	picture: { dev: 'http://localhost:5185', prod: 'https://picture.mana.how' },
	zitare: { dev: 'http://localhost:5180', prod: 'https://zitare.mana.how' },
	wisekeep: { dev: 'http://localhost:5181', prod: 'https://wisekeep.mana.how' },
	nutriphi: { dev: 'http://localhost:5182', prod: 'https://nutriphi.mana.how' },
	manacore: { dev: 'http://localhost:5173', prod: 'https://mana.how' },
	mana: { dev: 'http://localhost:5173', prod: 'https://mana.how' },
	moodlit: { dev: 'http://localhost:5182', prod: 'https://moodlit.mana.how' },
	contacts: { dev: 'http://localhost:5184', prod: 'https://contacts.mana.how' },
	calendar: { dev: 'http://localhost:5179', prod: 'https://calendar.mana.how' },
	storage: { dev: 'http://localhost:5185', prod: 'https://storage.mana.how' },
	clock: { dev: 'http://localhost:5187', prod: 'https://clock.mana.how' },
	todo: { dev: 'http://localhost:5188', prod: 'https://todo.mana.how' },
	mail: { dev: 'http://localhost:5186', prod: 'https://mail.mana.how' },
	inventory: { dev: 'http://localhost:5189', prod: 'https://inventory.mana.how' },
	questions: { dev: 'http://localhost:5111', prod: 'https://questions.mana.how' },
	matrix: { dev: 'http://localhost:5180', prod: 'https://matrix.mana.how' },
	playground: { dev: 'http://localhost:5190', prod: 'https://playground.mana.how' },
	context: { dev: 'http://localhost:5192', prod: 'https://context.mana.how' },
	citycorners: { dev: 'http://localhost:5196', prod: 'https://citycorners.mana.how' },
	taktik: { dev: 'http://localhost:5197', prod: 'https://taktik.mana.how' },
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
	const isDevMode =
		isDev ?? (typeof window !== 'undefined' && window.location.hostname === 'localhost');

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
