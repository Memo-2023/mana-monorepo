import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Cards-specific onboarding steps
 */
const cardsOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Cards!',
		description: 'Das kann Cards für dich tun:',
		emoji: '🃏',
		gradient: { from: 'blue-500', to: 'blue-700' },
		bullets: [
			'Kartendecks erstellen & lernen',
			'Spaced Repetition für optimales Lernen',
			'Fortschritt tracken',
			'Verschiedene Kartentypen',
		],
	},
	{
		id: 'startAction',
		type: 'select',
		question: 'Wie möchtest du starten?',
		description: 'Du kannst alles jederzeit nachholen.',
		emoji: '🃏',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: 'create',
				label: 'Neues Deck erstellen',
				description: 'Starte mit eigenen Lernkarten',
				emoji: '✏️',
			},
			{
				id: 'explore',
				label: 'Decks entdecken',
				description: 'Finde geteilte Lernsets',
				emoji: '🔍',
			},
			{
				id: 'later',
				label: 'Erstmal umschauen',
				description: 'Die App in Ruhe erkunden',
				emoji: '👀',
			},
		],
		defaultValue: 'later',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Cards ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Erstelle Decks mit Lernkarten für Spaced Repetition',
			'Nutze die tägliche Lernrunde für optimales Lernen',
			'Entdecke öffentliche Decks anderer Nutzer',
			"Drücke 'F' für den Fokus-Modus beim Lernen",
		],
	},
];

/**
 * Cards app onboarding store
 */
export const cardsOnboarding = createAppOnboardingStore({
	appId: 'cards',
	steps: cardsOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
