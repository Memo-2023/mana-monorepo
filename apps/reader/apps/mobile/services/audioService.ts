import { supabase } from '~/utils/supabase';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { AudioChunk } from '~/types/database';
import { getVoiceById } from '~/constants/voices';

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

export interface AudioGenerationProgress {
  chunksCompleted: number;
  totalChunks: number;
  currentChunk: string;
  isComplete: boolean;
}

export class AudioService {
  private static instance: AudioService;
  private supabase = supabase;

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private constructor() {
    this.initializeAudioDirectory();
  }

  private async initializeAudioDirectory(): Promise<void> {
    try {
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
    } catch {
      // Directory might already exist
    }
  }

  // Generate audio for a text using Supabase Edge Function
  async generateAudioForText(
    textId: string,
    content: string,
    voice: string = 'de-DE',
    speed: number = 1.0,
    chunkSize: number = 1000,
    onProgress?: (progress: AudioGenerationProgress) => void,
    versionId?: string
  ): Promise<{ success: boolean; error?: string; chunks?: AudioChunk[] }> {
    try {
      // Estimate number of chunks for progress tracking
      const estimatedChunks = Math.ceil(content.length / chunkSize);

      onProgress?.({
        chunksCompleted: 0,
        totalChunks: estimatedChunks,
        currentChunk: 'Starting generation...',
        isComplete: false,
      });

      // Determine which provider to use based on the voice
      let provider = 'google';

      try {
        const voiceInfo = getVoiceById(voice);
        if (voiceInfo) {
          provider = voiceInfo.provider;
        } else {
          console.warn(`Voice not found: ${voice}, defaulting to Google provider`);
        }
      } catch (error) {
        console.error('Error getting voice info:', error);
        // Continue with default Google provider
      }

      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: {
          textId,
          content,
          voice,
          provider,
          speed,
          chunkSize,
          versionId,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      onProgress?.({
        chunksCompleted: data.chunksGenerated,
        totalChunks: data.chunksGenerated,
        currentChunk: 'Audio generation complete!',
        isComplete: true,
      });

      return {
        success: true,
        chunks: data.chunks,
      };
    } catch (error) {
      console.error('Error generating audio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Download audio chunks to local storage
  async downloadAudioChunks(
    textId: string,
    chunks: AudioChunk[],
    onProgress?: (progress: { completed: number; total: number; currentChunk: string }) => void
  ): Promise<{ success: boolean; error?: string; localChunks?: AudioChunk[] }> {
    try {
      const localChunks: AudioChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        onProgress?.({
          completed: i,
          total: chunks.length,
          currentChunk: chunk.id,
        });

        // Get signed URL for the chunk
        const { data: urlData, error: urlError } = await supabase.functions.invoke(
          'get-audio-url',
          {
            body: {
              textId,
              chunkId: chunk.id,
            },
          }
        );

        if (urlError || !urlData.success) {
          throw new Error(`Failed to get URL for chunk ${chunk.id}`);
        }

        // Download the audio file
        const localFilePath = `${AUDIO_DIR}${textId}_${chunk.id}.mp3`;
        const downloadResult = await FileSystem.downloadAsync(urlData.url, localFilePath);

        if (downloadResult.status !== 200) {
          throw new Error(`Failed to download chunk ${chunk.id}`);
        }

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(localFilePath);

        localChunks.push({
          ...chunk,
          filename: `${textId}_${chunk.id}.mp3`,
          size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : chunk.size,
        });
      }

      onProgress?.({
        completed: chunks.length,
        total: chunks.length,
        currentChunk: 'Download complete!',
      });

      return {
        success: true,
        localChunks,
      };
    } catch (error) {
      console.error('Error downloading audio chunks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Play audio directly from Supabase Storage
  async playAudioFromSupabase(
    textId: string,
    chunks: AudioChunk[],
    startPosition: number = 0
  ): Promise<{ sound?: Audio.Sound; chunk?: AudioChunk; chunks?: AudioChunk[]; error?: string }> {
    try {
      // Calculate chunk positions if not already set
      let currentPosition = 0;
      const chunksWithPositions = chunks.map((chunk) => {
        const chunkStart = currentPosition;
        const chunkEnd = currentPosition + chunk.duration * 1000; // Convert to milliseconds
        currentPosition = chunkEnd;
        return {
          ...chunk,
          start: chunk.start ?? chunkStart,
          end: chunk.end ?? chunkEnd,
        };
      });

      // Find the chunk that contains the start position
      const chunk =
        chunksWithPositions.find((c) => startPosition >= c.start && startPosition < c.end) ||
        chunksWithPositions[0]; // Default to first chunk if position not found

      if (!chunk) {
        throw new Error('No chunk found for the given position');
      }

      // Get signed URL for the audio chunk
      const { data: urlData, error: urlError } = await this.supabase.functions.invoke(
        'get-audio-url',
        {
          body: {
            textId,
            chunkId: chunk.id,
          },
        }
      );

      if (urlError || !urlData.success) {
        throw new Error(`Failed to get audio URL: ${urlError?.message || 'Unknown error'}`);
      }

      // Create and load the audio from signed URL
      const { sound } = await Audio.Sound.createAsync({ uri: urlData.url });

      // Calculate position within the chunk
      const positionWithinChunk = Math.max(0, startPosition - chunk.start);
      await sound.setPositionAsync(positionWithinChunk);

      return { sound, chunk, chunks: chunksWithPositions };
    } catch (error) {
      console.error('Error playing audio from Supabase:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Play audio from local cache (kept for backward compatibility)
  async playAudioFromCache(
    textId: string,
    chunks: AudioChunk[],
    startPosition: number = 0
  ): Promise<{ sound?: Audio.Sound; error?: string }> {
    try {
      // Find the chunk that contains the start position
      const chunk = chunks.find((c) => startPosition >= c.start && startPosition < c.end);

      if (!chunk) {
        throw new Error('No chunk found for the given position');
      }

      const filePath = `${AUDIO_DIR}${chunk.filename}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (!fileInfo.exists) {
        throw new Error('Audio file not found locally');
      }

      // Create and load the audio
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });

      // Calculate position within the chunk
      const chunkProgress = (startPosition - chunk.start) / (chunk.end - chunk.start);
      const positionMillis = chunkProgress * chunk.duration * 1000;

      await sound.setPositionAsync(positionMillis);

      return { sound };
    } catch (error) {
      console.error('Error playing audio from cache:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Clear local audio cache for a text
  async clearAudioCache(textId: string, chunks: AudioChunk[]): Promise<void> {
    try {
      for (const chunk of chunks) {
        const filePath = `${AUDIO_DIR}${chunk.filename}`;
        try {
          await FileSystem.deleteAsync(filePath);
        } catch (deleteError) {
          console.log(`Could not delete ${chunk.filename}:`, deleteError);
        }
      }
    } catch (error) {
      console.error('Error clearing audio cache:', error);
    }
  }

  // Get total cache size
  async getCacheSize(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(AUDIO_DIR);
      let totalSize = 0;

      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${AUDIO_DIR}${file}`);
        totalSize += fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  // Check if audio is cached locally
  async isAudioCached(textId: string, chunks: AudioChunk[]): Promise<boolean> {
    try {
      for (const chunk of chunks) {
        const filePath = `${AUDIO_DIR}${chunk.filename}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (!fileInfo.exists) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  // Get file path for a chunk
  getChunkFilePath(textId: string, chunkId: string): string {
    return `${AUDIO_DIR}${textId}_${chunkId}.mp3`;
  }
}
