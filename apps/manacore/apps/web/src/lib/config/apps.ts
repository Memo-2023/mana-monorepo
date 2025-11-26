/**
 * Multi-app configuration for welcome page branding
 * Supports multiple apps using the same authentication system
 */

export interface AppFeature {
	icon: string;
	title: string;
	description: string;
	color: string;
}

export interface AppConfig {
	name: string;
	displayName: string;
	tagline: string;
	description: string;
	logoEmoji?: string;
	primaryColor: string;
	accentColor: string;
	features: AppFeature[];
	dashboardRoute: string;
	website?: string;
}

/**
 * App configurations for different applications in the ecosystem
 */
export const appConfigs: Record<string, AppConfig> = {
	memoro: {
		name: 'memoro',
		displayName: 'Memoro',
		tagline: 'Your Voice, Your Memories, AI-Powered',
		description: 'Transform your voice recordings into searchable, organized memories with the power of AI.',
		logoEmoji: '🎙️',
		primaryColor: '#3B82F6',
		accentColor: '#60A5FA',
		features: [
			{
				icon: '🎤',
				title: 'Voice Recording',
				description: 'Capture your thoughts instantly with high-quality audio recording',
				color: '#FF6B6B'
			},
			{
				icon: '✨',
				title: 'AI Transcription',
				description: 'Automatic transcription and smart summarization of your recordings',
				color: '#4ECDC4'
			},
			{
				icon: '🔍',
				title: 'Smart Search',
				description: 'Find any memory instantly with powerful search across all your memos',
				color: '#45B7D1'
			},
			{
				icon: '🏷️',
				title: 'Organization',
				description: 'Tag, categorize, and organize your memories effortlessly',
				color: '#FFEAA7'
			},
			{
				icon: '🌐',
				title: 'Web & Mobile',
				description: 'Access your memories anywhere - web, iOS, and Android',
				color: '#74B9FF'
			},
			{
				icon: '👥',
				title: 'Collaboration',
				description: 'Share and collaborate on memories with spaces and teams',
				color: '#DDA0DD'
			}
		],
		dashboardRoute: '/dashboard',
		website: 'https://memoro.app'
	},

	manadeck: {
		name: 'manadeck',
		displayName: 'ManaDeck',
		tagline: 'Master Any Subject with AI-Powered Flashcards',
		description: 'Create, study, and master flashcard decks with intelligent spaced repetition.',
		logoEmoji: '🎴',
		primaryColor: '#8B5CF6',
		accentColor: '#A78BFA',
		features: [
			{
				icon: '🎴',
				title: 'Smart Flashcards',
				description: 'AI-generated flashcards from your notes and content',
				color: '#8B5CF6'
			},
			{
				icon: '🧠',
				title: 'Spaced Repetition',
				description: 'Intelligent review scheduling for optimal retention',
				color: '#EC4899'
			},
			{
				icon: '📊',
				title: 'Progress Tracking',
				description: 'Detailed analytics and insights on your learning journey',
				color: '#10B981'
			},
			{
				icon: '🌍',
				title: 'Multi-Language',
				description: 'Study in any language with full internationalization',
				color: '#F59E0B'
			}
		],
		dashboardRoute: '/dashboard'
	},

	storyteller: {
		name: 'storyteller',
		displayName: 'Storyteller',
		tagline: 'Craft Beautiful Stories with AI',
		description: 'Create, edit, and publish captivating stories with AI-powered writing assistance.',
		logoEmoji: '📖',
		primaryColor: '#F59E0B',
		accentColor: '#FBBF24',
		features: [
			{
				icon: '✍️',
				title: 'AI Writing Assistant',
				description: 'Get intelligent suggestions and overcome writer\'s block',
				color: '#F59E0B'
			},
			{
				icon: '📚',
				title: 'Story Organization',
				description: 'Manage chapters, characters, and plotlines effortlessly',
				color: '#8B5CF6'
			},
			{
				icon: '🎨',
				title: 'Beautiful Formatting',
				description: 'Professional typography and formatting tools',
				color: '#EC4899'
			},
			{
				icon: '🚀',
				title: 'One-Click Publishing',
				description: 'Publish your stories directly to multiple platforms',
				color: '#10B981'
			}
		],
		dashboardRoute: '/dashboard'
	},

	manacore: {
		name: 'manacore',
		displayName: 'ManaCore',
		tagline: 'Your Universal Account',
		description: 'One account for all your Mana-powered applications.',
		logoEmoji: '⚡',
		primaryColor: '#6366F1',
		accentColor: '#818CF8',
		features: [
			{
				icon: '🔐',
				title: 'Single Sign-On',
				description: 'One account across all Mana applications',
				color: '#6366F1'
			},
			{
				icon: '👤',
				title: 'Unified Profile',
				description: 'Manage your profile and preferences in one place',
				color: '#8B5CF6'
			},
			{
				icon: '🏢',
				title: 'Organization Management',
				description: 'Create and manage teams across all apps',
				color: '#EC4899'
			},
			{
				icon: '💳',
				title: 'Mana Credits',
				description: 'Universal credit system for all Mana services',
				color: '#10B981'
			}
		],
		dashboardRoute: '/dashboard'
	}
};

/**
 * Default Mana branding for when no app is specified
 */
export const defaultManaConfig: AppConfig = {
	name: 'mana',
	displayName: 'Mana',
	tagline: 'The Unified Application Platform',
	description: 'Access all your Mana-powered applications with a single account. Built for productivity, powered by AI.',
	logoEmoji: '⚡',
	primaryColor: '#6366F1',
	accentColor: '#818CF8',
	features: [
		{
			icon: '🎙️',
			title: 'Memoro',
			description: 'AI-powered voice memos and memory management',
			color: '#3B82F6'
		},
		{
			icon: '🎴',
			title: 'ManaDeck',
			description: 'Intelligent flashcard learning platform',
			color: '#8B5CF6'
		},
		{
			icon: '📖',
			title: 'Storyteller',
			description: 'Creative writing with AI assistance',
			color: '#F59E0B'
		},
		{
			icon: '⚡',
			title: 'ManaCore',
			description: 'Universal account and organization management',
			color: '#6366F1'
		},
		{
			icon: '🔐',
			title: 'Single Sign-On',
			description: 'One account for all Mana applications',
			color: '#10B981'
		},
		{
			icon: '🌍',
			title: 'Cross-Platform',
			description: 'Web, iOS, and Android support',
			color: '#EC4899'
		}
	],
	dashboardRoute: '/dashboard'
};

/**
 * Get app configuration by app name
 * Returns default Mana config if app not found
 */
export function getAppConfig(appName?: string | null): AppConfig {
	if (!appName) {
		return defaultManaConfig;
	}

	const normalizedName = appName.toLowerCase().trim();
	return appConfigs[normalizedName] || defaultManaConfig;
}
