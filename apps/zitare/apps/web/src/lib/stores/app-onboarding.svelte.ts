import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const zitareOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Zitare!',
		description: 'Das kann Zitare für dich tun:',
		emoji: '✨',
		gradient: { from: 'amber-500', to: 'amber-700' },
		bullets: [
			'Tägliche Inspiration durch ausgewählte Zitate',
			'Zitate-Sammlung zum Stöbern & Entdecken',
			'Immersiver Lesemodus für ungestörtes Lesen',
			'Favoriten & eigene Listen erstellen',
		],
	},
	{
		id: 'displayMode',
		type: 'select',
		question: 'Wie möchtest du Zitate lesen?',
		description: 'Du kannst den Modus jederzeit wechseln.',
		emoji: '👁️',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'compact',
				label: 'Kompakt',
				description: 'Übersichtliche Listenansicht',
				emoji: '📋',
			},
			{
				id: 'immersive',
				label: 'Immersiv',
				description: 'Großes Zitat mit Hintergrund (Empfohlen)',
				emoji: '🖼️',
			},
		],
		defaultValue: 'immersive',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Deine Zitate sind bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Swipe oder klicke für das nächste Zitat',
			'Markiere Favoriten mit dem Herz-Symbol',
			'Erstelle eigene Sammlungen',
			'Teile Zitate mit Freunden',
		],
	},
];

export const zitareOnboarding = createAppOnboardingStore({
	appId: 'zitare',
	steps: zitareOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
