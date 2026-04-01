/**
 * Central configuration for all Mana ecosystem apps
 * This is the single source of truth for AppSlider components
 */

import { APP_ICONS } from './app-icons';
import type { AppIconId } from './app-icons';

export type AppStatus = 'published' | 'beta' | 'development' | 'planning';

/**
 * Access tier hierarchy (higher number = more access):
 * guest(0) < public(1) < beta(2) < alpha(3) < founder(4)
 */
export type AccessTier = 'guest' | 'public' | 'beta' | 'alpha' | 'founder';

const TIER_LEVELS: Record<AccessTier, number> = {
	guest: 0,
	public: 1,
	beta: 2,
	alpha: 3,
	founder: 4,
};

/**
 * Check if a user's tier meets the required tier for an app
 */
export function hasAppAccess(userTier: string, requiredTier: AccessTier): boolean {
	const userLevel = TIER_LEVELS[userTier as AccessTier] ?? 0;
	const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;
	return userLevel >= requiredLevel;
}

/**
 * Get the numeric level for a tier (for comparisons)
 */
export function getTierLevel(tier: string): number {
	return TIER_LEVELS[tier as AccessTier] ?? 0;
}

/**
 * Tier display labels
 */
export const ACCESS_TIER_LABELS = {
	de: {
		guest: 'Gast',
		public: 'Standard',
		beta: 'Beta',
		alpha: 'Alpha',
		founder: 'Founder',
	},
	en: {
		guest: 'Guest',
		public: 'Standard',
		beta: 'Beta',
		alpha: 'Alpha',
		founder: 'Founder',
	},
} as const;

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
	/** Minimum access tier required to use this app */
	requiredTier: AccessTier;
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
		id: 'manacore',
		name: 'ManaCore',
		description: {
			de: 'Multi-App Ecosystem',
			en: 'Multi-App Ecosystem',
		},
		longDescription: {
			de: 'Das zentrale Dashboard für alle Mana-Apps mit SSO, Credits und App-Verwaltung.',
			en: 'The central dashboard for all Mana apps with SSO, credits, and app management.',
		},
		icon: APP_ICONS.manacore,
		color: '#6366f1',
		comingSoon: false,
		status: 'beta',
		requiredTier: 'alpha',
	},
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
		requiredTier: 'alpha',
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
		requiredTier: 'founder',
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
		requiredTier: 'alpha',
	},
	{
		id: 'cards',
		name: 'Cards',
		description: {
			de: 'KI Karteikarten',
			en: 'AI Flashcards',
		},
		longDescription: {
			de: 'Lerne intelligenter mit KI-generierten Karteikarten und Spaced Repetition.',
			en: 'Learn smarter with AI-generated flashcards and spaced repetition.',
		},
		icon: APP_ICONS.cards,
		color: '#8b5cf6',
		comingSoon: true,
		status: 'development',
		requiredTier: 'alpha',
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
		requiredTier: 'alpha',
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
		requiredTier: 'beta',
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
		requiredTier: 'founder',
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
		requiredTier: 'founder',
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
		requiredTier: 'beta',
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
		requiredTier: 'beta',
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
		requiredTier: 'alpha',
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
		requiredTier: 'beta',
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
		requiredTier: 'beta',
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
		requiredTier: 'founder',
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
		requiredTier: 'alpha',
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
		requiredTier: 'alpha',
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
		requiredTier: 'alpha',
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
		requiredTier: 'alpha',
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
		requiredTier: 'alpha',
	},
	{
		id: 'times',
		name: 'Taktik',
		description: {
			de: 'Zeiterfassung & Timetracking',
			en: 'Time Tracking',
		},
		longDescription: {
			de: 'Professionelle Zeiterfassung mit Timer, Projekten, Kunden, Reports und Gilden-Integration.',
			en: 'Professional time tracking with timer, projects, clients, reports, and guild integration.',
		},
		icon: APP_ICONS.times,
		color: '#f59e0b',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
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
		requiredTier: 'alpha',
	},
	{
		id: 'uload',
		name: 'uLoad',
		description: {
			de: 'URL-Shortener & Link-Management',
			en: 'URL Shortener & Link Management',
		},
		longDescription: {
			de: 'Kürze URLs, tracke Klicks und verwalte deine Links.',
			en: 'Shorten URLs, track clicks, and manage your links.',
		},
		icon: APP_ICONS.uload,
		color: '#6366f1',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
	},
	{
		id: 'reader',
		name: 'Reader',
		description: {
			de: 'Text-to-Speech mit Offline-Audio',
			en: 'Text-to-Speech with Offline Audio',
		},
		longDescription: {
			de: 'Texte in hochwertige Sprache umwandeln und offline anhören.',
			en: 'Convert text to high-quality speech and listen offline.',
		},
		icon: APP_ICONS.reader,
		color: '#f97316',
		comingSoon: false,
		status: 'development',
		requiredTier: 'founder',
	},
	{
		id: 'news',
		name: 'News Hub',
		description: {
			de: 'KI-Nachrichten & Leseliste',
			en: 'AI News & Reading List',
		},
		longDescription: {
			de: 'KI-kuratierte Nachrichten mit persönlicher Leseliste und Content-Extraction.',
			en: 'AI-curated news with personal reading list and content extraction.',
		},
		icon: APP_ICONS.news,
		color: '#10b981',
		comingSoon: false,
		status: 'development',
		requiredTier: 'founder',
	},
	{
		id: 'calc',
		name: 'Calc',
		description: {
			de: 'Taschenrechner & Umrechner',
			en: 'Calculator & Converter',
		},
		longDescription: {
			de: 'Taschenrechner mit Standard, Wissenschaftlich, Programmierer, Einheiten, Währung und Finanzrechnern.',
			en: 'Calculator with standard, scientific, programmer, unit, currency and finance modes.',
		},
		icon: APP_ICONS.calc,
		color: '#ec4899',
		comingSoon: false,
		status: 'development',
		requiredTier: 'beta',
	},
	{
		id: 'guides',
		name: 'Guides',
		description: {
			de: 'Schritt-für-Schritt Anleitungen',
			en: 'Step-by-Step Guides',
		},
		longDescription: {
			de: 'Erstelle und führe strukturierte Anleitungen aus — Rezepte, SOPs, Lernpfade und Playbooks mit Ausführungshistorie.',
			en: 'Create and execute structured guides — recipes, SOPs, learning paths, and playbooks with run history.',
		},
		icon: APP_ICONS.guides,
		color: '#0d9488',
		comingSoon: false,
		status: 'development',
		requiredTier: 'beta',
	},
	{
		id: 'mukke',
		name: 'Mukke',
		description: {
			de: 'Musikproduktion',
			en: 'Music Production',
		},
		longDescription: {
			de: 'Erstelle und verwalte Songs, Playlists und Musikprojekte mit Markern und Arrangements.',
			en: 'Create and manage songs, playlists, and music projects with markers and arrangements.',
		},
		icon: APP_ICONS.mukke,
		color: '#ec4899',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
	},
	{
		id: 'photos',
		name: 'Photos',
		description: {
			de: 'Fotoverwaltung',
			en: 'Photo Management',
		},
		longDescription: {
			de: 'Verwalte deine Fotos mit Alben, Tags und Favoriten.',
			en: 'Manage your photos with albums, tags, and favorites.',
		},
		icon: APP_ICONS.photos,
		color: '#8b5cf6',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
	},
	{
		id: 'planta',
		name: 'Planta',
		description: {
			de: 'Pflanzenpflege',
			en: 'Plant Care',
		},
		longDescription: {
			de: 'Verwalte deine Pflanzen mit Gießplänen, Fotos und Pflegeprotokollen.',
			en: 'Manage your plants with watering schedules, photos, and care logs.',
		},
		icon: APP_ICONS.planta,
		color: '#22c55e',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
	},
	{
		id: 'skilltree',
		name: 'SkillTree',
		description: {
			de: 'Skill-Tracking',
			en: 'Skill Tracking',
		},
		longDescription: {
			de: 'Verfolge deinen Lernfortschritt mit Skills, Aktivitäten und Achievements.',
			en: 'Track your learning progress with skills, activities, and achievements.',
		},
		icon: APP_ICONS.skilltree,
		color: '#f59e0b',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
	},
	{
		id: 'playground',
		name: 'Playground',
		description: {
			de: 'LLM Playground',
			en: 'LLM Playground',
		},
		longDescription: {
			de: 'Experimentiere mit verschiedenen KI-Modellen in einer interaktiven Spielwiese.',
			en: 'Experiment with different AI models in an interactive playground.',
		},
		icon: APP_ICONS.playground,
		color: '#06b6d4',
		comingSoon: false,
		status: 'development',
		requiredTier: 'alpha',
	},
	{
		id: 'arcade',
		name: 'Arcade',
		description: {
			de: 'KI Browser-Spiele',
			en: 'AI Browser Games',
		},
		longDescription: {
			de: 'Sammlung von KI-generierten Browser-Spielen zum sofortigen Spielen.',
			en: 'Collection of AI-generated browser games to play instantly.',
		},
		icon: APP_ICONS.arcade,
		color: '#ef4444',
		comingSoon: false,
		status: 'development',
		requiredTier: 'beta',
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
 * Get apps accessible to a user based on their tier
 * Only returns active (non-archived) apps the user has access to
 */
export function getAccessibleManaApps(userTier: string): ManaApp[] {
	return MANA_APPS.filter((app) => !app.archived && hasAppAccess(userTier, app.requiredTier));
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
	cards: { dev: 'http://localhost:5177', prod: 'https://cards.mana.how' },
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
	times: { dev: 'http://localhost:5197', prod: 'https://times.mana.how' },
	uload: { dev: 'http://localhost:5173', prod: 'https://ulo.ad' },
	reader: { dev: 'exp://localhost:8081', prod: 'https://reader.mana.how' },
	news: { dev: 'http://localhost:5174', prod: 'https://news.mana.how' },
	calc: { dev: 'http://localhost:5198', prod: 'https://calc.mana.how' },
	guides: { dev: 'http://localhost:5200', prod: 'https://guides.mana.how' },
	mukke: { dev: 'http://localhost:5191', prod: 'https://mukke.mana.how' },
	photos: { dev: 'http://localhost:5193', prod: 'https://photos.mana.how' },
	planta: { dev: 'http://localhost:5194', prod: 'https://planta.mana.how' },
	skilltree: { dev: 'http://localhost:5195', prod: 'https://skilltree.mana.how' },
	arcade: { dev: 'http://localhost:5201', prod: 'https://arcade.mana.how' },
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
 * Only returns apps the user has access to (non-archived, tier-gated)
 * @param currentAppId - The ID of the current app to mark as active
 * @param isDev - Whether to use development URLs (default: auto-detect)
 * @param customUrls - Optional custom URL overrides per app
 * @param userTier - The user's access tier (default: 'public')
 */
export function getPillAppItems(
	currentAppId?: AppIconId,
	isDev?: boolean,
	customUrls?: Partial<Record<AppIconId, string>>,
	userTier?: string
): PillAppItemConfig[] {
	const isDevMode =
		isDev ?? (typeof window !== 'undefined' && window.location.hostname === 'localhost');

	const tier = userTier || 'public';
	// Only show apps the user has access to
	return getAccessibleManaApps(tier).map((app) => ({
		id: app.id,
		name: app.name,
		url: customUrls?.[app.id] || (isDevMode ? APP_URLS[app.id].dev : APP_URLS[app.id].prod),
		icon: app.icon,
		color: app.color,
		isCurrent: app.id === currentAppId,
	}));
}
