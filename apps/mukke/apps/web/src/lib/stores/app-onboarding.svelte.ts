import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const mukkeOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Mukke!',
		description: 'Das kann Mukke für dich tun:',
		emoji: '🎵',
		gradient: { from: 'purple-500', to: 'purple-700' },
		bullets: [
			'Musik-Bibliothek mit Alben & Künstlern',
			'Playlists erstellen & verwalten',
			'Beat-Editor mit Waveform-Visualisierung',
			'BPM-Erkennung & Lyrics-Sync',
		],
	},
	{
		id: 'viewMode',
		type: 'select',
		question: 'Wie möchtest du deine Bibliothek sehen?',
		description: 'Du kannst die Ansicht jederzeit wechseln.',
		emoji: '📚',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'grid',
				label: 'Grid-Ansicht',
				description: 'Cover-Art im Raster (Empfohlen)',
				emoji: '🎨',
			},
			{
				id: 'list',
				label: 'Listenansicht',
				description: 'Kompakte Liste mit Details',
				emoji: '📋',
			},
		],
		defaultValue: 'grid',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Deine Musik wartet!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Lade Songs per Drag & Drop hoch',
			'ID3-Tags werden automatisch erkannt',
			'Erstelle Projekte im Beat-Editor',
			'Exportiere synchronisierte Lyrics als LRC oder SRT',
		],
	},
];

export const mukkeOnboarding = createAppOnboardingStore({
	appId: 'mukke',
	steps: mukkeOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
