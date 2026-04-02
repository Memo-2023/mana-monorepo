import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Storage-specific onboarding steps
 */
const storageOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Storage!',
		description: 'Das kann Storage für dich tun:',
		emoji: '☁️',
		gradient: { from: 'blue-500', to: 'blue-700' },
		bullets: [
			'Dateien hochladen & verwalten',
			'Ordnerstruktur & Tags',
			'Sichere Links mit Passwortschutz',
			'Drag & Drop Upload',
		],
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Willkommen bei Storage!',
		description: 'Hier sind einige Tipps für den Start:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Lade Dateien per Drag & Drop hoch',
			'Organisiere Inhalte in Ordnern',
			'Teile Dateien über sichere Links mit Passwortschutz',
			'Nutze Favoriten und Tags für schnellen Zugriff',
		],
	},
];

/**
 * Storage app onboarding store
 */
export const storageOnboarding = createAppOnboardingStore({
	appId: 'storage',
	steps: storageOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
