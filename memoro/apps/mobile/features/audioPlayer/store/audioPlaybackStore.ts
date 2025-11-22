import { create } from 'zustand';
import { AudioPlayer } from 'expo-audio';

interface AudioInstance {
  id: string;
  player: AudioPlayer;
  pause: () => Promise<void>;
}

interface AudioPlaybackStore {
  activeAudioInstances: Map<string, AudioInstance>;
  registerAudio: (id: string, player: AudioPlayer, pauseCallback: () => Promise<void>) => void;
  unregisterAudio: (id: string) => void;
  pauseAllAudio: () => Promise<void>;
  pauseAllExcept: (exceptId: string) => Promise<void>;
  getActiveCount: () => number;
}

export const useAudioPlaybackStore = create<AudioPlaybackStore>((set, get) => ({
  activeAudioInstances: new Map(),

  registerAudio: (id: string, player: AudioPlayer, pauseCallback: () => Promise<void>) => {
    set((state) => {
      const newInstances = new Map(state.activeAudioInstances);
      newInstances.set(id, { id, player, pause: pauseCallback });
      console.log(
        `[AudioPlaybackStore] Audio registered: ${id}, total active: ${newInstances.size}`
      );
      return { activeAudioInstances: newInstances };
    });
  },

  unregisterAudio: (id: string) => {
    set((state) => {
      const newInstances = new Map(state.activeAudioInstances);
      newInstances.delete(id);
      console.log(
        `[AudioPlaybackStore] Audio unregistered: ${id}, total active: ${newInstances.size}`
      );
      return { activeAudioInstances: newInstances };
    });
  },

  pauseAllAudio: async () => {
    const { activeAudioInstances } = get();
    console.log(`[AudioPlaybackStore] Pausing all audio, count: ${activeAudioInstances.size}`);

    const pausePromises: Promise<void>[] = [];

    activeAudioInstances.forEach((instance) => {
      pausePromises.push(
        instance.pause().catch((error) => {
          console.error(`[AudioPlaybackStore] Error pausing audio ${instance.id}:`, error);
        })
      );
    });

    await Promise.all(pausePromises);
    console.log('[AudioPlaybackStore] All audio paused');
  },

  pauseAllExcept: async (exceptId: string) => {
    const { activeAudioInstances } = get();
    console.log(
      `[AudioPlaybackStore] Pausing all audio except ${exceptId}, count: ${activeAudioInstances.size}`
    );

    const pausePromises: Promise<void>[] = [];

    activeAudioInstances.forEach((instance) => {
      if (instance.id !== exceptId) {
        pausePromises.push(
          instance.pause().catch((error) => {
            console.error(`[AudioPlaybackStore] Error pausing audio ${instance.id}:`, error);
          })
        );
      }
    });

    await Promise.all(pausePromises);
    console.log(`[AudioPlaybackStore] All audio paused except ${exceptId}`);
  },

  getActiveCount: () => {
    return get().activeAudioInstances.size;
  },
}));
