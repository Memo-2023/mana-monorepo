import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PageName = 'record' | 'memos' | 'spaces' | 'settings' | 'memo_detail' | 'space_detail' | 
  'audio_archive' | 'blueprints' | 'create_blueprint' | 'prompts' | 'tags' | 'map' | 
  'memories' | 'statistics' | 'subscription';

interface OnboardingState {
  hasSeenRecordingTutorial: boolean;
  hasCompletedFirstRecording: boolean;
  hasSeenCompletionCelebration: boolean;
  pageOnboardingSeen: Record<PageName, boolean>;
  isLoading: boolean;
  hasLoadedInitialState: boolean;
  
  // Actions
  loadOnboardingState: () => Promise<void>;
  markRecordingTutorialSeen: () => Promise<void>;
  markFirstRecordingCompleted: () => Promise<void>;
  markCompletionCelebrationSeen: () => Promise<void>;
  markPageOnboardingSeen: (pageName: PageName) => Promise<void>;
  hasSeenPageOnboarding: (pageName: PageName) => boolean;
  resetOnboarding: () => Promise<void>;
}

const STORAGE_KEYS = {
  HAS_SEEN_RECORDING_TUTORIAL: 'onboarding_has_seen_recording_tutorial',
  HAS_COMPLETED_FIRST_RECORDING: 'onboarding_has_completed_first_recording',
  HAS_SEEN_COMPLETION_CELEBRATION: 'onboarding_has_seen_completion_celebration',
  PAGE_ONBOARDING_SEEN: 'onboarding_page_seen',
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasSeenRecordingTutorial: false,
  hasCompletedFirstRecording: false,
  hasSeenCompletionCelebration: false,
  pageOnboardingSeen: {
    record: false,
    memos: false,
    spaces: false,
    settings: false,
    memo_detail: false,
    space_detail: false,
    audio_archive: false,
    blueprints: false,
    create_blueprint: false,
    prompts: false,
    tags: false,
    map: false,
    memories: false,
    statistics: false,
    subscription: false,
  },
  isLoading: true,
  hasLoadedInitialState: false,

  loadOnboardingState: async () => {
    const state = get();
    
    // Only load once per app session
    if (state.hasLoadedInitialState) {
      console.debug('📚 Onboarding state already loaded, skipping...');
      return;
    }
    
    try {
      set({ isLoading: true });
      
      const [recordingTutorial, firstRecording, completionCelebration, pageOnboardingData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_RECORDING_TUTORIAL),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_FIRST_RECORDING),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_COMPLETION_CELEBRATION),
        AsyncStorage.getItem(STORAGE_KEYS.PAGE_ONBOARDING_SEEN),
      ]);

      let pageOnboardingSeen: Record<PageName, boolean> = {
        record: false,
        memos: false,
        spaces: false,
        settings: false,
        memo_detail: false,
        space_detail: false,
        audio_archive: false,
        blueprints: false,
        create_blueprint: false,
        prompts: false,
        tags: false,
        map: false,
        memories: false,
        statistics: false,
        subscription: false,
      };

      console.debug(`📖 Raw pageOnboardingData from AsyncStorage:`, pageOnboardingData);
      
      if (pageOnboardingData) {
        try {
          const parsed = JSON.parse(pageOnboardingData);
          console.debug(`📖 Parsed pageOnboardingData:`, parsed);
          pageOnboardingSeen = { ...pageOnboardingSeen, ...parsed };
          console.debug(`📖 Final pageOnboardingSeen:`, pageOnboardingSeen);
        } catch (parseError) {
          console.debug('❌ Error parsing page onboarding data:', parseError);
        }
      } else {
        console.debug(`📖 No pageOnboardingData found in AsyncStorage - using defaults`);
      }

      set({
        hasSeenRecordingTutorial: recordingTutorial === 'true',
        hasCompletedFirstRecording: firstRecording === 'true',
        hasSeenCompletionCelebration: completionCelebration === 'true',
        pageOnboardingSeen,
        isLoading: false,
        hasLoadedInitialState: true,
      });
      
      console.debug('📚 Onboarding state loaded:', {
        hasSeenRecordingTutorial: recordingTutorial === 'true',
        hasCompletedFirstRecording: firstRecording === 'true',
        hasSeenCompletionCelebration: completionCelebration === 'true',
        pageOnboardingSeen,
      });
    } catch (error) {
      console.debug('Error loading onboarding state:', error);
      set({ isLoading: false, hasLoadedInitialState: true });
    }
  },

  markRecordingTutorialSeen: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_RECORDING_TUTORIAL, 'true');
      set({ hasSeenRecordingTutorial: true });
      console.debug('Marked recording tutorial as seen');
    } catch (error) {
      console.debug('Error marking recording tutorial as seen:', error);
    }
  },

  markFirstRecordingCompleted: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_FIRST_RECORDING, 'true');
      set({ hasCompletedFirstRecording: true });
      console.debug('Marked first recording as completed');
    } catch (error) {
      console.debug('Error marking first recording as completed:', error);
    }
  },

  markCompletionCelebrationSeen: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_COMPLETION_CELEBRATION, 'true');
      set({ hasSeenCompletionCelebration: true });
      console.debug('Marked completion celebration as seen');
    } catch (error) {
      console.debug('Error marking completion celebration as seen:', error);
    }
  },

  markPageOnboardingSeen: async (pageName: PageName) => {
    try {
      const state = get();
      const updatedPageOnboarding = { ...state.pageOnboardingSeen, [pageName]: true };

      
      await AsyncStorage.setItem(STORAGE_KEYS.PAGE_ONBOARDING_SEEN, JSON.stringify(updatedPageOnboarding));
      
      
      set({ pageOnboardingSeen: updatedPageOnboarding });
    } catch (error) {
      console.debug(`❌ Error marking page onboarding as seen for ${pageName}:`, error);
    }
  },

  hasSeenPageOnboarding: (pageName: PageName) => {
    const state = get();
    return state.pageOnboardingSeen[pageName] || false;
  },

  resetOnboarding: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_RECORDING_TUTORIAL),
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_COMPLETED_FIRST_RECORDING),
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_COMPLETION_CELEBRATION),
        AsyncStorage.removeItem(STORAGE_KEYS.PAGE_ONBOARDING_SEEN),
      ]);
      
      set({
        hasSeenRecordingTutorial: false,
        hasCompletedFirstRecording: false,
        hasSeenCompletionCelebration: false,
        pageOnboardingSeen: {
          record: false,
          memos: false,
          spaces: false,
          settings: false,
          memo_detail: false,
          space_detail: false,
          audio_archive: false,
          blueprints: false,
          create_blueprint: false,
          prompts: false,
          tags: false,
          map: false,
          memories: false,
          statistics: false,
          subscription: false,
        },
        hasLoadedInitialState: true, // Keep this true so we don't reload
      });
      
      console.debug('Onboarding state reset');
    } catch (error) {
      console.debug('Error resetting onboarding state:', error);
    }
  },
}));