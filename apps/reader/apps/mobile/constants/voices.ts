export type VoiceProvider = 'google' | 'elevenlabs' | 'openai';

export interface Voice {
  value: string;
  label: string;
  gender: 'male' | 'female';
  quality: 'premium' | 'neural' | 'wavenet' | 'studio' | 'standard';
  language: string;
  provider: VoiceProvider;
}

export const GERMAN_VOICES: Voice[] = [
  // Note: Google Chirp HD voices (de-DE-Chirp3-HD-*) are available but not included here
  // as they require special API access and are significantly more expensive.
  // Add them if you have access: https://cloud.google.com/text-to-speech/docs/voices

  // Google Cloud TTS - Neural2 voices (most commonly used, good balance of quality and cost)
  {
    value: 'de-DE-Neural2-A',
    label: 'Neural2 A (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Neural2-B',
    label: 'Neural2 B (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Neural2-C',
    label: 'Neural2 C (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Neural2-D',
    label: 'Neural2 D (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Neural2-E',
    label: 'Neural2 E (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Neural2-F',
    label: 'Neural2 F (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'de-DE',
    provider: 'google',
  },

  // Google Cloud TTS - WaveNet voices (high quality, natural sounding)
  {
    value: 'de-DE-Wavenet-A',
    label: 'WaveNet A (Weiblich)',
    gender: 'female',
    quality: 'wavenet',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Wavenet-B',
    label: 'WaveNet B (Männlich)',
    gender: 'male',
    quality: 'wavenet',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Wavenet-C',
    label: 'WaveNet C (Weiblich)',
    gender: 'female',
    quality: 'wavenet',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Wavenet-D',
    label: 'WaveNet D (Männlich)',
    gender: 'male',
    quality: 'wavenet',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Wavenet-E',
    label: 'WaveNet E (Weiblich)',
    gender: 'female',
    quality: 'wavenet',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Wavenet-F',
    label: 'WaveNet F (Männlich)',
    gender: 'male',
    quality: 'wavenet',
    language: 'de-DE',
    provider: 'google',
  },

  // Google Cloud TTS - Studio voices (broadcast quality)
  {
    value: 'de-DE-Studio-B',
    label: 'Studio B (Männlich)',
    gender: 'male',
    quality: 'studio',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Studio-C',
    label: 'Studio C (Weiblich)',
    gender: 'female',
    quality: 'studio',
    language: 'de-DE',
    provider: 'google',
  },

  // Google Cloud TTS - Standard voices (basic quality, lowest cost)
  {
    value: 'de-DE-Standard-A',
    label: 'Standard A (Weiblich)',
    gender: 'female',
    quality: 'standard',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Standard-B',
    label: 'Standard B (Männlich)',
    gender: 'male',
    quality: 'standard',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Standard-C',
    label: 'Standard C (Weiblich)',
    gender: 'female',
    quality: 'standard',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Standard-D',
    label: 'Standard D (Männlich)',
    gender: 'male',
    quality: 'standard',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Standard-E',
    label: 'Standard E (Weiblich)',
    gender: 'female',
    quality: 'standard',
    language: 'de-DE',
    provider: 'google',
  },
  {
    value: 'de-DE-Standard-F',
    label: 'Standard F (Männlich)',
    gender: 'male',
    quality: 'standard',
    language: 'de-DE',
    provider: 'google',
  },

  // ElevenLabs voices
  {
    value: 'eleven_multilingual_v2',
    label: 'Rachel (Weiblich)',
    gender: 'female',
    quality: 'premium',
    language: 'de-DE',
    provider: 'elevenlabs',
  },
  {
    value: 'eleven_multilingual_v1',
    label: 'Adam (Männlich)',
    gender: 'male',
    quality: 'premium',
    language: 'de-DE',
    provider: 'elevenlabs',
  },
  {
    value: 'eleven_turbo_v2',
    label: 'Turbo Rachel (Weiblich) - Low Latency',
    gender: 'female',
    quality: 'premium',
    language: 'de-DE',
    provider: 'elevenlabs',
  },
  {
    value: 'eleven_monolingual_v1',
    label: 'Clyde (Männlich)',
    gender: 'male',
    quality: 'premium',
    language: 'de-DE',
    provider: 'elevenlabs',
  },

  // OpenAI voices
  {
    value: 'alloy',
    label: 'Alloy (Neutral)',
    gender: 'female',
    quality: 'neural',
    language: 'de-DE',
    provider: 'openai',
  },
  {
    value: 'echo',
    label: 'Echo (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'de-DE',
    provider: 'openai',
  },
  {
    value: 'fable',
    label: 'Fable (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'de-DE',
    provider: 'openai',
  },
  {
    value: 'onyx',
    label: 'Onyx (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'de-DE',
    provider: 'openai',
  },
  {
    value: 'nova',
    label: 'Nova (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'de-DE',
    provider: 'openai',
  },
  {
    value: 'shimmer',
    label: 'Shimmer (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'de-DE',
    provider: 'openai',
  },
];

