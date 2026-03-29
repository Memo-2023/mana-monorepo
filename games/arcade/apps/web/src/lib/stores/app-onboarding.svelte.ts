import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const onboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Arcade!',
		description: 'Das erwartet dich:',
		emoji: '🎮',
		gradient: { from: 'green-500', to: 'green-700' },
		bullets: [
			'22+ Browser-Spiele direkt spielbar',
			'KI-Spielgenerator: Erstelle eigene Games',
			'Statistiken: Highscores & Spielzeit',
			'Community: Reiche eigene Spiele ein',
		],
	},
	{
		id: 'welcome',
		type: 'info',
		question: "Los geht's!",
		description: 'Tipps:',
		emoji: '🕹️',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Cmd/Ctrl+K für Schnellsuche',
			'Spiele laufen komplett im Browser',
			'Stats werden lokal gespeichert',
			'Anmelden synchronisiert deine Daten',
		],
	},
];

export const gamesOnboarding = createAppOnboardingStore({
	appId: 'arcade',
	steps: onboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
