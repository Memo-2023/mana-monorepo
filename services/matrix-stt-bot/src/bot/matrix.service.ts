import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { SttService, SttLanguage, SttModel } from '../stt/stt.service';
import { HELP_TEXT, WELCOME_TEXT } from '../config/configuration';

interface UserSettings {
	language: SttLanguage;
	model: SttModel;
}

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly defaultLanguage: SttLanguage;
	private readonly defaultModel: SttModel;

	// User settings storage (in-memory)
	private userSettings: Map<string, UserSettings> = new Map();

	// Track processed events to prevent duplicates
	private processedEvents: Set<string> = new Set();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['language', 'sprache', 'sprache aendern'], command: 'language' },
		{ keywords: ['model', 'modell'], command: 'model' },
	]);

	constructor(
		configService: ConfigService,
		private sttService: SttService
	) {
		super(configService);
		this.defaultLanguage =
			(this.configService.get<string>('stt.defaultLanguage') as SttLanguage) || 'de';
		this.defaultModel =
			(this.configService.get<string>('stt.defaultModel') as SttModel) || 'whisper';
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

	protected getIntroductionMessage(): string {
		return WELCOME_TEXT;
	}

	protected async onRoomMessage(roomId: string, event: MatrixRoomEvent): Promise<void> {
		// Ignore own messages
		if (event.sender === this.botUserId) return;

		// Prevent duplicate processing
		const eventId = event.event_id;
		if (eventId && this.processedEvents.has(eventId)) {
			return;
		}
		if (eventId) {
			this.processedEvents.add(eventId);
			// Clean up old events (keep last 1000)
			if (this.processedEvents.size > 1000) {
				const iterator = this.processedEvents.values();
				const firstValue = iterator.next().value;
				if (firstValue) {
					this.processedEvents.delete(firstValue);
				}
			}
		}

		// Check room allowlist
		if (!this.isRoomAllowed(roomId)) {
			return;
		}

		const msgtype = event.content?.msgtype;
		const userId = event.sender;

		// Handle audio messages (main functionality)
		if (msgtype === 'm.audio' || msgtype === 'm.file') {
			const mimetype = String(event.content?.info?.mimetype || '');
			if (mimetype.startsWith('audio/') || this.isAudioFile(event.content?.body)) {
				await this.handleAudioMessage(roomId, event, userId);
				return;
			}
		}

		// Handle text commands
		if (msgtype === 'm.text') {
			const body = event.content?.body?.trim();
			if (body) {
				await this.handleTextMessage(roomId, event, body);
			}
		}
	}

	private isAudioFile(filename?: string): boolean {
		if (!filename) return false;
		const audioExtensions = ['.ogg', '.mp3', '.wav', '.m4a', '.flac', '.webm', '.opus'];
		return audioExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) {
				this.logger.warn('Audio message without URL');
				return;
			}

			// Show typing indicator
			await this.client.setTyping(roomId, true, 30000);

			// Download audio
			const audioBuffer = await this.downloadMedia(mxcUrl);

			// Get user settings
			const settings = this.getUserSettings(userId);

			// Transcribe
			const result = await this.sttService.transcribe(
				audioBuffer,
				settings.language,
				settings.model
			);

			// Stop typing indicator
			await this.client.setTyping(roomId, false);

			if (!result.text || result.text.trim() === '') {
				await this.sendReply(roomId, event, 'Keine Sprache erkannt.');
				return;
			}

			// Format response
			let response = `**Transkription:**\n\n${result.text}`;

			// Add metadata if available
			const metadata: string[] = [];
			if (result.language) {
				metadata.push(`Sprache: ${result.language}`);
			}
			if (result.model) {
				metadata.push(`Modell: ${result.model}`);
			}
			if (result.duration) {
				metadata.push(`Dauer: ${result.duration.toFixed(1)}s`);
			}

			if (metadata.length > 0) {
				response += `\n\n*${metadata.join(' | ')}*`;
			}

			await this.sendReply(roomId, event, response);

			this.logger.debug(`Transcribed audio for ${userId}: "${result.text.substring(0, 50)}..."`);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(
				roomId,
				event,
				'Fehler bei der Transkription. Ist der STT-Service erreichbar?'
			);
		}
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		body: string
	): Promise<void> {
		const userId = event.sender;

		try {
			// Check for keyword commands first
			const keywordCommand = this.keywordDetector.detect(body);
			if (keywordCommand) {
				body = `!${keywordCommand}`;
			}

			// Handle ! commands
			if (body.startsWith('!')) {
				const [command, ...args] = body.slice(1).split(' ');
				await this.executeCommand(roomId, event, userId, command.toLowerCase(), args.join(' '));
				return;
			}

			// For regular text messages, just acknowledge
			// (This bot is primarily for audio transcription)
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendReply(roomId, event, 'Ein Fehler ist aufgetreten.');
		}
	}

	private async executeCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		command: string,
		args: string
	) {
		switch (command) {
			case 'help':
			case 'hilfe':
				await this.sendReply(roomId, event, HELP_TEXT);
				break;

			case 'language':
			case 'sprache':
				await this.handleLanguageCommand(roomId, event, userId, args);
				break;

			case 'model':
			case 'modell':
				await this.handleModelCommand(roomId, event, userId, args);
				break;

			case 'status':
				await this.handleStatusCommand(roomId, event, userId);
				break;

			default:
				// Silently ignore unknown commands
				break;
		}
	}

	private async handleLanguageCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		if (!args.trim()) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!language [de|en|auto]`\n\nBeispiel: `!language de`'
			);
			return;
		}

		const lang = args.trim().toLowerCase();
		const validLanguages: SttLanguage[] = ['de', 'en', 'auto'];

		if (!validLanguages.includes(lang as SttLanguage)) {
			await this.sendReply(
				roomId,
				event,
				`Ungueltige Sprache "${lang}".\n\nVerfuegbar: de, en, auto`
			);
			return;
		}

		const settings = this.getUserSettings(userId);
		settings.language = lang as SttLanguage;
		this.userSettings.set(userId, settings);

		await this.sendReply(roomId, event, `Sprache geaendert zu: **${lang}**`);
	}

	private async handleModelCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		if (!args.trim()) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!model [whisper|voxtral|auto]`\n\nBeispiel: `!model whisper`\n\n' +
					'**Modelle:**\n' +
					'- `whisper` - Whisper Large V3 (lokal, schnell)\n' +
					'- `voxtral` - Voxtral Mini (Cloud, Speaker Diarization)\n' +
					'- `auto` - Automatische Auswahl'
			);
			return;
		}

		const model = args.trim().toLowerCase();
		const validModels: SttModel[] = ['whisper', 'voxtral', 'auto'];

		if (!validModels.includes(model as SttModel)) {
			await this.sendReply(
				roomId,
				event,
				`Ungueltiges Modell "${model}".\n\nVerfuegbar: whisper, voxtral, auto`
			);
			return;
		}

		const settings = this.getUserSettings(userId);
		settings.model = model as SttModel;
		this.userSettings.set(userId, settings);

		await this.sendReply(roomId, event, `Modell geaendert zu: **${model}**`);
	}

	private async handleStatusCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		const settings = this.getUserSettings(userId);
		const sttHealthy = await this.sttService.isHealthy();

		let response = '**Aktuelle Einstellungen:**\n\n';
		response += `Sprache: \`${settings.language}\`\n`;
		response += `Modell: \`${settings.model}\`\n\n`;
		response += `STT-Service: ${sttHealthy ? 'Online' : 'Offline'}`;

		await this.sendReply(roomId, event, response);
	}

	private getUserSettings(userId: string): UserSettings {
		if (!this.userSettings.has(userId)) {
			this.userSettings.set(userId, {
				language: this.defaultLanguage,
				model: this.defaultModel,
			});
		}
		return this.userSettings.get(userId)!;
	}
}
