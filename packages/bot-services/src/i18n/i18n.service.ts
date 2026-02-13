import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	Language,
	BotTranslations,
	TodoTranslations,
	CalendarTranslations,
	ContactsTranslations,
	ClockTranslations,
	GiftTranslations,
	I18nOptions,
} from './types';
import { de } from './locales/de';
import { en } from './locales/en';
import { SessionService } from '../session/session.service';

/**
 * Injection token for I18n options
 */
export const I18N_OPTIONS = 'I18N_OPTIONS';

/**
 * Session data key for language preference
 */
const LANGUAGE_KEY = 'language';

/**
 * All available translations
 */
const translations: Record<Language, BotTranslations> = { de, en };

/**
 * Language display names
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
	de: 'Deutsch',
	en: 'English',
};

/**
 * I18n Service for Matrix Bots
 *
 * Provides multi-language support with:
 * - Per-user language preference (stored in session)
 * - Default language from environment variable
 * - Placeholder substitution in translations
 *
 * @example
 * ```typescript
 * // Get translator for a user
 * const t = await i18n.getTranslator(userId, 'todo');
 *
 * // Use translations
 * const msg = t('taskCreated', { title: 'Buy milk' });
 * // → "Aufgabe erstellt: **Buy milk**" (if user language is German)
 * ```
 */
@Injectable()
export class I18nService {
	private readonly logger = new Logger(I18nService.name);
	private readonly defaultLanguage: Language;

	constructor(
		@Optional() private sessionService?: SessionService,
		@Optional() private configService?: ConfigService,
		@Optional() @Inject(I18N_OPTIONS) private options?: I18nOptions
	) {
		// Priority: options > env > config > 'de'
		this.defaultLanguage =
			options?.defaultLanguage ||
			(process.env.BOT_DEFAULT_LANGUAGE as Language) ||
			this.configService?.get<Language>('bot.defaultLanguage') ||
			'de';

		this.logger.log(`Default language: ${this.defaultLanguage}`);
	}

	/**
	 * Get the language for a user
	 */
	async getLanguage(userId: string): Promise<Language> {
		if (this.sessionService) {
			const lang = await this.sessionService.getSessionData<Language>(userId, LANGUAGE_KEY);
			if (lang && this.isValidLanguage(lang)) {
				return lang;
			}
		}
		return this.defaultLanguage;
	}

	/**
	 * Set the language for a user
	 */
	async setLanguage(userId: string, language: Language): Promise<void> {
		if (!this.isValidLanguage(language)) {
			throw new Error(
				`Invalid language: ${language}. Available: ${this.getAvailableLanguages().join(', ')}`
			);
		}
		if (this.sessionService) {
			await this.sessionService.setSessionData(userId, LANGUAGE_KEY, language);
			this.logger.log(`Language set for ${userId}: ${language}`);
		}
	}

	/**
	 * Check if a language code is valid
	 */
	isValidLanguage(lang: string): lang is Language {
		return lang === 'de' || lang === 'en';
	}

	/**
	 * Get list of available languages
	 */
	getAvailableLanguages(): Language[] {
		return ['de', 'en'];
	}

	/**
	 * Get language display name
	 */
	getLanguageName(lang: Language): string {
		return LANGUAGE_NAMES[lang];
	}

	/**
	 * Get all translations for a language
	 */
	getTranslations(language: Language): BotTranslations {
		return translations[language] || translations[this.defaultLanguage];
	}

	/**
	 * Get a translator function for todo bot
	 */
	async getTodoTranslator(
		userId: string
	): Promise<(key: keyof TodoTranslations, params?: Record<string, string | number>) => string> {
		const lang = await this.getLanguage(userId);
		const t = translations[lang].todo;
		return (key, params) => this.interpolate(t[key], params);
	}

	/**
	 * Get a translator function for calendar bot
	 */
	async getCalendarTranslator(
		userId: string
	): Promise<
		(key: keyof CalendarTranslations, params?: Record<string, string | number>) => string
	> {
		const lang = await this.getLanguage(userId);
		const t = translations[lang].calendar;
		return (key, params) => this.interpolate(t[key], params);
	}

	/**
	 * Get a translator function for contacts bot
	 */
	async getContactsTranslator(
		userId: string
	): Promise<
		(key: keyof ContactsTranslations, params?: Record<string, string | number>) => string
	> {
		const lang = await this.getLanguage(userId);
		const t = translations[lang].contacts;
		return (key, params) => this.interpolate(t[key], params);
	}

	/**
	 * Get a translator function for clock bot
	 */
	async getClockTranslator(
		userId: string
	): Promise<(key: keyof ClockTranslations, params?: Record<string, string | number>) => string> {
		const lang = await this.getLanguage(userId);
		const t = translations[lang].clock;
		return (key, params) => this.interpolate(t[key], params);
	}

	/**
	 * Get a translator function for gift commands
	 */
	async getGiftTranslator(
		userId: string
	): Promise<(key: keyof GiftTranslations, params?: Record<string, string | number>) => string> {
		const lang = await this.getLanguage(userId);
		const t = translations[lang].gift;
		return (key, params) => this.interpolate(t[key], params);
	}

	/**
	 * Get translations directly for a bot type
	 */
	async getTodoTranslations(userId: string): Promise<TodoTranslations> {
		const lang = await this.getLanguage(userId);
		return translations[lang].todo;
	}

	async getCalendarTranslations(userId: string): Promise<CalendarTranslations> {
		const lang = await this.getLanguage(userId);
		return translations[lang].calendar;
	}

	async getContactsTranslations(userId: string): Promise<ContactsTranslations> {
		const lang = await this.getLanguage(userId);
		return translations[lang].contacts;
	}

	async getClockTranslations(userId: string): Promise<ClockTranslations> {
		const lang = await this.getLanguage(userId);
		return translations[lang].clock;
	}

	async getGiftTranslations(userId: string): Promise<GiftTranslations> {
		const lang = await this.getLanguage(userId);
		return translations[lang].gift;
	}

	/**
	 * Interpolate placeholders in a string
	 *
	 * @example
	 * interpolate('Hello {name}!', { name: 'World' })
	 * // → 'Hello World!'
	 */
	interpolate(template: string, params?: Record<string, string | number>): string {
		if (!params) return template;
		return template.replace(/\{(\w+)\}/g, (_, key) => {
			return params[key]?.toString() ?? `{${key}}`;
		});
	}

	/**
	 * Format a date according to user's language
	 */
	async formatDate(userId: string, date: Date | string): Promise<string> {
		const lang = await this.getLanguage(userId);
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	/**
	 * Format a time according to user's language
	 */
	async formatTime(userId: string, date: Date | string): Promise<string> {
		const lang = await this.getLanguage(userId);
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}
}
