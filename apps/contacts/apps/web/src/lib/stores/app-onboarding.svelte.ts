import { createAppOnboardingStore, type AppOnboardingStep } from '@manacore/shared-app-onboarding';
import { userSettings } from './user-settings.svelte';
import { contactsFilterStore } from './filter.svelte';

/**
 * Contacts-specific onboarding steps
 */
const contactsOnboardingSteps: AppOnboardingStep[] = [
	{
		id: 'sortOrder',
		type: 'select',
		question: 'Wie sortierst du Kontakte?',
		description: 'Bestimmt die Reihenfolge deiner Kontaktliste.',
		emoji: '🔤',
		gradient: { from: 'blue-500', to: 'blue-700' },
		options: [
			{
				id: 'firstName',
				label: 'Vorname',
				description: 'Anna, Max, Till ...',
				emoji: '👤',
			},
			{
				id: 'lastName',
				label: 'Nachname',
				description: 'Müller, Schmidt, Weber ...',
				emoji: '📋',
			},
		],
		defaultValue: 'firstName',
	},
	{
		id: 'importSource',
		type: 'select',
		question: 'Kontakte importieren?',
		description: 'Du kannst jederzeit später über Daten importieren.',
		emoji: '📥',
		gradient: { from: 'indigo-500', to: 'indigo-700' },
		options: [
			{
				id: 'google',
				label: 'Google Kontakte',
				description: 'Über dein Google-Konto',
				emoji: '🔗',
			},
			{
				id: 'file',
				label: 'Datei (vCard/CSV)',
				description: 'Aus einer exportierten Datei',
				emoji: '📄',
			},
			{
				id: 'later',
				label: 'Später',
				description: 'Erstmal ohne Import starten',
				emoji: '⏭️',
			},
		],
		defaultValue: 'later',
	},
	{
		id: 'welcome',
		type: 'info',
		question: 'Deine Kontakte sind bereit!',
		description: 'Hier sind einige Tipps für den Start:',
		emoji: '🎉',
		gradient: { from: 'primary', to: 'primary/70' },
		bullets: [
			'Deine eigene Kontaktkarte ist schon angelegt — klick sie an und füll sie aus',
			'Nutze die Schnelleingabe unten, um Kontakte per Text zu erstellen',
			'Drücke "F" für den Fokus-Modus ohne Ablenkungen',
			'Tagge Kontakte für bessere Organisation',
		],
	},
];

/**
 * Contacts app onboarding store
 *
 * Usage in components:
 * ```svelte
 * <script>
 *   import { contactsOnboarding } from '$lib/stores/app-onboarding.svelte';
 *   import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
 * </script>
 *
 * {#if contactsOnboarding.shouldShow}
 *   <MiniOnboardingModal
 *     store={contactsOnboarding}
 *     appName="Kontakte"
 *     appEmoji="👥"
 *   />
 * {/if}
 * ```
 */
export const contactsOnboarding = createAppOnboardingStore({
	appId: 'contacts',
	steps: contactsOnboardingSteps,
	userSettings,
	onComplete: async (preferences) => {
		// Apply sort order preference
		const sortOrder = preferences.sortOrder as string;
		if (sortOrder === 'firstName' || sortOrder === 'lastName') {
			contactsFilterStore.setSortField(sortOrder);
		}

		// Import navigation is handled by the layout after onboarding completes
	},
	onSkip: async () => {
		// Defaults are sensible, nothing to do
	},
});
