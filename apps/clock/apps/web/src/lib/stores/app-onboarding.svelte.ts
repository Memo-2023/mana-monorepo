import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Clock-specific onboarding steps
 */
const clockOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'defaultTimer',
		type: 'select',
		question: 'Welche Timer-Dauer nutzt du am häufigsten?',
		description: 'Du kannst Timer jederzeit individuell einstellen.',
		emoji: '⏱️',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: '5',
				label: '5 Minuten',
				description: 'Für kurze Pausen',
				emoji: '⚡',
			},
			{
				id: '15',
				label: '15 Minuten',
				description: 'Für konzentrierte Einheiten',
				emoji: '🎯',
			},
			{
				id: '25',
				label: '25 Minuten',
				description: 'Pomodoro-Technik (Empfohlen)',
				emoji: '🍅',
			},
			{
				id: '45',
				label: '45 Minuten',
				description: 'Für längere Arbeitsphasen',
				emoji: '🧘',
			},
		],
		defaultValue: '25',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Deine Uhr ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Nutze die Stoppuhr für freie Zeitmessung',
			'Stelle Wecker für wichtige Erinnerungen',
			'Die Weltuhr zeigt mehrere Zeitzonen gleichzeitig',
			'Drücke Cmd/Ctrl+K für die Schnellsuche',
		],
	},
];

/**
 * Clock app onboarding store
 */
export const clockOnboarding = createAppOnboardingStore({
	appId: 'clock',
	steps: clockOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
