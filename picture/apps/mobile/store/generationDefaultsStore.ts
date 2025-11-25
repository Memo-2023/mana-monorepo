import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type GenerationDefaults = {
  // Model
  defaultModelId: string | null;

  // Aspect Ratio
  defaultAspectRatio: string; // '1:1', '16:9', etc.

  // Image Count
  defaultImageCount: number;

  // Advanced Settings
  useAdvancedByDefault: boolean;
};

type GenerationDefaultsStore = GenerationDefaults & {
  // Actions
  setDefaultModel: (modelId: string | null) => void;
  setDefaultAspectRatio: (ratio: string) => void;
  setDefaultImageCount: (count: number) => void;
  setUseAdvancedByDefault: (use: boolean) => void;
  resetToDefaults: () => void;
};

const initialDefaults: GenerationDefaults = {
  defaultModelId: null,
  defaultAspectRatio: '1:1',
  defaultImageCount: 1,
  useAdvancedByDefault: false,
};

export const useGenerationDefaults = create<GenerationDefaultsStore>()(
  persist(
    (set) => ({
      ...initialDefaults,

      setDefaultModel: (modelId) => set({ defaultModelId: modelId }),

      setDefaultAspectRatio: (ratio) => set({ defaultAspectRatio: ratio }),

      setDefaultImageCount: (count) => set({ defaultImageCount: count }),

      setUseAdvancedByDefault: (use) => set({ useAdvancedByDefault: use }),

      resetToDefaults: () => set(initialDefaults),
    }),
    {
      name: 'generation-defaults-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
