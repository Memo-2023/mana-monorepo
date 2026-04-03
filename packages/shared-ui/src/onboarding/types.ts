import type { UserSettingsStore } from '@manacore/shared-theme';

/**
 * Option for a selection-based onboarding step
 */
export interface AppOnboardingOption {
	/** Unique identifier for this option */
	id: string;
	/** Display label */
	label: string;
	/** Optional description */
	description?: string;
	/** Optional emoji icon */
	emoji?: string;
}

/**
 * Step type determines the UI component used
 */
export type AppOnboardingStepType = 'select' | 'toggle' | 'info';

/**
 * Base step configuration
 */
export interface AppOnboardingStepBase {
	/** Unique identifier for this step */
	id: string;
	/** Question or title for this step */
	question: string;
	/** Optional subtitle/description */
	description?: string;
	/** Emoji icon for the step header */
	emoji?: string;
	/** Gradient colors for the icon background */
	gradient?: { from: string; to: string };
	/** Whether this step can be skipped */
	skippable?: boolean;
}

/**
 * Selection step - user picks one option
 */
export interface AppOnboardingSelectStep extends AppOnboardingStepBase {
	type: 'select';
	/** Available options */
	options: AppOnboardingOption[];
	/** Default selected value */
	defaultValue?: string;
}

/**
 * Toggle step - user enables/disables something
 */
export interface AppOnboardingToggleStep extends AppOnboardingStepBase {
	type: 'toggle';
	/** Default toggle state */
	defaultValue?: boolean;
	/** Label when enabled */
	enabledLabel?: string;
	/** Label when disabled */
	disabledLabel?: string;
}

/**
 * Info step - just shows information, no input
 */
export interface AppOnboardingInfoStep extends AppOnboardingStepBase {
	type: 'info';
	/** Bullet points to display */
	bullets?: string[];
}

/**
 * Union type for all step types
 */
export type AppOnboardingStep =
	| AppOnboardingSelectStep
	| AppOnboardingToggleStep
	| AppOnboardingInfoStep;

/**
 * Configuration for creating an app onboarding store
 */
export interface AppOnboardingConfig {
	/** App identifier (e.g., 'calendar', 'todo', 'chat') */
	appId: string;
	/** Steps to show in the onboarding */
	steps: AppOnboardingStep[];
	/** User settings store instance (for deviceSettings access) */
	userSettings: UserSettingsStore;
	/** Optional callback when onboarding completes */
	onComplete?: (preferences: Record<string, unknown>) => void | Promise<void>;
	/** Optional callback when onboarding is skipped */
	onSkip?: () => void | Promise<void>;
}

/**
 * Collected preferences from completed steps
 */
export type AppOnboardingPreferences = Record<string, unknown>;

/**
 * App onboarding store interface
 */
export interface AppOnboardingStore {
	/** Whether the onboarding modal should be shown */
	readonly shouldShow: boolean;
	/** Current step index (0-based) */
	readonly currentStep: number;
	/** Total number of steps */
	readonly totalSteps: number;
	/** Whether on the first step */
	readonly isFirstStep: boolean;
	/** Whether on the last step */
	readonly isLastStep: boolean;
	/** Progress percentage (0-100) */
	readonly progress: number;
	/** Current step configuration */
	readonly currentStepConfig: AppOnboardingStep | undefined;
	/** Collected preferences so far */
	readonly preferences: AppOnboardingPreferences;
	/** Whether currently saving */
	readonly saving: boolean;
	/** App ID */
	readonly appId: string;
	/** All step configurations */
	readonly steps: AppOnboardingStep[];

	/** Go to next step */
	next: () => void;
	/** Go to previous step */
	prev: () => void;
	/** Go to specific step */
	goToStep: (index: number) => void;
	/** Set a preference value */
	setPreference: (key: string, value: unknown) => void;
	/** Complete the onboarding and save preferences */
	complete: () => Promise<void>;
	/** Skip the onboarding entirely */
	skip: () => Promise<void>;
	/** Reset onboarding (for testing/debugging) */
	reset: () => Promise<void>;
	/** Check if onboarding was completed (reads from deviceSettings) */
	checkCompleted: () => boolean;
}

/**
 * Props for the MiniOnboardingModal component
 */
export interface MiniOnboardingModalProps {
	/** The onboarding store instance */
	store: AppOnboardingStore;
	/** App name for display */
	appName: string;
	/** Optional app icon/emoji */
	appEmoji?: string;
}
