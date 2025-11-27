import { create } from 'zustand';
import { ImageItem } from '~/types/gallery';

export interface GeneratingImage {
	// Temporary ID (will be replaced with real ID)
	tempId: string;

	// Generation parameters
	prompt: string;
	model_id: string;
	width: number;
	height: number;

	// Status tracking
	status: 'generating' | 'completed' | 'error';
	startTime: number;
	endTime?: number;
	generationTime?: number; // in seconds

	// Real image data (set when completed)
	realImageId?: string;
	imageUrl?: string;

	// Error info
	error?: string;
}

interface GeneratingImagesStore {
	// State
	generatingImages: Map<string, GeneratingImage>;

	// Actions
	addGeneratingImage: (image: Omit<GeneratingImage, 'tempId' | 'status' | 'startTime'>) => string;
	updateGeneratingImage: (tempId: string, updates: Partial<GeneratingImage>) => void;
	completeGeneratingImage: (
		tempId: string,
		realImage: Partial<ImageItem>,
		generationTime: number
	) => void;
	failGeneratingImage: (tempId: string, error: string) => void;
	removeGeneratingImage: (tempId: string) => void;
	clearCompletedImages: () => void;

	// Getters
	getGeneratingImage: (tempId: string) => GeneratingImage | undefined;
	getAllGeneratingImages: () => GeneratingImage[];
	getActiveGeneratingImages: () => GeneratingImage[];
}

export const useGeneratingImagesStore = create<GeneratingImagesStore>((set, get) => ({
	generatingImages: new Map(),

	addGeneratingImage: (image) => {
		const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const generatingImage: GeneratingImage = {
			...image,
			tempId,
			status: 'generating',
			startTime: Date.now(),
		};

		set((state) => {
			const newMap = new Map(state.generatingImages);
			newMap.set(tempId, generatingImage);
			return { generatingImages: newMap };
		});

		return tempId;
	},

	updateGeneratingImage: (tempId, updates) => {
		set((state) => {
			const newMap = new Map(state.generatingImages);
			const existing = newMap.get(tempId);
			if (existing) {
				newMap.set(tempId, { ...existing, ...updates });
			}
			return { generatingImages: newMap };
		});
	},

	completeGeneratingImage: (tempId, realImage, generationTime) => {
		set((state) => {
			const newMap = new Map(state.generatingImages);
			const existing = newMap.get(tempId);
			if (existing) {
				newMap.set(tempId, {
					...existing,
					status: 'completed',
					endTime: Date.now(),
					generationTime,
					realImageId: realImage.id,
					imageUrl: realImage.image_url,
				});
			}
			return { generatingImages: newMap };
		});

		// Auto-remove after 5 seconds
		setTimeout(() => {
			get().removeGeneratingImage(tempId);
		}, 5000);
	},

	failGeneratingImage: (tempId, error) => {
		set((state) => {
			const newMap = new Map(state.generatingImages);
			const existing = newMap.get(tempId);
			if (existing) {
				newMap.set(tempId, {
					...existing,
					status: 'error',
					endTime: Date.now(),
					error,
				});
			}
			return { generatingImages: newMap };
		});

		// Auto-remove after 5 seconds
		setTimeout(() => {
			get().removeGeneratingImage(tempId);
		}, 5000);
	},

	removeGeneratingImage: (tempId) => {
		set((state) => {
			const newMap = new Map(state.generatingImages);
			newMap.delete(tempId);
			return { generatingImages: newMap };
		});
	},

	clearCompletedImages: () => {
		set((state) => {
			const newMap = new Map(state.generatingImages);
			for (const [key, value] of newMap.entries()) {
				if (value.status === 'completed') {
					newMap.delete(key);
				}
			}
			return { generatingImages: newMap };
		});
	},

	getGeneratingImage: (tempId) => {
		return get().generatingImages.get(tempId);
	},

	getAllGeneratingImages: () => {
		return Array.from(get().generatingImages.values());
	},

	getActiveGeneratingImages: () => {
		return Array.from(get().generatingImages.values()).filter((img) => img.status === 'generating');
	},
}));
