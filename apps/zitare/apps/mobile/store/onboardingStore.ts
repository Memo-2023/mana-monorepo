import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '~/constants/storageKeys';

interface OnboardingState {
	hasCompletedOnboarding: boolean;
	onboardingVersion: number;
	onboardingCompletedAt?: string;
	skipCount: number;

	// Actions
	completeOnboarding: () => void;
	skipOnboarding: () => void;
	resetOnboarding: () => void;
	shouldShowOnboarding: () => boolean;
}

const CURRENT_ONBOARDING_VERSION = 1;

export const useOnboardingStore = create<OnboardingState>()(
	persist(
		(set, get) => ({
			hasCompletedOnboarding: false,
			onboardingVersion: 0,
			skipCount: 0,

			completeOnboarding: () => {
				set({
					hasCompletedOnboarding: true,
					onboardingVersion: CURRENT_ONBOARDING_VERSION,
					onboardingCompletedAt: new Date().toISOString(),
				});
			},

			skipOnboarding: () => {
				set((state) => ({
					hasCompletedOnboarding: true,
					skipCount: state.skipCount + 1,
					onboardingVersion: CURRENT_ONBOARDING_VERSION,
				}));
			},

			resetOnboarding: () => {
				set({
					hasCompletedOnboarding: false,
					onboardingVersion: 0,
					onboardingCompletedAt: undefined,
					skipCount: 0,
				});
			},

			shouldShowOnboarding: () => {
				const state = get();
				// Show onboarding if not completed or if version is outdated
				return (
					!state.hasCompletedOnboarding || state.onboardingVersion < CURRENT_ONBOARDING_VERSION
				);
			},
		}),
		{
			name: STORAGE_KEYS.ONBOARDING,
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);
