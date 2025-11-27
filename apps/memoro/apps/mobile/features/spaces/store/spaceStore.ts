import { create } from 'zustand';

interface SpaceState {
	// Current selected space ID
	currentSpaceId: string | null;
	// Actions
	setCurrentSpaceId: (spaceId: string | null) => void;
	clearCurrentSpaceId: () => void;
}

/**
 * Store for managing space-related state
 * Uses Zustand for state management
 */
export const useSpaceStore = create<SpaceState>((set) => ({
	// Initial state
	currentSpaceId: null,

	// Actions
	setCurrentSpaceId: (spaceId) => set({ currentSpaceId: spaceId }),
	clearCurrentSpaceId: () => set({ currentSpaceId: null }),
}));
