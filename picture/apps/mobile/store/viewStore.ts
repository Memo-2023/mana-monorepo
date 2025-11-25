import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ViewMode = 'single' | 'grid3' | 'grid5';

type ViewStore = {
  galleryViewMode: ViewMode;
  exploreViewMode: ViewMode;
  lastViewedImageId: string | null;
  setGalleryViewMode: (mode: ViewMode) => void;
  setExploreViewMode: (mode: ViewMode) => void;
  setLastViewedImageId: (id: string | null) => void;
};

export const useViewStore = create<ViewStore>()(
  persist(
    (set) => ({
      galleryViewMode: 'grid3',
      exploreViewMode: 'grid3',
      lastViewedImageId: null,

      setGalleryViewMode: (mode) => set({ galleryViewMode: mode }),
      setExploreViewMode: (mode) => set({ exploreViewMode: mode }),
      setLastViewedImageId: (id) => set({ lastViewedImageId: id }),
    }),
    {
      name: 'view-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);