import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;

  // Settings
  settings: {
    voice: string;
    speed: number;
    theme: 'light' | 'dark';
    playbackRate: number;
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;

  // Audio Player
  currentTextId: string | null;
  isPlaying: boolean;
  currentPosition: number;
  setCurrentText: (textId: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentPosition: (position: number) => void;

  // UI State
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearTags: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Settings
      settings: {
        voice: 'de-DE-Neural2-A',
        speed: 1.0,
        theme: 'light',
        playbackRate: 1.0,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Audio Player
      currentTextId: null,
      isPlaying: false,
      currentPosition: 0,
      setCurrentText: (textId) => set({ currentTextId: textId, currentPosition: 0 }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentPosition: (position) => set({ currentPosition: position }),

      // UI State
      selectedTags: [],
      toggleTag: (tag) =>
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag],
        })),
      clearTags: () => set({ selectedTags: [] }),
    }),
    {
      name: 'reader-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        selectedTags: state.selectedTags,
      }),
    }
  )
);
