import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Chat-specific onboarding steps
 */
const chatOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'defaultModel',
		type: 'select',
		question: 'Welches Modell bevorzugst du?',
		emoji: '💬',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: 'local',
				label: 'Lokale Modelle',
				description: 'Kostenlos, läuft auf eigenem Server',
				emoji: '🏠',
			},
			{
				id: 'cloud',
				label: 'Cloud-Modelle',
				description: 'Höhere Qualität, kostenpflichtig',
				emoji: '☁️',
			},
			{
				id: 'auto',
				label: 'Automatisch',
				description: 'Bestes Modell je nach Aufgabe (Empfohlen)',
				emoji: '🤖',
			},
		],
		defaultValue: 'auto',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Dein Chat ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Wähle verschiedene KI-Modelle je nach Aufgabe',
			'Nutze Konversationen, um Chatverläufe zu organisieren',
			'Lokale Modelle sind kostenlos und datenschutzfreundlich',
			'Cloud-Modelle bieten höhere Qualität für komplexe Aufgaben',
		],
	},
];

/**
 * Chat app onboarding store
 */
export const chatOnboarding = createAppOnboardingStore({
	appId: 'chat',
	steps: chatOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
