import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	type MatrixBotConfig,
	type MatrixRoomEvent,
} from '@manacore/matrix-bot-common';
import { SessionService, I18nService, type Language } from '@manacore/bot-services';
import { OnboardingService } from '../onboarding/onboarding.service';
import { HELP_TEXT, MESSAGES } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	constructor(
		configService: ConfigService,
		private readonly sessionService: SessionService,
		private readonly i18nService: I18nService,
		private readonly onboardingService: OnboardingService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string | null {
		return MESSAGES.de.welcome;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		const lang = await this.getLanguage(sender);

		// Handle commands first
		if (message.startsWith('!')) {
			const [command, ...args] = message.slice(1).split(' ');
			await this.handleCommand(roomId, event, sender, command.toLowerCase(), args.join(' '), lang);
			return;
		}

		// Check if user is in onboarding flow
		if (this.onboardingService.isInOnboarding(sender)) {
			await this.handleOnboardingInput(roomId, event, sender, message, lang);
			return;
		}

		// Natural language hints
		const lowerMessage = message.toLowerCase();
		if (lowerMessage.includes('hilfe') || lowerMessage.includes('help')) {
			await this.sendReply(roomId, event, HELP_TEXT);
			return;
		}

		if (lowerMessage.includes('profil') || lowerMessage.includes('profile')) {
			await this.handleProfileCommand(roomId, event, sender, lang);
			return;
		}

		// No action for other messages
	}

	private async handleCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		command: string,
		args: string,
		lang: Language
	): Promise<void> {
		const messages = MESSAGES[lang];

		switch (command) {
			case 'start':
				await this.handleStartCommand(roomId, event, userId, lang);
				break;

			case 'profile':
			case 'profil':
				await this.handleProfileCommand(roomId, event, userId, lang);
				break;

			case 'edit':
			case 'bearbeiten':
				await this.handleEditCommand(roomId, event, userId, args, lang);
				break;

			case 'skip':
			case 'ueberspringen':
				await this.handleSkipCommand(roomId, event, userId, lang);
				break;

			case 'help':
			case 'hilfe':
				await this.sendReply(roomId, event, HELP_TEXT);
				break;

			case 'cancel':
			case 'abbrechen':
				await this.handleCancelCommand(roomId, event, userId, lang);
				break;

			default:
				// Unknown command - ignore or show help
				break;
		}
	}

	private async handleStartCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		lang: Language
	): Promise<void> {
		const messages = MESSAGES[lang];

		// Check if user is logged in
		const token = await this.getToken(userId);
		if (!token) {
			await this.sendReply(roomId, event, messages.loginRequired);
			return;
		}

		// Check if already onboarded
		const hasCompleted = await this.onboardingService.hasCompletedOnboarding(token);
		if (hasCompleted) {
			// Allow restart
			this.onboardingService.resetSession(userId);
		}

		// Start onboarding
		const result = this.onboardingService.processAction(userId, { type: 'START' }, lang);
		const message = this.getMessage(result.messageKey, lang, result.messageParams);
		await this.sendReply(roomId, event, message);
	}

	private async handleProfileCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		lang: Language
	): Promise<void> {
		const messages = MESSAGES[lang];

		const token = await this.getToken(userId);
		if (!token) {
			await this.sendReply(roomId, event, messages.loginRequired);
			return;
		}

		const profile = await this.onboardingService.getProfile(token);
		if (!profile || !profile.onboardingCompleted) {
			await this.sendReply(roomId, event, messages.noProfile);
			return;
		}

		const message = this.formatMessage(messages.profileDisplay, {
			name: profile.displayName || '-',
			interests: profile.interests?.length ? profile.interests.join(', ') : '-',
			language: profile.locale === 'en' ? 'English' : 'Deutsch',
		});
		await this.sendReply(roomId, event, message);
	}

	private async handleEditCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string,
		lang: Language
	): Promise<void> {
		const messages = MESSAGES[lang];

		const token = await this.getToken(userId);
		if (!token) {
			await this.sendReply(roomId, event, messages.loginRequired);
			return;
		}

		const parts = args.split(' ');
		if (parts.length < 2) {
			await this.sendReply(
				roomId,
				event,
				lang === 'de'
					? 'Verwendung: `!edit [name|interests|language] [Wert]`'
					: 'Usage: `!edit [name|interests|language] [value]`'
			);
			return;
		}

		const field = parts[0].toLowerCase();
		const value = parts.slice(1).join(' ');

		let fieldKey: 'displayName' | 'interests' | 'locale' | null = null;
		if (field === 'name' || field === 'namen') {
			fieldKey = 'displayName';
		} else if (field === 'interests' || field === 'interessen') {
			fieldKey = 'interests';
		} else if (field === 'language' || field === 'sprache' || field === 'lang') {
			fieldKey = 'locale';
		}

		if (!fieldKey) {
			await this.sendReply(
				roomId,
				event,
				lang === 'de'
					? 'Unbekanntes Feld. Verfugbar: name, interests, language'
					: 'Unknown field. Available: name, interests, language'
			);
			return;
		}

		const success = await this.onboardingService.updateProfileField(token, fieldKey, value);
		if (success) {
			await this.sendReply(roomId, event, messages.updated);
		} else {
			await this.sendReply(
				roomId,
				event,
				lang === 'de' ? 'Fehler beim Aktualisieren.' : 'Error updating.'
			);
		}
	}

	private async handleSkipCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		lang: Language
	): Promise<void> {
		const messages = MESSAGES[lang];

		if (!this.onboardingService.isInOnboarding(userId)) {
			return;
		}

		if (!this.onboardingService.canSkip(userId)) {
			await this.sendReply(roomId, event, messages.skipNotAllowed);
			return;
		}

		const result = this.onboardingService.processAction(userId, { type: 'SKIP' }, lang);
		const message = this.getMessage(result.messageKey, lang, result.messageParams);
		await this.sendReply(roomId, event, message);

		// If completed after skip, save the profile
		if (result.session.state === 'COMPLETED') {
			await this.saveOnboardingData(userId, result.session.data, roomId, event, lang);
		}
	}

	private async handleCancelCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		lang: Language
	): Promise<void> {
		const messages = MESSAGES[lang];

		if (this.onboardingService.isInOnboarding(userId)) {
			this.onboardingService.resetSession(userId);
			await this.sendReply(roomId, event, messages.cancelled);
		}
	}

	private async handleOnboardingInput(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		input: string,
		lang: Language
	): Promise<void> {
		const result = this.onboardingService.processAction(
			userId,
			{ type: 'INPUT', value: input },
			lang
		);

		const message = this.getMessage(result.messageKey, lang, result.messageParams);
		await this.sendReply(roomId, event, message);

		// If completed, save the profile
		if (result.session.state === 'COMPLETED') {
			await this.saveOnboardingData(userId, result.session.data, roomId, event, lang);
		}
	}

	private async saveOnboardingData(
		userId: string,
		data: { displayName?: string; interests?: string[]; locale?: 'de' | 'en' },
		roomId: string,
		event: MatrixRoomEvent,
		lang: Language
	): Promise<void> {
		const token = await this.getToken(userId);
		if (!token) {
			this.logger.error(`No token for user ${userId}, cannot save profile`);
			return;
		}

		const success = await this.onboardingService.saveProfile(token, data);
		if (!success) {
			await this.sendReply(
				roomId,
				event,
				lang === 'de'
					? 'Hinweis: Profil konnte nicht gespeichert werden. Versuche es spater erneut.'
					: 'Note: Profile could not be saved. Try again later.'
			);
		}

		// Also update the i18n language
		if (data.locale) {
			await this.i18nService.setLanguage(userId, data.locale as Language);
		}

		// Clear the session
		this.onboardingService.resetSession(userId);
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	private async getToken(userId: string): Promise<string | null> {
		return this.sessionService.getToken(userId);
	}

	private async getLanguage(userId: string): Promise<Language> {
		return this.i18nService.getLanguage(userId);
	}

	private getMessage(key: string, lang: Language, params?: Record<string, string>): string {
		const messages = MESSAGES[lang];
		let message = (messages as Record<string, string>)[key] || key;

		if (params) {
			message = this.formatMessage(message, params);
		}

		return message;
	}

	private formatMessage(template: string, params: Record<string, string>): string {
		let result = template;
		for (const [key, value] of Object.entries(params)) {
			result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
		}
		return result;
	}
}
