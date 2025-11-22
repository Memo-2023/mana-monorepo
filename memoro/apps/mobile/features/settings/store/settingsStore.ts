import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // Developer settings
  developerMode: boolean;
  showDebugBorders: boolean;

  // Data settings
  enableAnalytics: boolean;
  enableNewsletter: boolean;

  // Recording settings
  enableDiarization: boolean;

  // UI visibility settings
  showRecordingInstruction: boolean;
  showLanguageButton: boolean;
  showMemoPreview: boolean;
  showBlueprints: boolean;
  showManaBadge: boolean;

  // Hydration tracking
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Actions
  setDeveloperMode: (enabled: boolean) => void;
  setShowDebugBorders: (enabled: boolean) => void;
  setEnableAnalytics: (enabled: boolean) => void;
  setEnableNewsletter: (enabled: boolean) => void;
  setEnableDiarization: (enabled: boolean) => void;
  setShowRecordingInstruction: (enabled: boolean) => void;
  setShowLanguageButton: (enabled: boolean) => void;
  setShowMemoPreview: (enabled: boolean) => void;
  setShowBlueprints: (enabled: boolean) => void;
  setShowManaBadge: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      developerMode: false,
      showDebugBorders: false,
      enableAnalytics: true,
      enableNewsletter: true,
      enableDiarization: true, // Default enabled
      showRecordingInstruction: true,
      showLanguageButton: true,
      showMemoPreview: true,
      showBlueprints: true,
      showManaBadge: true,
      _hasHydrated: false,

      // Actions
      setDeveloperMode: (enabled: boolean) => set({ developerMode: enabled }),
      setShowDebugBorders: (enabled: boolean) => set({ showDebugBorders: enabled }),
      setEnableAnalytics: (enabled: boolean) => set({ enableAnalytics: enabled }),
      setEnableNewsletter: (enabled: boolean) => set({ enableNewsletter: enabled }),
      setEnableDiarization: (enabled: boolean) => set({ enableDiarization: enabled }),
      setShowRecordingInstruction: (enabled: boolean) => set({ showRecordingInstruction: enabled }),
      setShowLanguageButton: (enabled: boolean) => set({ showLanguageButton: enabled }),
      setShowMemoPreview: (enabled: boolean) => set({ showMemoPreview: enabled }),
      setShowBlueprints: (enabled: boolean) => set({ showBlueprints: enabled }),
      setShowManaBadge: (enabled: boolean) => set({ showManaBadge: enabled }),
      setHasHydrated: (hasHydrated: boolean) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'memoro-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.debug('Settings store hydrated:', state);
        state?.setHasHydrated(true);
      },
    }
  )
);
