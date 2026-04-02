import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Context-specific onboarding steps
 */
const contextOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Context!',
		description: 'Das kann Context für dich tun:',
		emoji: '📄',
		gradient: { from: 'blue-500', to: 'blue-700' },
		bullets: [
			'Dokumente & Wissen organisieren',
			'KI-gestützte Zusammenfassungen',
			'Persönliche Wissensdatenbank',
			'Schnelle Volltextsuche',
		],
	},
	{
		id: 'useCase',
		type: 'select',
		question: 'Wofür nutzt du Context?',
		description: 'Hilft uns, die beste Erfahrung zu bieten.',
		emoji: '📄',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: 'docs',
				label: 'Dokumentation',
				description: 'Technische Dokumente und Anleitungen',
				emoji: '📖',
			},
			{
				id: 'knowledge',
				label: 'Wissensdatenbank',
				description: 'Wissen sammeln und organisieren',
				emoji: '🧠',
			},
			{
				id: 'personal',
				label: 'Persönliche Notizen',
				description: 'Ideen und Gedanken festhalten',
				emoji: '✍️',
			},
		],
		defaultValue: 'knowledge',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Context ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Nutze KI, um Dokumente zusammenzufassen und umzuschreiben',
			'Organisiere Inhalte in Spaces für bessere Übersicht',
			'Versionierung speichert automatisch frühere Fassungen',
			'Drücke Cmd/Ctrl+K für die Schnellsuche',
		],
	},
];

/**
 * Context app onboarding store
 */
export const contextOnboarding = createAppOnboardingStore({
	appId: 'context',
	steps: contextOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
