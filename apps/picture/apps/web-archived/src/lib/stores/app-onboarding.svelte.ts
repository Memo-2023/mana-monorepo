import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Picture-specific onboarding steps
 */
const pictureOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Picture!',
		description: 'Das kann Picture für dich tun:',
		emoji: '🎨',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		bullets: [
			'KI-Bilder generieren',
			'Verschiedene Modelle & Stile',
			'Galerie mit Grid-Ansicht',
			'Bilder teilen & herunterladen',
		],
	},
	{
		id: 'viewMode',
		type: 'select',
		question: 'Wie möchtest du deine Bilder sehen?',
		description: 'Du kannst die Ansicht jederzeit wechseln.',
		emoji: '🎨',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'single',
				label: 'Einzelansicht',
				description: 'Große Vorschau, ein Bild pro Zeile',
				emoji: '🖼️',
			},
			{
				id: 'grid-2',
				label: 'Grid (2 Spalten)',
				description: 'Mittlere Übersicht (Empfohlen)',
				emoji: '📐',
			},
			{
				id: 'grid-3',
				label: 'Grid (3 Spalten)',
				description: 'Kompakte Übersicht',
				emoji: '📊',
			},
		],
		defaultValue: 'grid-2',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Deine Galerie ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Generiere KI-Bilder mit verschiedenen Stilen',
			'Erstelle Moodboards, um Bilder zu gruppieren',
			'3 kostenlose Generierungen sind inklusive',
			'Nutze Tags für bessere Organisation',
		],
	},
];

/**
 * Picture app onboarding store
 */
export const pictureOnboarding = createAppOnboardingStore({
	appId: 'picture',
	steps: pictureOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
