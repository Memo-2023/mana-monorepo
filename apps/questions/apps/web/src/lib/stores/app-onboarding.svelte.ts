import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const questionsOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Questions!',
		description: 'Das kann Questions für dich tun:',
		emoji: '🔬',
		gradient: { from: 'violet-500', to: 'violet-700' },
		bullets: [
			'Fragen stellen & recherchieren lassen',
			'Web-Suche & automatische Quellenextraktion',
			'KI-generierte Antworten aus Quellen',
			'Sammlungen für bessere Organisation',
		],
	},
	{
		id: 'researchDepth',
		type: 'select',
		question: 'Wie gründlich soll die Recherche sein?',
		description: 'Du kannst die Tiefe pro Frage anpassen.',
		emoji: '🔍',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'quick',
				label: 'Schnell',
				description: '5 Quellen, schnelle Antwort',
				emoji: '⚡',
			},
			{
				id: 'standard',
				label: 'Standard',
				description: '15 Quellen mit Extraktion (Empfohlen)',
				emoji: '📖',
			},
			{
				id: 'deep',
				label: 'Gründlich',
				description: '30 Quellen, alle Kategorien',
				emoji: '🔬',
			},
		],
		defaultValue: 'standard',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Dein Recherche-Assistent ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Stelle präzise Fragen für bessere Ergebnisse',
			'Nutze Sammlungen, um Themen zu gruppieren',
			'Quellen werden automatisch extrahiert',
			'Bewerte Antworten, um die Qualität zu verbessern',
		],
	},
];

export const questionsOnboarding = createAppOnboardingStore({
	appId: 'questions',
	steps: questionsOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
