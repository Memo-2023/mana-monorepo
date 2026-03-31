import { create } from 'zustand';

export interface SearchProvider {
	id: string;
	placeholder: string;
	onSearch: (query: string) => void;
	onClose?: () => void;
	currentIndex?: number;
	totalResults?: number;
	onNext?: () => void;
	onPrevious?: () => void;
}

interface GlobalSearchState {
	provider: SearchProvider | null;
	isActive: boolean;
	pendingActivation: boolean;
	registerProvider: (provider: SearchProvider) => void;
	unregisterProvider: (id: string) => void;
	updateProvider: (updates: Partial<SearchProvider>) => void;
	toggleSearch: () => void;
	closeSearch: () => void;
	requestSearch: () => void;
}

export const useGlobalSearchStore = create<GlobalSearchState>((set, get) => ({
	provider: null,
	isActive: false,
	pendingActivation: false,

	registerProvider: (provider) => {
		const { pendingActivation } = get();
		if (pendingActivation) {
			set({ provider, isActive: true, pendingActivation: false });
		} else {
			set({ provider });
		}
	},

	unregisterProvider: (id) => {
		const { provider } = get();
		if (provider?.id === id) {
			set({ provider: null, isActive: false });
		}
	},

	updateProvider: (updates) => {
		const { provider } = get();
		if (provider) {
			set({ provider: { ...provider, ...updates } });
		}
	},

	toggleSearch: () => {
		const { isActive, provider } = get();
		if (!provider) return;
		if (isActive) {
			provider.onClose?.();
			set({ isActive: false });
		} else {
			set({ isActive: true });
		}
	},

	closeSearch: () => {
		const { provider } = get();
		provider?.onClose?.();
		set({ isActive: false });
	},

	requestSearch: () => {
		const { provider } = get();
		if (provider) {
			// Provider already registered, activate immediately
			set({ isActive: true });
		} else {
			// Provider not yet mounted, set pending flag
			set({ pendingActivation: true });
		}
	},
}));
