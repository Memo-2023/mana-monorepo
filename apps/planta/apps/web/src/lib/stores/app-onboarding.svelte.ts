import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const plantaOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Planta!',
		description: 'Das kann Planta für dich tun:',
		emoji: '🌱',
		gradient: { from: 'green-500', to: 'green-700' },
		bullets: [
			'Pflanzen per Foto identifizieren (KI)',
			'Gieß-Erinnerungen & Pflege-Zeitplan',
			'Pflege-Tipps & Gesundheits-Tracking',
			'Licht-, Wasser- & Feuchtigkeitsempfehlungen',
		],
	},
	{
		id: 'experience',
		type: 'select',
		question: 'Wie erfahren bist du mit Pflanzen?',
		description: 'Hilft uns, die Tipps anzupassen.',
		emoji: '🌿',
		gradient: { from: 'emerald-500', to: 'emerald-700' },
		options: [
			{
				id: 'beginner',
				label: 'Anfänger',
				description: 'Gerade erst angefangen',
				emoji: '🌱',
			},
			{
				id: 'intermediate',
				label: 'Fortgeschritten',
				description: 'Einige Pflanzen zu Hause',
				emoji: '🪴',
			},
			{
				id: 'expert',
				label: 'Profi',
				description: 'Grüner Daumen seit Jahren',
				emoji: '🌳',
			},
		],
		defaultValue: 'beginner',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Dein Pflanzengarten ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Fotografiere eine Pflanze, um sie zu identifizieren',
			'Gieß-Erinnerungen kommen automatisch',
			'Prüfe regelmäßig den Gesundheitsstatus',
			'Notiere Standort und Lichtverhältnisse',
		],
	},
];

export const plantaOnboarding = createAppOnboardingStore({
	appId: 'planta',
	steps: plantaOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
