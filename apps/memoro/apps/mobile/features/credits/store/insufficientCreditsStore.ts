import { create } from 'zustand';

interface InsufficientCreditsStore {
	isModalVisible: boolean;
	setModalVisible: (visible: boolean) => void;
}

export const useInsufficientCreditsStore = create<InsufficientCreditsStore>((set) => ({
	isModalVisible: false,
	setModalVisible: (visible) => set({ isModalVisible: visible }),
}));
