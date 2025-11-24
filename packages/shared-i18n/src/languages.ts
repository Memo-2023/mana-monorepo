/**
 * Language definitions and metadata
 */

/**
 * Supported language codes
 */
export type LanguageCode =
  | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'ja'
  | 'ko' | 'zh' | 'ar' | 'hi' | 'bn' | 'ur' | 'id' | 'fa' | 'vi' | 'th'
  | 'tr' | 'uk' | 'cs' | 'da' | 'fi' | 'sv' | 'nb' | 'el' | 'hu' | 'ro'
  | 'bg' | 'hr' | 'sk' | 'sl' | 'sr' | 'lt' | 'lv' | 'et' | 'mt' | 'ga'
  | 'tl' | 'ms' | 'he' | 'af' | 'pt-BR' | 'es-MX';

/**
 * Language metadata
 */
export interface LanguageInfo {
  /** Native name of the language */
  nativeName: string;
  /** English name of the language */
  englishName: string;
  /** Flag emoji */
  emoji: string;
  /** RTL language */
  rtl?: boolean;
}

/**
 * Complete language definitions
 */
export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  // Major languages
  en: { nativeName: 'English', englishName: 'English', emoji: '🇬🇧' },
  de: { nativeName: 'Deutsch', englishName: 'German', emoji: '🇩🇪' },
  fr: { nativeName: 'Français', englishName: 'French', emoji: '🇫🇷' },
  es: { nativeName: 'Español', englishName: 'Spanish', emoji: '🇪🇸' },
  it: { nativeName: 'Italiano', englishName: 'Italian', emoji: '🇮🇹' },
  pt: { nativeName: 'Português', englishName: 'Portuguese', emoji: '🇵🇹' },
  nl: { nativeName: 'Nederlands', englishName: 'Dutch', emoji: '🇳🇱' },
  pl: { nativeName: 'Polski', englishName: 'Polish', emoji: '🇵🇱' },
  ru: { nativeName: 'Русский', englishName: 'Russian', emoji: '🇷🇺' },

  // Asian languages
  ja: { nativeName: '日本語', englishName: 'Japanese', emoji: '🇯🇵' },
  ko: { nativeName: '한국어', englishName: 'Korean', emoji: '🇰🇷' },
  zh: { nativeName: '中文', englishName: 'Chinese', emoji: '🇨🇳' },
  vi: { nativeName: 'Tiếng Việt', englishName: 'Vietnamese', emoji: '🇻🇳' },
  th: { nativeName: 'ไทย', englishName: 'Thai', emoji: '🇹🇭' },
  id: { nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', emoji: '🇮🇩' },
  ms: { nativeName: 'Bahasa Melayu', englishName: 'Malay', emoji: '🇲🇾' },
  tl: { nativeName: 'Filipino', englishName: 'Filipino', emoji: '🇵🇭' },

  // South Asian languages
  hi: { nativeName: 'हिन्दी', englishName: 'Hindi', emoji: '🇮🇳' },
  bn: { nativeName: 'বাংলা', englishName: 'Bengali', emoji: '🇧🇩' },
  ur: { nativeName: 'اردو', englishName: 'Urdu', emoji: '🇵🇰', rtl: true },

  // Middle Eastern languages
  ar: { nativeName: 'العربية', englishName: 'Arabic', emoji: '🇦🇪', rtl: true },
  fa: { nativeName: 'فارسی', englishName: 'Persian', emoji: '🇮🇷', rtl: true },
  he: { nativeName: 'עברית', englishName: 'Hebrew', emoji: '🇮🇱', rtl: true },
  tr: { nativeName: 'Türkçe', englishName: 'Turkish', emoji: '🇹🇷' },

  // Nordic languages
  sv: { nativeName: 'Svenska', englishName: 'Swedish', emoji: '🇸🇪' },
  da: { nativeName: 'Dansk', englishName: 'Danish', emoji: '🇩🇰' },
  fi: { nativeName: 'Suomi', englishName: 'Finnish', emoji: '🇫🇮' },
  nb: { nativeName: 'Norsk', englishName: 'Norwegian', emoji: '🇳🇴' },

  // Eastern European languages
  uk: { nativeName: 'Українська', englishName: 'Ukrainian', emoji: '🇺🇦' },
  cs: { nativeName: 'Čeština', englishName: 'Czech', emoji: '🇨🇿' },
  hu: { nativeName: 'Magyar', englishName: 'Hungarian', emoji: '🇭🇺' },
  ro: { nativeName: 'Română', englishName: 'Romanian', emoji: '🇷🇴' },
  bg: { nativeName: 'Български', englishName: 'Bulgarian', emoji: '🇧🇬' },
  hr: { nativeName: 'Hrvatski', englishName: 'Croatian', emoji: '🇭🇷' },
  sk: { nativeName: 'Slovenčina', englishName: 'Slovak', emoji: '🇸🇰' },
  sl: { nativeName: 'Slovenščina', englishName: 'Slovenian', emoji: '🇸🇮' },
  sr: { nativeName: 'Српски', englishName: 'Serbian', emoji: '🇷🇸' },

  // Baltic languages
  lt: { nativeName: 'Lietuvių', englishName: 'Lithuanian', emoji: '🇱🇹' },
  lv: { nativeName: 'Latviešu', englishName: 'Latvian', emoji: '🇱🇻' },
  et: { nativeName: 'Eesti', englishName: 'Estonian', emoji: '🇪🇪' },

  // Other European languages
  el: { nativeName: 'Ελληνικά', englishName: 'Greek', emoji: '🇬🇷' },
  mt: { nativeName: 'Malti', englishName: 'Maltese', emoji: '🇲🇹' },
  ga: { nativeName: 'Gaeilge', englishName: 'Irish', emoji: '🇮🇪' },

  // African languages
  af: { nativeName: 'Afrikaans', englishName: 'Afrikaans', emoji: '🇿🇦' },

  // Regional variants
  'pt-BR': { nativeName: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', emoji: '🇧🇷' },
  'es-MX': { nativeName: 'Español (México)', englishName: 'Spanish (Mexico)', emoji: '🇲🇽' },
};

/**
 * Get list of all language codes
 */
export function getLanguageCodes(): LanguageCode[] {
  return Object.keys(LANGUAGES) as LanguageCode[];
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: string): LanguageInfo | undefined {
  return LANGUAGES[code as LanguageCode];
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code: string): code is LanguageCode {
  return code in LANGUAGES;
}

/**
 * Check if a language is RTL
 */
export function isRTL(code: string): boolean {
  const info = LANGUAGES[code as LanguageCode];
  return info?.rtl === true;
}

/**
 * Get display name for a language (native name with emoji)
 */
export function getLanguageDisplayName(code: string): string {
  const info = LANGUAGES[code as LanguageCode];
  if (!info) return code;
  return `${info.emoji} ${info.nativeName}`;
}

/**
 * Common locale groups for filtering
 */
export const LOCALE_GROUPS = {
  /** European Union official languages */
  eu: ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'cs', 'da', 'fi', 'sv', 'el', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'lt', 'lv', 'et', 'mt', 'ga'] as LanguageCode[],
  /** Major world languages */
  major: ['en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar'] as LanguageCode[],
  /** DACH region (German-speaking) */
  dach: ['de'] as LanguageCode[],
  /** Nordic countries */
  nordic: ['sv', 'da', 'fi', 'nb'] as LanguageCode[],
  /** RTL languages */
  rtl: ['ar', 'fa', 'he', 'ur'] as LanguageCode[],
};

/**
 * Get languages by group
 */
export function getLanguagesByGroup(group: keyof typeof LOCALE_GROUPS): LanguageCode[] {
  return LOCALE_GROUPS[group];
}
