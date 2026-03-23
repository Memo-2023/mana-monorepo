import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Presi-specific onboarding steps
 */
const presiOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Presi!',
		description: 'Das kann Presi für dich tun:',
		emoji: '🎬',
		gradient: { from: 'blue-500', to: 'blue-700' },
		bullets: [
			'Präsentationen erstellen & bearbeiten',
			'Slide-Editor mit verschiedenen Folientypen',
			'Presenter-Modus für Vorträge',
			'Teilen über öffentliche Links',
		],
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Willkommen bei Presi!',
		description: 'Hier sind einige Tipps für den Start:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Erstelle Präsentationen mit verschiedenen Folientypen',
			'Nutze den Vollbild-Modus für Vorträge',
			'Teile Präsentationen über öffentliche Links',
			'Wende Themes an, um das Design anzupassen',
		],
	},
];

/**
 * Presi app onboarding store
 */
export const presiOnboarding = createAppOnboardingStore({
	appId: 'presi',
	steps: presiOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
