import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

/**
 * Singleton manager for recording button sounds
 * Handles preloading and playback of UI sounds
 */
class RecordingSoundManager {
  private static instance: RecordingSoundManager;
  
  private startSound: AudioPlayer | null = null;
  private stopSound: AudioPlayer | null = null;
  private cancelSound: AudioPlayer | null = null;
  private isLoaded = false;
  private isLoading = false;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  static getInstance(): RecordingSoundManager {
    if (!RecordingSoundManager.instance) {
      RecordingSoundManager.instance = new RecordingSoundManager();
    }
    return RecordingSoundManager.instance;
  }
  
  /**
   * Preload all sounds for instant playback
   * Should be called on app start or component mount
   */
  async preloadSounds(): Promise<void> {
    // Skip on web platform for now (different audio API)
    if (Platform.OS === 'web') return;
    
    // Prevent multiple loading attempts
    if (this.isLoaded || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      console.debug('🔊 Preloading recording sounds...');
      
      // Configure audio mode for UI sounds
      await setAudioModeAsync({
        allowsRecording: false, // UI sounds don't need recording
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
      
      // Load all sounds in parallel
      const [startResult, stopResult, cancelResult] = await Promise.all([
        this.loadSound(require('~/assets/sounds/TJS-RecordStart-Sound.mp3')),
        this.loadSound(require('~/assets/sounds/TJS-RecordStop-Sound.mp3')),
        this.loadSound(require('~/assets/sounds/TJS-RecordCancel-Sound.mp3')),
      ].map(p => p.catch(e => {
        console.debug('Failed to load sound:', e);
        return null;
      })));
      
      this.startSound = startResult;
      this.stopSound = stopResult;
      this.cancelSound = cancelResult;
      
      this.isLoaded = true;
      console.debug('✅ Recording sounds loaded successfully');
    } catch (error) {
      console.debug('⚠️ Failed to preload sounds:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Helper to load a single sound
   */
  private async loadSound(source: any): Promise<AudioPlayer | null> {
    try {
      const player = createAudioPlayer(source);
      player.volume = 0.5; // 50% volume for UI sounds
      return player;
    } catch (error) {
      console.debug('Error loading sound:', error);
      return null;
    }
  }
  
  /**
   * Play the recording start sound (ding/chime)
   */
  async playStartSound(): Promise<void> {
    if (!this.startSound) return;

    try {
      // Seek to beginning and play
      await this.startSound.seekTo(0);
      await this.startSound.play();
    } catch (error) {
      console.debug('Error playing start sound:', error);
    }
  }

  /**
   * Play the recording stop sound
   */
  async playStopSound(): Promise<void> {
    if (!this.stopSound) return;

    try {
      // Seek to beginning and play
      await this.stopSound.seekTo(0);
      await this.stopSound.play();
    } catch (error) {
      console.debug('Error playing stop sound:', error);
    }
  }

  /**
   * Play the recording cancel sound
   */
  async playCancelSound(): Promise<void> {
    if (!this.cancelSound) return;

    try {
      // Seek to beginning and play
      await this.cancelSound.seekTo(0);
      await this.cancelSound.play();
    } catch (error) {
      console.debug('Error playing cancel sound:', error);
    }
  }
  
  /**
   * Cleanup sounds when no longer needed
   */
  async unloadSounds(): Promise<void> {
    try {
      // Stop and release audio players
      if (this.startSound) {
        await this.startSound.pause();
        this.startSound.release();
      }
      if (this.stopSound) {
        await this.stopSound.pause();
        this.stopSound.release();
      }
      if (this.cancelSound) {
        await this.cancelSound.pause();
        this.cancelSound.release();
      }

      this.startSound = null;
      this.stopSound = null;
      this.cancelSound = null;
      this.isLoaded = false;
    } catch (error) {
      console.debug('Error unloading sounds:', error);
    }
  }
}

// Export singleton instance
export const recordingSoundManager = RecordingSoundManager.getInstance();