export const ENGLISH_US_VOICES: Voice[] = [
  // Google Cloud TTS - Neural2 voices
  {
    value: 'en-US-Neural2-A',
    label: 'Neural2 A (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'en-US',
    provider: 'google',
  },
  {
    value: 'en-US-Neural2-C',
    label: 'Neural2 C (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'en-US',
    provider: 'google',
  },
  {
    value: 'en-US-Neural2-D',
    label: 'Neural2 D (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'en-US',
    provider: 'google',
  },
  {
    value: 'en-US-Neural2-E',
    label: 'Neural2 E (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'en-US',
    provider: 'google',
  },
];

export const ENGLISH_GB_VOICES: Voice[] = [
  // Google Cloud TTS - Neural2 voices
  {
    value: 'en-GB-Neural2-A',
    label: 'Neural2 A (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'en-GB',
    provider: 'google',
  },
  {
    value: 'en-GB-Neural2-B',
    label: 'Neural2 B (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'en-GB',
    provider: 'google',
  },
  {
    value: 'en-GB-Neural2-C',
    label: 'Neural2 C (Weiblich)',
    gender: 'female',
    quality: 'neural',
    language: 'en-GB',
    provider: 'google',
  },
  {
    value: 'en-GB-Neural2-D',
    label: 'Neural2 D (Männlich)',
    gender: 'male',
    quality: 'neural',
    language: 'en-GB',
    provider: 'google',
  },
];

export const ALL_VOICES = [...GERMAN_VOICES, ...ENGLISH_US_VOICES, ...ENGLISH_GB_VOICES];

export const getVoicesByLanguage = (language: string): Voice[] => {
  return ALL_VOICES.filter((voice) => voice.language === language);
};

export const getVoiceById = (voiceId: string): Voice | undefined => {
  if (!voiceId) return undefined;

  try {
    const allVoices = [...GERMAN_VOICES, ...ENGLISH_US_VOICES, ...ENGLISH_GB_VOICES];
    return allVoices.find((voice) => voice.value === voiceId);
  } catch (error) {
    console.error('Error in getVoiceById:', error);
    return undefined;
  }
};

export const QUALITY_LABELS: Record<Voice['quality'], string> = {
  premium: '🌟 Premium',
  neural: '🧠 Neural',
  wavenet: '🌊 WaveNet',
  studio: '🎙️ Studio',
  standard: '📢 Standard',
};

export const PROVIDER_LABELS: Record<VoiceProvider, string> = {
  google: '🔵 Google Cloud',
  elevenlabs: '🎯 ElevenLabs',
  openai: '🤖 OpenAI',
};

// Backward compatibility: map old voice codes to new voice IDs
export const LEGACY_VOICE_MAP: Record<string, string> = {
  'de-DE': 'de-DE-Neural2-A',
  'en-US': 'en-US-Neural2-A',
  'en-GB': 'en-GB-Neural2-A',
  // Also map old voice IDs that no longer exist
  'de-DE-Neural2-G': 'de-DE-Neural2-A',
  'de-DE-Neural2-H': 'de-DE-Neural2-B',
  'de-DE-Wavenet-G': 'de-DE-Wavenet-A',
  'de-DE-Wavenet-H': 'de-DE-Wavenet-B',
  'de-DE-Standard-G': 'de-DE-Standard-A',
  'de-DE-Standard-H': 'de-DE-Standard-B',
};
