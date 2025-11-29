/**
 * Supported languages for Gemini 2.0 Flash translation
 * Based on official Google documentation: https://ai.google.dev/gemini-api/docs/models
 * Last updated: 2025-01-22
 */

import { LANGUAGES } from '~/features/i18n';

// Gemini 2.0 Flash supported languages for translation
export const GEMINI_TRANSLATION_LANGUAGES = {
	ar: { nativeName: LANGUAGES.ar?.nativeName || 'العربية', emoji: LANGUAGES.ar?.emoji || '🇸🇦' },
	bn: { nativeName: LANGUAGES.bn?.nativeName || 'বাংলা', emoji: LANGUAGES.bn?.emoji || '🇧🇩' },
	bg: { nativeName: LANGUAGES.bg?.nativeName || 'Български', emoji: LANGUAGES.bg?.emoji || '🇧🇬' },
	zh: { nativeName: LANGUAGES.zh?.nativeName || '中文', emoji: LANGUAGES.zh?.emoji || '🇨🇳' },
	hr: { nativeName: LANGUAGES.hr?.nativeName || 'Hrvatski', emoji: LANGUAGES.hr?.emoji || '🇭🇷' },
	cs: { nativeName: LANGUAGES.cs?.nativeName || 'Čeština', emoji: LANGUAGES.cs?.emoji || '🇨🇿' },
	da: { nativeName: LANGUAGES.da?.nativeName || 'Dansk', emoji: LANGUAGES.da?.emoji || '🇩🇰' },
	nl: { nativeName: LANGUAGES.nl?.nativeName || 'Nederlands', emoji: LANGUAGES.nl?.emoji || '🇳🇱' },
	en: { nativeName: LANGUAGES.en?.nativeName || 'English', emoji: LANGUAGES.en?.emoji || '🇺🇸' },
	et: { nativeName: LANGUAGES.et?.nativeName || 'Eesti', emoji: LANGUAGES.et?.emoji || '🇪🇪' },
	fi: { nativeName: LANGUAGES.fi?.nativeName || 'Suomi', emoji: LANGUAGES.fi?.emoji || '🇫🇮' },
	fr: { nativeName: LANGUAGES.fr?.nativeName || 'Français', emoji: LANGUAGES.fr?.emoji || '🇫🇷' },
	de: { nativeName: LANGUAGES.de?.nativeName || 'Deutsch', emoji: LANGUAGES.de?.emoji || '🇩🇪' },
	el: { nativeName: LANGUAGES.el?.nativeName || 'Ελληνικά', emoji: LANGUAGES.el?.emoji || '🇬🇷' },
	iw: { nativeName: LANGUAGES.he?.nativeName || 'עברית', emoji: LANGUAGES.he?.emoji || '🇮🇱' }, // Hebrew - Gemini uses 'iw' code
	hi: { nativeName: LANGUAGES.hi?.nativeName || 'हिन्दी', emoji: LANGUAGES.hi?.emoji || '🇮🇳' },
	hu: { nativeName: LANGUAGES.hu?.nativeName || 'Magyar', emoji: LANGUAGES.hu?.emoji || '🇭🇺' },
	id: {
		nativeName: LANGUAGES.id?.nativeName || 'Bahasa Indonesia',
		emoji: LANGUAGES.id?.emoji || '🇮🇩',
	},
	it: { nativeName: LANGUAGES.it?.nativeName || 'Italiano', emoji: LANGUAGES.it?.emoji || '🇮🇹' },
	ja: { nativeName: LANGUAGES.ja?.nativeName || '日本語', emoji: LANGUAGES.ja?.emoji || '🇯🇵' },
	ko: { nativeName: LANGUAGES.ko?.nativeName || '한국어', emoji: LANGUAGES.ko?.emoji || '🇰🇷' },
	lv: { nativeName: LANGUAGES.lv?.nativeName || 'Latviešu', emoji: LANGUAGES.lv?.emoji || '🇱🇻' },
	lt: { nativeName: LANGUAGES.lt?.nativeName || 'Lietuvių', emoji: LANGUAGES.lt?.emoji || '🇱🇹' },
	no: { nativeName: LANGUAGES.nb?.nativeName || 'Norsk', emoji: LANGUAGES.nb?.emoji || '🇳🇴' }, // Norwegian
	pl: { nativeName: LANGUAGES.pl?.nativeName || 'Polski', emoji: LANGUAGES.pl?.emoji || '🇵🇱' },
	pt: { nativeName: LANGUAGES.pt?.nativeName || 'Português', emoji: LANGUAGES.pt?.emoji || '🇵🇹' },
	ro: { nativeName: LANGUAGES.ro?.nativeName || 'Română', emoji: LANGUAGES.ro?.emoji || '🇷🇴' },
	ru: { nativeName: LANGUAGES.ru?.nativeName || 'Русский', emoji: LANGUAGES.ru?.emoji || '🇷🇺' },
	sr: { nativeName: LANGUAGES.sr?.nativeName || 'Српски', emoji: LANGUAGES.sr?.emoji || '🇷🇸' },
	sk: { nativeName: LANGUAGES.sk?.nativeName || 'Slovenčina', emoji: LANGUAGES.sk?.emoji || '🇸🇰' },
	sl: { nativeName: LANGUAGES.sl?.nativeName || 'Slovenščina', emoji: LANGUAGES.sl?.emoji || '🇸🇮' },
	es: { nativeName: LANGUAGES.es?.nativeName || 'Español', emoji: LANGUAGES.es?.emoji || '🇪🇸' },
	sw: { nativeName: LANGUAGES.sw?.nativeName || 'Kiswahili', emoji: LANGUAGES.sw?.emoji || '🇰🇪' },
	sv: { nativeName: LANGUAGES.sv?.nativeName || 'Svenska', emoji: LANGUAGES.sv?.emoji || '🇸🇪' },
	th: { nativeName: LANGUAGES.th?.nativeName || 'ไทย', emoji: LANGUAGES.th?.emoji || '🇹🇭' },
	tr: { nativeName: LANGUAGES.tr?.nativeName || 'Türkçe', emoji: LANGUAGES.tr?.emoji || '🇹🇷' },
	uk: { nativeName: LANGUAGES.uk?.nativeName || 'Українська', emoji: LANGUAGES.uk?.emoji || '🇺🇦' },
	vi: { nativeName: LANGUAGES.vi?.nativeName || 'Tiếng Việt', emoji: LANGUAGES.vi?.emoji || '🇻🇳' },
} as const;

