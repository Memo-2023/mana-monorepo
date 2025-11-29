import { create } from 'zustand';

interface AppState {
	isInitialized: boolean;
	isOnline: boolean;
	currentScreen: 'home' | 'camera' | 'detail' | 'settings';

	// UI States
	showCameraModal: boolean;
	cameraMode: 'camera' | 'gallery' | null;
	isPhotoProcessing: boolean;

	// User Preferences
	defaultMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
	enableNotifications: boolean;
	preferredUnits: 'metric' | 'imperial';
	theme: 'light' | 'dark' | 'system';

	// Stats Cache
	statsCache: {
		totalMeals: number;
		avgCalories: number;
		avgHealthScore: number;
		lastUpdated: string | null;
	};

	// Actions
	setInitialized: (initialized: boolean) => void;
	setOnlineStatus: (online: boolean) => void;
	setCurrentScreen: (screen: AppState['currentScreen']) => void;
	toggleCameraModal: (show?: boolean, mode?: 'camera' | 'gallery') => void;
	setPhotoProcessing: (processing: boolean) => void;
	updateUserPreferences: (
		prefs: Partial<
			Pick<AppState, 'defaultMealType' | 'enableNotifications' | 'preferredUnits' | 'theme'>
		>
	) => void;
	setTheme: (theme: 'light' | 'dark' | 'system') => void;
	updateStatsCache: (stats: Omit<AppState['statsCache'], 'lastUpdated'>) => void;
	resetStats: () => void;
	resetToDefaults: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
	isInitialized: false,
	isOnline: true,
	currentScreen: 'home',
	showCameraModal: false,
	cameraMode: null,
	isPhotoProcessing: false,
	defaultMealType: null,
	enableNotifications: true,
	preferredUnits: 'metric',
	theme: 'system',
	statsCache: {
		totalMeals: 0,
		avgCalories: 0,
		avgHealthScore: 0,
		lastUpdated: null,
	},

	setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

	setOnlineStatus: (online: boolean) => set({ isOnline: online }),

	setCurrentScreen: (screen: AppState['currentScreen']) => set({ currentScreen: screen }),

	toggleCameraModal: (show?: boolean, mode?: 'camera' | 'gallery') => {
		const currentShow = get().showCameraModal;
		const newShow = show !== undefined ? show : !currentShow;
		set({
			showCameraModal: newShow,
			cameraMode: newShow ? mode || 'camera' : null,
		});
	},

	setPhotoProcessing: (processing: boolean) => set({ isPhotoProcessing: processing }),

	updateUserPreferences: (prefs) => set(prefs),

	setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),

	updateStatsCache: (stats) =>
		set({
			statsCache: {
				...stats,
				lastUpdated: new Date().toISOString(),
			},
		}),

	resetStats: () =>
		set({
			statsCache: {
				totalMeals: 0,
				avgCalories: 0,
				avgHealthScore: 0,
				lastUpdated: null,
			},
		}),

	resetToDefaults: () =>
		set({
			isInitialized: false,
			currentScreen: 'home',
			showCameraModal: false,
			cameraMode: null,
			isPhotoProcessing: false,
			defaultMealType: null,
			enableNotifications: true,
			preferredUnits: 'metric',
			statsCache: {
				totalMeals: 0,
				avgCalories: 0,
				avgHealthScore: 0,
				lastUpdated: null,
			},
		}),
}));
