import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const photosOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Photos!',
		description: 'Das kann Photos für dich tun:',
		emoji: '📸',
		gradient: { from: 'emerald-500', to: 'emerald-700' },
		bullets: [
			'Fotos aus allen ManaCore-Apps an einem Ort',
			'Alben erstellen & organisieren',
			'Smart-Alben nach Datum, Ort & Kamera',
			'EXIF-Daten & Metadaten anzeigen',
		],
	},
	{
		id: 'gridSize',
		type: 'select',
		question: 'Welche Galerie-Größe bevorzugst du?',
		description: 'Du kannst die Größe jederzeit anpassen.',
		emoji: '🖼️',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'small',
				label: 'Klein',
				description: 'Viele Fotos auf einen Blick',
				emoji: '🔍',
			},
			{
				id: 'medium',
				label: 'Mittel',
				description: 'Gute Balance (Empfohlen)',
				emoji: '📐',
			},
			{
				id: 'large',
				label: 'Groß',
				description: 'Detailreiche Vorschau',
				emoji: '🖼️',
			},
		],
		defaultValue: 'medium',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Deine Galerie ist bereit!',
		description: 'Hier sind einige Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Lade neue Fotos direkt per Drag & Drop hoch',
			'Markiere Favoriten für schnellen Zugriff',
			'Nutze Tags für bessere Organisation',
			'Smart-Alben werden automatisch erstellt',
		],
	},
];

export const photosOnboarding = createAppOnboardingStore({
	appId: 'photos',
	steps: photosOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
