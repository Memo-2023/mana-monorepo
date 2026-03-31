import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';
import { todoSettings } from './settings.svelte';

/**
 * Todo-specific onboarding steps
 */
const todoOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Todo!',
		description: 'Das kann Todo für dich tun:',
		emoji: '✅',
		gradient: { from: 'blue-500', to: 'blue-700' },
		bullets: [
			'Aufgaben erstellen & verwalten',
			'Heute-, Inbox- & Kanban-Ansichten',
			'Fälligkeiten & Prioritäten',
			'Schnelleingabe per Text',
		],
	},
	{
		id: 'defaultView',
		type: 'select',
		question: 'Wo möchtest du starten?',
		description: 'Du kannst die Ansicht jederzeit wechseln.',
		emoji: '📋',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: 'today',
				label: 'Heute',
				description: 'Tagesübersicht mit Fälligkeiten (Empfohlen)',
				emoji: '☀️',
			},
			{
				id: 'inbox',
				label: 'Eingang',
				description: 'Alle unsortierten Aufgaben',
				emoji: '📥',
			},
		],
		defaultValue: 'today',
	},
	{
		id: 'compactMode',
		type: 'select',
		question: 'Wie detailliert sollen Aufgaben angezeigt werden?',
		description: 'Bestimmt die Informationsdichte in der Aufgabenliste.',
		emoji: '👁️',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'normal',
				label: 'Normal',
				description: 'Mit Tags, Labels und Fälligkeit',
				emoji: '📝',
			},
			{
				id: 'compact',
				label: 'Kompakt',
				description: 'Nur Titel und Priorität',
				emoji: '📄',
			},
		],
		defaultValue: 'normal',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Bereit für produktive Tage!',
		description: 'Hier sind einige Tipps für den Start:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Schnelleingabe: "Meeting morgen 14 Uhr !hoch #wichtig"',
			'Nutze #Tags direkt beim Erstellen',
			'Drücke "F" für den Fokus-Modus ohne Ablenkungen',
			'Nutze Tags, um Aufgaben zu organisieren',
		],
	},
];

/**
 * Todo app onboarding store
 */
export const todoOnboarding = createAppOnboardingStore({
	appId: 'todo',
	steps: todoOnboardingSteps,
	userSettings,
	onComplete: async (preferences) => {
		// Apply default view
		const view = preferences.defaultView as string;
		if (view === 'today' || view === 'inbox') {
			todoSettings.set('defaultView', view);
		}

		// Apply compact mode
		if (preferences.compactMode === 'compact') {
			todoSettings.set('compactMode', true);
		}
	},
	onSkip: async () => {
		// Defaults are sensible, nothing to do
	},
});
