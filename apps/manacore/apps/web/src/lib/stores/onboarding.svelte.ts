/**
 * Onboarding Store
 * Tracks user onboarding progress and completion status
 */

import { STORAGE_KEYS } from '$lib/config/storage-keys';

const STORAGE_KEY = STORAGE_KEYS.ONBOARDING;

interface OnboardingState {
	completed: boolean;
	currentStep: number;
	completedSteps: string[];
	skipped: boolean;
	startedAt: string | null;
	completedAt: string | null;
}

function createOnboardingStore() {
	let state = $state<OnboardingState>({
		completed: false,
		currentStep: 0,
		completedSteps: [],
		skipped: false,
		startedAt: null,
		completedAt: null,
	});

	// Load from localStorage on init
	function load() {
		if (typeof localStorage === 'undefined') return;

		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				state = { ...state, ...parsed };
			} catch {
				// Ignore parse errors
			}
		}
	}

	// Save to localStorage
	function save() {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}

	return {
		get completed() {
			return state.completed;
		},
		get currentStep() {
			return state.currentStep;
		},
		get completedSteps() {
			return state.completedSteps;
		},
		get skipped() {
			return state.skipped;
		},
		get shouldShow() {
			return !state.completed && !state.skipped;
		},

		load,

		start() {
			state.startedAt = new Date().toISOString();
			state.currentStep = 0;
			save();
		},

		nextStep() {
			state.currentStep++;
			save();
		},

		prevStep() {
			if (state.currentStep > 0) {
				state.currentStep--;
				save();
			}
		},

		goToStep(step: number) {
			state.currentStep = step;
			save();
		},

		completeStep(stepId: string) {
			if (!state.completedSteps.includes(stepId)) {
				state.completedSteps = [...state.completedSteps, stepId];
				save();
			}
		},

		complete() {
			state.completed = true;
			state.completedAt = new Date().toISOString();
			save();
		},

		skip() {
			state.skipped = true;
			save();
		},

		reset() {
			state = {
				completed: false,
				currentStep: 0,
				completedSteps: [],
				skipped: false,
				startedAt: null,
				completedAt: null,
			};
			save();
		},
	};
}

export const onboardingStore = createOnboardingStore();
