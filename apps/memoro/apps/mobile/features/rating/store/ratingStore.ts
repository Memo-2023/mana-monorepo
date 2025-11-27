import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RatingState {
	// Tracking state
	hasRatedApp: boolean;
	hasDeclinedRating: boolean;
	neverAskAgain: boolean;
	memoCreatedCount: number;
	lastPromptDate: string | null;

	// Hydration tracking
	_hasHydrated: boolean;
	setHasHydrated: (hasHydrated: boolean) => void;

	// Actions
	incrementMemoCount: () => void;
	markRated: () => void;
	markDeclined: () => void;
	markNeverAsk: () => void;
	resetForTesting: () => void;
}

const initialState = {
	hasRatedApp: false,
	hasDeclinedRating: false,
	neverAskAgain: false,
	memoCreatedCount: 0,
	lastPromptDate: null,
	_hasHydrated: false,
};

export const useRatingStore = create<RatingState>()(
	persist(
		(set) => ({
			...initialState,

			setHasHydrated: (hasHydrated: boolean) => {
				set({ _hasHydrated: hasHydrated });
			},

			incrementMemoCount: () => {
				set((state) => ({
					memoCreatedCount: state.memoCreatedCount + 1,
				}));
			},

			markRated: () => {
				set({
					hasRatedApp: true,
					lastPromptDate: new Date().toISOString(),
				});
			},

			markDeclined: () => {
				set({
					hasDeclinedRating: true,
					lastPromptDate: new Date().toISOString(),
				});
			},

			markNeverAsk: () => {
				set({
					neverAskAgain: true,
					lastPromptDate: new Date().toISOString(),
				});
			},

			resetForTesting: () => {
				set({
					...initialState,
					_hasHydrated: true,
				});
			},
		}),
		{
			name: 'memoro-rating',
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		}
	)
);
