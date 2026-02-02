import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { TtsService } from '../tts/tts.service';
import { TranscriptionService, SessionService, CreditService } from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT } from '../config/configuration';

interface UserSettings {
	voice: string;
	speed: number;
}

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly defaultVoice: string;
	private readonly defaultSpeed: number;
	private readonly maxTextLength: number;

	// User settings storage (in-memory)
	private userSettings: Map<string, UserSettings> = new Map();

	// Track processed events to prevent duplicates
	private processedEvents: Set<string> = new Set();

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['voice', 'stimme', 'stimme aendern'], command: 'voice' },
		{ keywords: ['voices', 'stimmen', 'verfuegbare stimmen'], command: 'voices' },
		{ keywords: ['speed', 'geschwindigkeit', 'tempo'], command: 'speed' },
	]);

	constructor(
		configService: ConfigService,
		private ttsService: TtsService,
		private readonly transcriptionService: TranscriptionService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
		this.defaultVoice = this.configService.get<string>('tts.defaultVoice') || 'af_heart';
		this.defaultSpeed = this.configService.get<number>('tts.defaultSpeed') || 1.0;
		this.maxTextLength = this.configService.get<number>('tts.maxTextLength') || 500;
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

		// Only handle text messages
		if (msgtype !== 'm.text') return;

		const body = event.content?.body?.trim();
		if (!body) return;

		await this.handleTextMessage(roomId, event, body);
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

			// Convert text to speech
			await this.handleTextToSpeech(roomId, event, userId, body);
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendReply(roomId, event, 'Ein Fehler ist aufgetreten.');
		}
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		_sender: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) return;

			const audioBuffer = await this.downloadMedia(mxcUrl);
			const text = await this.transcriptionService.transcribe(audioBuffer);
			if (!text) {
				await this.sendReply(roomId, event, 'Sprachnachricht konnte nicht erkannt werden.');
				return;
			}

			await this.sendMessage(roomId, `*"${text}"*`);
			await this.handleTextMessage(roomId, event, text);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(roomId, event, 'Fehler bei der Spracherkennung.');
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

			case 'voice':
			case 'stimme':
				await this.handleVoiceCommand(roomId, event, userId, args);
				break;

			case 'voices':
			case 'stimmen':
				await this.handleVoicesCommand(roomId, event);
				break;

			case 'speed':
			case 'geschwindigkeit':
				await this.handleSpeedCommand(roomId, event, userId, args);
				break;

			case 'status':
				await this.handleStatusCommand(roomId, event, userId);
				break;

			default:
				// Silently ignore unknown commands
				break;
		}
	}

	private async handleVoiceCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		if (!args.trim()) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!voice [name]`\n\nBeispiel: `!voice bm_daniel`\n\nZeige alle Stimmen mit `!voices`'
			);
			return;
		}

		const voiceName = args.trim().toLowerCase();

		// Check if voice exists
		const exists = await this.ttsService.voiceExists(voiceName);
		if (!exists) {
			await this.sendReply(
				roomId,
				event,
				`Stimme "${voiceName}" nicht gefunden.\n\nZeige alle Stimmen mit \`!voices\``
			);
			return;
		}

		// Update user settings
		const settings = this.getUserSettings(userId);
		settings.voice = voiceName;
		this.userSettings.set(userId, settings);

		await this.sendReply(roomId, event, `Stimme geaendert zu: **${voiceName}**`);
	}

	private async handleVoicesCommand(roomId: string, event: MatrixRoomEvent) {
		try {
			const voices = await this.ttsService.getVoices();

			let response = '**Verfuegbare Stimmen:**\n\n';

			if (voices.kokoro_voices.length > 0) {
				response += '**Kokoro (schnell):**\n';
				const voiceList = voices.kokoro_voices
					.slice(0, 15) // Limit to first 15 to avoid message being too long
					.map((v) => `- \`${v.id}\``)
					.join('\n');
				response += voiceList;

				if (voices.kokoro_voices.length > 15) {
					response += `\n... und ${voices.kokoro_voices.length - 15} weitere`;
				}
			}

			if (voices.custom_voices.length > 0) {
				response += '\n\n**Eigene Stimmen:**\n';
				response += voices.custom_voices.map((v) => `- \`${v.id}\` - ${v.name}`).join('\n');
			}

			response += '\n\nWechseln mit: `!voice [name]`';

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Failed to get voices:', error);
			await this.sendReply(roomId, event, 'Fehler beim Abrufen der Stimmen.');
		}
	}

	private async handleSpeedCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		if (!args.trim()) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!speed [0.5-2.0]`\n\nBeispiel: `!speed 1.2` (20% schneller)'
			);
			return;
		}

		const speed = parseFloat(args.trim());
		if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
			await this.sendReply(roomId, event, 'Geschwindigkeit muss zwischen 0.5 und 2.0 liegen.');
			return;
		}

		const settings = this.getUserSettings(userId);
		settings.speed = speed;
		this.userSettings.set(userId, settings);

		await this.sendReply(roomId, event, `Geschwindigkeit geaendert zu: **${speed}x**`);
	}

	private async handleStatusCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		const settings = this.getUserSettings(userId);
		const ttsHealthy = await this.ttsService.isHealthy();
		const loggedIn = await this.sessionService.isLoggedIn(userId);
		const session = await this.sessionService.getSession(userId);
		const token = await this.sessionService.getToken(userId);

		let response = '**Aktuelle Einstellungen:**\n\n';
		response += `Stimme: \`${settings.voice}\`\n`;
		response += `Geschwindigkeit: ${settings.speed}x\n`;
		response += `Max. Textlaenge: ${this.maxTextLength} Zeichen\n\n`;
		response += `TTS-Service: ${ttsHealthy ? 'Online' : 'Offline'}\n`;

		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			response += `\n👤 Angemeldet als: ${session.email}\n`;
			response += `⚡ Credits: ${balance.balance.toFixed(2)}`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleTextToSpeech(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		text: string
	) {
		// Check text length
		if (text.length > this.maxTextLength) {
			await this.sendReply(
				roomId,
				event,
				`Text zu lang (${text.length}/${this.maxTextLength} Zeichen). Bitte kurze Nachricht senden.`
			);
			return;
		}

		const settings = this.getUserSettings(userId);

		// Set typing indicator
		await this.client.setTyping(roomId, true, 30000);

		try {
			// Synthesize speech
			const audioBuffer = await this.ttsService.synthesize(text, settings.voice, settings.speed);

			// Stop typing indicator
			await this.client.setTyping(roomId, false);

			// Upload audio to Matrix (MP3 for better browser compatibility)
			const mxcUrl = await this.client.uploadContent(audioBuffer, 'audio/mpeg', 'speech.mp3');

			// Calculate approximate duration (rough estimate based on text length and speed)
			const estimatedDuration = Math.round(((text.length / 15) * 1000) / settings.speed);

			// Send audio message
			await this.client.sendMessage(roomId, {
				msgtype: 'm.audio',
				body: 'speech.mp3',
				url: mxcUrl,
				info: {
					mimetype: 'audio/mpeg',
					size: audioBuffer.length,
					duration: estimatedDuration,
				},
			});

			this.logger.debug(`Sent audio message for text: "${text.substring(0, 30)}..."`);
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error('TTS processing failed:', error);
			await this.sendReply(
				roomId,
				event,
				'Fehler bei der Sprachsynthese. Ist der TTS-Service erreichbar?'
			);
		}
	}

	private getUserSettings(userId: string): UserSettings {
		if (!this.userSettings.has(userId)) {
			this.userSettings.set(userId, {
				voice: this.defaultVoice,
				speed: this.defaultSpeed,
			});
		}
		return this.userSettings.get(userId)!;
	}
}
