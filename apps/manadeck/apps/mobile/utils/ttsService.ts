import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

export interface TTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: string) => void;
}

export interface Voice {
  identifier: string;
  name: string;
  quality: string;
  language: string;
}

export class TTSService {
  private static currentSpeech: string | null = null;

  static async speakText(text: string, options: TTSOptions = {}): Promise<void> {
    const {
      language = 'de-DE',
      rate = 1.0,
      pitch = 1.0,
      voice,
      onStart,
      onDone,
      onStopped,
      onError,
    } = options;

    try {
      // Stop any current speech
      if (this.currentSpeech) {
        await this.stop();
      }

      this.currentSpeech = text;

      await Speech.speak(text, {
        language,
        rate,
        pitch,
        voice,
        onStart,
        onDone: () => {
          this.currentSpeech = null;
          onDone?.();
        },
        onStopped: () => {
          this.currentSpeech = null;
          onStopped?.();
        },
        onError: (error) => {
          this.currentSpeech = null;
          onError?.(error);
        },
      });
    } catch (error) {
      console.error('Error speaking text:', error);
      this.currentSpeech = null;
      throw error;
    }
  }

  static async stop(): Promise<void> {
    try {
      await Speech.stop();
      this.currentSpeech = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  static async pause(): Promise<void> {
    try {
      await Speech.pause();
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }

  static async resume(): Promise<void> {
    try {
      await Speech.resume();
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }

  static async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.error('Error checking speaking status:', error);
      return false;
    }
  }

  static async getAvailableVoices(): Promise<Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.map((voice) => ({
        identifier: voice.identifier,
        name: voice.name,
        quality: voice.quality,
        language: voice.language,
      }));
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  static async generateAudioFile(text: string, language: string = 'de-DE'): Promise<string | null> {
    // Note: Expo Speech doesn't support generating audio files directly
    // This would require a server-side implementation or different library
    // For now, we'll return null and use real-time TTS only
    console.warn('Audio file generation not supported with Expo Speech');
    return null;
  }

  static speakCard(card: any): Promise<void> {
    let textToSpeak = '';

    switch (card.type) {
      case 'flashcard':
        textToSpeak = `Vorderseite: ${card.content.front}. Rückseite: ${card.content.back}`;
        if (card.content.hint) {
          textToSpeak += `. Hinweis: ${card.content.hint}`;
        }
        break;

      case 'quiz':
        textToSpeak = `Frage: ${card.content.question}. `;
        textToSpeak += 'Optionen: ';
        card.content.options.forEach((option: string, index: number) => {
          textToSpeak += `${index + 1}: ${option}. `;
        });
        break;

      case 'text':
        textToSpeak = card.content.title
          ? `${card.content.title}. ${card.content.text}`
          : card.content.text;
        break;

      case 'mixed':
        card.content.blocks?.forEach((block: any) => {
          if (block.type === 'text') {
            textToSpeak += `${block.content}. `;
          } else if (block.type === 'flashcard') {
            textToSpeak += `Frage: ${block.front}. Antwort: ${block.back}. `;
          }
        });
        break;

      default:
        textToSpeak = JSON.stringify(card.content);
    }

    return this.speakText(textToSpeak, { language: 'de-DE' });
  }

  static getLanguageCode(language: string): string {
    const languageMap: { [key: string]: string } = {
      german: 'de-DE',
      english: 'en-US',
      spanish: 'es-ES',
      french: 'fr-FR',
      italian: 'it-IT',
      portuguese: 'pt-PT',
      russian: 'ru-RU',
      chinese: 'zh-CN',
      japanese: 'ja-JP',
      korean: 'ko-KR',
    };

    return languageMap[language.toLowerCase()] || 'de-DE';
  }
}
