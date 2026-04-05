import type {
	AppOnboardingConfig,
	AppOnboardingStore,
	AppOnboardingPreferences,
	AppOnboardingStep,
} from './types';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const ONBOARDING_PREFERENCES_KEY = 'onboarding_preferences';

/**
 * Create an app-specific onboarding store
 *
 * This factory creates a store that:
 * - Checks if onboarding was already completed (via deviceSettings)
 * - Manages step navigation and preference collection
 * - Saves completion state and preferences to deviceSettings
 *
 * @example
 * ```typescript
 * import { createAppOnboardingStore } from '@mana/shared-app-onboarding';
 *
 * const calendarOnboarding = createAppOnboardingStore({
 *   appId: 'calendar',
 *   steps: [
 *     {
 *       id: 'weekStart',
 *       type: 'select',
 *       question: 'Wann beginnt deine Woche?',
 *       emoji: '📅',
 *       options: [
 *         { id: 'monday', label: 'Montag', emoji: '1️⃣' },
 *         { id: 'sunday', label: 'Sonntag', emoji: '7️⃣' },
 *       ],
 *       defaultValue: 'monday',
 *     },
 *   ],
 *   userSettings,
 * });
 * ```
 */
export function createAppOnboardingStore(config: AppOnboardingConfig): AppOnboardingStore {
	const { appId, steps, userSettings, onComplete, onSkip } = config;

	// State
	let currentStep = $state(0);
	let preferences = $state<AppOnboardingPreferences>({});
	let saving = $state(false);
	let completed = $state(false);

	// Initialize preferences with default values
	for (const step of steps) {
		if (step.type === 'select' && step.defaultValue !== undefined) {
			preferences[step.id] = step.defaultValue;
		} else if (step.type === 'toggle' && step.defaultValue !== undefined) {
			preferences[step.id] = step.defaultValue;
		}
	}

	// Derived values
	const totalSteps = $derived(steps.length);
	const isFirstStep = $derived(currentStep === 0);
	const isLastStep = $derived(currentStep === steps.length - 1);
	const progress = $derived(((currentStep + 1) / steps.length) * 100);
	const currentStepConfig = $derived<AppOnboardingStep | undefined>(steps[currentStep]);

	/**
	 * Check if onboarding was already completed
	 */
	function checkCompleted(): boolean {
		const deviceAppSettings = userSettings.getDeviceAppSettings();
		return deviceAppSettings[ONBOARDING_COMPLETED_KEY] === true;
	}

	// Derived: should show modal
	const shouldShow = $derived(!completed && !checkCompleted() && userSettings.loaded);

	/**
	 * Go to next step
	 */
	function next(): void {
		if (currentStep < steps.length - 1) {
			currentStep++;
		}
	}

	/**
	 * Go to previous step
	 */
	function prev(): void {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	/**
	 * Go to specific step
	 */
	function goToStep(index: number): void {
		if (index >= 0 && index < steps.length) {
			currentStep = index;
		}
	}

	/**
	 * Set a preference value
	 */
	function setPreference(key: string, value: unknown): void {
		preferences = { ...preferences, [key]: value };
	}

	/**
	 * Complete the onboarding and save preferences
	 */
	async function complete(): Promise<void> {
		saving = true;
		try {
			// Save to deviceSettings
			await userSettings.updateDeviceAppSettings({
				[ONBOARDING_COMPLETED_KEY]: true,
				[ONBOARDING_PREFERENCES_KEY]: preferences,
				...preferences, // Also spread preferences at top level for easy access
			});

			completed = true;

			// Call completion callback
			if (onComplete) {
				await onComplete(preferences);
			}
		} finally {
			saving = false;
		}
	}

	/**
	 * Skip the onboarding entirely
	 */
	async function skip(): Promise<void> {
		saving = true;
		try {
			// Mark as completed but don't save preferences
			await userSettings.updateDeviceAppSettings({
				[ONBOARDING_COMPLETED_KEY]: true,
				onboarding_skipped: true,
			});

			completed = true;

			// Call skip callback
			if (onSkip) {
				await onSkip();
			}
		} finally {
			saving = false;
		}
	}

	/**
	 * Reset onboarding (for testing/debugging)
	 */
	async function reset(): Promise<void> {
		saving = true;
		try {
			// Remove onboarding flags from deviceSettings
			await userSettings.updateDeviceAppSettings({
				[ONBOARDING_COMPLETED_KEY]: false,
				onboarding_skipped: false,
			});

			completed = false;
			currentStep = 0;

			// Reset preferences to defaults
			preferences = {};
			for (const step of steps) {
				if (step.type === 'select' && step.defaultValue !== undefined) {
					preferences[step.id] = step.defaultValue;
				} else if (step.type === 'toggle' && step.defaultValue !== undefined) {
					preferences[step.id] = step.defaultValue;
				}
			}
		} finally {
			saving = false;
		}
	}

	return {
		get shouldShow() {
			return shouldShow;
		},
		get currentStep() {
			return currentStep;
		},
		get totalSteps() {
			return totalSteps;
		},
		get isFirstStep() {
			return isFirstStep;
		},
		get isLastStep() {
			return isLastStep;
		},
		get progress() {
			return progress;
		},
		get currentStepConfig() {
			return currentStepConfig;
		},
		get preferences() {
			return preferences;
		},
		get saving() {
			return saving;
		},
		get appId() {
			return appId;
		},
		get steps() {
			return steps;
		},

		next,
		prev,
		goToStep,
		setPreference,
		complete,
		skip,
		reset,
		checkCompleted,
	};
}
