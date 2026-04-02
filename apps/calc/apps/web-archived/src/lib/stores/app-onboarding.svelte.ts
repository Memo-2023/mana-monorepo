import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

const calcOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Calc!',
		description: 'Das kann Calc:',
		emoji: '🧮',
		gradient: { from: 'pink-500', to: 'pink-700' },
		bullets: [
			'Standard, Wissenschaftlich & Programmierer',
			'Einheiten- & Währungsrechner',
			'Finanzrechner (Zins, Kredit, Sparplan)',
			'Historische Taschenrechner-Skins',
		],
	},
	{
		id: 'defaultMode',
		type: 'select',
		question: 'Welchen Modus nutzt du am häufigsten?',
		description: 'Du kannst jederzeit wechseln.',
		emoji: '🔢',
		gradient: { from: 'pink-500', to: 'pink-700' },
		options: [
			{ id: 'standard', label: 'Standard', description: 'Grundrechenarten', emoji: '➕' },
			{
				id: 'scientific',
				label: 'Wissenschaftlich',
				description: 'sin, cos, log & mehr',
				emoji: '🔬',
			},
			{ id: 'programmer', label: 'Programmierer', description: 'HEX, BIN, OCT', emoji: '💻' },
			{ id: 'converter', label: 'Einheiten', description: 'Umrechnen leicht gemacht', emoji: '📏' },
		],
		defaultValue: 'standard',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Dein Rechner ist bereit!',
		description: 'Tipps:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Tastatur-Eingabe funktioniert überall',
			'Verlauf speichert alle Berechnungen',
			'Wechsle Skins für verschiedene Looks',
			'Drücke Cmd/Ctrl+K für Schnellzugriff',
		],
	},
];

export const calcOnboarding = createAppOnboardingStore({
	appId: 'calc',
	steps: calcOnboardingSteps,
	userSettings,
	onComplete: async () => {},
	onSkip: async () => {},
});
