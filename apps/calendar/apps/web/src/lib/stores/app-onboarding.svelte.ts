import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';

/**
 * Calendar-specific onboarding steps
 */
const calendarOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'weekStart',
		type: 'select',
		question: 'Wann beginnt deine Woche?',
		description: 'Diese Einstellung bestimmt die Anordnung deiner Kalenderansicht.',
		emoji: '📅',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: 'monday',
				label: 'Montag',
				description: 'Europäischer Standard',
				emoji: '1️⃣',
			},
			{
				id: 'sunday',
				label: 'Sonntag',
				description: 'Amerikanischer Standard',
				emoji: '7️⃣',
			},
		],
		defaultValue: 'monday',
	},
	{
		id: 'defaultView',
		type: 'select',
		question: 'Welche Ansicht bevorzugst du?',
		description: 'Du kannst die Ansicht jederzeit in der App wechseln.',
		emoji: '👁️',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'day',
				label: 'Tagesansicht',
				description: 'Detaillierte 24-Stunden-Timeline',
				emoji: '📆',
			},
			{
				id: 'week',
				label: 'Wochenansicht',
				description: '7-Tage-Übersicht (Empfohlen)',
				emoji: '🗓️',
			},
			{
				id: 'month',
				label: 'Monatsansicht',
				description: 'Kompakte Monatsübersicht',
				emoji: '📅',
			},
		],
		defaultValue: 'week',
	},
	{
		id: 'timezone',
		type: 'select',
		question: 'Welche Zeitzone verwendest du?',
		description: 'Termine werden in dieser Zeitzone angezeigt.',
		emoji: '🌍',
		gradient: { from: 'emerald-500', to: 'emerald-700' },
		options: [
			{
				id: 'auto',
				label: 'Automatisch erkennen',
				description: 'Basierend auf deinem Standort',
				emoji: '📍',
			},
			{
				id: 'Europe/Berlin',
				label: 'Berlin (MEZ/MESZ)',
				description: 'Deutschland, Österreich, Schweiz',
				emoji: '🇩🇪',
			},
			{
				id: 'Europe/London',
				label: 'London (GMT/BST)',
				description: 'Großbritannien',
				emoji: '🇬🇧',
			},
			{
				id: 'America/New_York',
				label: 'New York (EST/EDT)',
				description: 'US-Ostküste',
				emoji: '🇺🇸',
			},
		],
		defaultValue: 'auto',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Dein Kalender ist bereit!',
		description: 'Hier sind einige Tipps für den Start:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Nutze die Schnelleingabe unten, um Termine per Text zu erstellen',
			'Drücke "F" für den Fokus-Modus ohne Ablenkungen',
			'Pfeiltasten navigieren zwischen Tagen/Wochen',
			'Ziehe Termine per Drag & Drop auf neue Zeiten',
		],
	},
];

/**
 * Calendar app onboarding store
 *
 * Usage in components:
 * ```svelte
 * <script>
 *   import { calendarOnboarding } from '$lib/stores/app-onboarding.svelte';
 *   import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
 * </script>
 *
 * {#if calendarOnboarding.shouldShow}
 *   <MiniOnboardingModal
 *     store={calendarOnboarding}
 *     appName="Kalender"
 *     appEmoji="📅"
 *   />
 * {/if}
 * ```
 */
export const calendarOnboarding = createAppOnboardingStore({
	appId: 'calendar',
	steps: calendarOnboardingSteps,
	userSettings,
	onComplete: async (preferences) => {
		console.log('[Calendar] Onboarding completed with preferences:', preferences);

		// Apply preferences to the app
		// The preferences are automatically saved to deviceSettings by the store
		// Additional app-specific logic can go here (e.g., applying timezone, view settings)
	},
	onSkip: async () => {
		console.log('[Calendar] Onboarding skipped');
	},
});
