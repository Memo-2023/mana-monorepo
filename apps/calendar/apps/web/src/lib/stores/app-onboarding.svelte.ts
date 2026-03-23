import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';
import { settingsStore } from './settings.svelte';
import type { CalendarViewType } from '@calendar/shared';

/**
 * Calendar-specific onboarding steps
 */
const calendarOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'features',
		type: 'info',
		question: 'Willkommen bei Kalender!',
		description: 'Das kann Kalender für dich tun:',
		emoji: '📅',
		gradient: { from: 'blue-500', to: 'blue-700' },
		bullets: [
			'Termine erstellen & verwalten',
			'Wochen-, Monats- & Agenda-Ansicht',
			'Schnelleingabe per Text',
			'Drag & Drop zum Verschieben',
		],
	},
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
			{
				id: 'agenda',
				label: 'Agenda',
				description: 'Chronologische Terminliste',
				emoji: '📋',
			},
		],
		defaultValue: 'week',
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
		// Apply week start preference
		if (preferences.weekStart === 'monday') {
			settingsStore.set('weekStartsOn', 1);
		} else if (preferences.weekStart === 'sunday') {
			settingsStore.set('weekStartsOn', 0);
		}

		// Apply default view preference
		const viewMap: Record<string, CalendarViewType> = {
			week: 'week',
			month: 'month',
			agenda: 'agenda',
		};
		const selectedView = preferences.defaultView as string;
		if (selectedView && viewMap[selectedView]) {
			settingsStore.set('defaultView', viewMap[selectedView]);
		}
	},
	onSkip: async () => {
		// Defaults are already sensible, nothing to do
	},
});