// Additional languages that were in the original TranslateLanguageModal but not officially listed by Gemini
// These might work but are not guaranteed
export const ADDITIONAL_TRANSLATION_LANGUAGES = {
	af: { nativeName: LANGUAGES.af?.nativeName || 'Afrikaans', emoji: LANGUAGES.af?.emoji || '🇿🇦' },
	sq: { nativeName: LANGUAGES.sq?.nativeName || 'Shqip', emoji: LANGUAGES.sq?.emoji || '🇦🇱' },
	am: { nativeName: LANGUAGES.am?.nativeName || 'አማርኛ', emoji: LANGUAGES.am?.emoji || '🇪🇹' },
	hy: { nativeName: LANGUAGES.hy?.nativeName || 'Հայերեն', emoji: LANGUAGES.hy?.emoji || '🇦🇲' },
	as: { nativeName: LANGUAGES.as?.nativeName || 'অসমীয়া', emoji: LANGUAGES.as?.emoji || '🇮🇳' },
	az: { nativeName: LANGUAGES.az?.nativeName || 'Azərbaycan', emoji: LANGUAGES.az?.emoji || '🇦🇿' },
	eu: { nativeName: LANGUAGES.eu?.nativeName || 'Euskara', emoji: LANGUAGES.eu?.emoji || '🇪🇸' },
	be: { nativeName: LANGUAGES.be?.nativeName || 'Беларуская', emoji: LANGUAGES.be?.emoji || '🇧🇾' },
	bs: { nativeName: LANGUAGES.bs?.nativeName || 'Bosanski', emoji: LANGUAGES.bs?.emoji || '🇧🇦' },
	ca: { nativeName: LANGUAGES.ca?.nativeName || 'Català', emoji: LANGUAGES.ca?.emoji || '🇪🇸' },
	ceb: { nativeName: 'Cebuano', emoji: '🇵🇭' },
	co: { nativeName: 'Corsu', emoji: '🇫🇷' },
	dv: { nativeName: 'ދިވެހި', emoji: '🇲🇻' },
	eo: { nativeName: 'Esperanto', emoji: '🌍' },
	tl: { nativeName: LANGUAGES.tl?.nativeName || 'Filipino', emoji: LANGUAGES.tl?.emoji || '🇵🇭' },
	ga: { nativeName: LANGUAGES.ga?.nativeName || 'Gaeilge', emoji: LANGUAGES.ga?.emoji || '🇮🇪' },
	mt: { nativeName: LANGUAGES.mt?.nativeName || 'Malti', emoji: LANGUAGES.mt?.emoji || '🇲🇹' },
	fa: { nativeName: LANGUAGES.fa?.nativeName || 'فارسی', emoji: LANGUAGES.fa?.emoji || '🇮🇷' },
	ur: { nativeName: LANGUAGES.ur?.nativeName || 'اردو', emoji: LANGUAGES.ur?.emoji || '🇵🇰' },
} as const;

// Combined list of all supported languages (Gemini official + additional)
export const ALL_TRANSLATION_LANGUAGES = {
	...GEMINI_TRANSLATION_LANGUAGES,
	...ADDITIONAL_TRANSLATION_LANGUAGES,
} as const;

// Type definitions
export type GeminiLanguageCode = keyof typeof GEMINI_TRANSLATION_LANGUAGES;
export type AdditionalLanguageCode = keyof typeof ADDITIONAL_TRANSLATION_LANGUAGES;
export type TranslationLanguageCode = keyof typeof ALL_TRANSLATION_LANGUAGES;

// Helper function to check if a language is officially supported by Gemini
export const isOfficiallySupported = (languageCode: string): boolean => {
	return languageCode in GEMINI_TRANSLATION_LANGUAGES;
};

// Helper function to get language info
export const getTranslationLanguageInfo = (languageCode: string) => {
	return ALL_TRANSLATION_LANGUAGES[languageCode as TranslationLanguageCode] || null;
};
