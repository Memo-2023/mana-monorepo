import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichReply,
} from 'matrix-bot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import { TtsService } from '../tts/tts.service';
import { HELP_TEXT, WELCOME_TEXT } from '../config/configuration';

interface UserSettings {
	voice: string;
	speed: number;
}

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client!: MatrixClient;
	private readonly homeserverUrl: string;
	private readonly accessToken: string;
	private readonly allowedRooms: string[];
	private readonly storagePath: string;
	private readonly defaultVoice: string;
	private readonly defaultSpeed: number;
	private readonly maxTextLength: number;
	private botUserId: string = '';

	// User settings storage (in-memory)
	private userSettings: Map<string, UserSettings> = new Map();

	// Track processed events to prevent duplicates
	private processedEvents: Set<string> = new Set();

	constructor(
		private configService: ConfigService,
		private ttsService: TtsService
	) {
		this.homeserverUrl = this.configService.get<string>(
			'matrix.homeserverUrl',
			'http://localhost:8008'
		);
		this.accessToken = this.configService.get<string>('matrix.accessToken', '');
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms', []);
		this.storagePath = this.configService.get<string>(
			'matrix.storagePath',
			'./data/bot-storage.json'
		);
		this.defaultVoice = this.configService.get<string>('tts.defaultVoice', 'af_heart');
		this.defaultSpeed = this.configService.get<number>('tts.defaultSpeed', 1.0);
		this.maxTextLength = this.configService.get<number>('tts.maxTextLength', 500);
	}

	async onModuleInit() {
		if (!this.accessToken) {
			this.logger.warn('No Matrix access token configured. Bot will not start.');
			return;
		}

		await this.initializeClient();
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.stop();
		}
	}

	private async initializeClient() {
		try {
			const storageDir = path.dirname(this.storagePath);
			if (!fs.existsSync(storageDir)) {
				fs.mkdirSync(storageDir, { recursive: true });
			}

			const storage = new SimpleFsStorageProvider(this.storagePath);
			this.client = new MatrixClient(this.homeserverUrl, this.accessToken, storage);

			AutojoinRoomsMixin.setupOnClient(this.client);

			this.client.on('room.invite', async (roomId: string) => {
				this.logger.log(`Invited to room ${roomId}, joining...`);
				await this.client.joinRoom(roomId);

				setTimeout(async () => {
					await this.sendWelcome(roomId);
				}, 2000);
			});

			this.client.on('room.message', async (roomId: string, event: any) => {
				await this.handleMessage(roomId, event);
			});

			await this.client.start();
			this.botUserId = await this.client.getUserId();
			this.logger.log(`Matrix TTS Bot connected as ${this.botUserId}`);
		} catch (error) {
			this.logger.error('Failed to initialize Matrix client:', error);
		}
	}

	private async handleMessage(roomId: string, event: any) {
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
				this.processedEvents.delete(iterator.next().value);
			}
		}

		// Check room allowlist
		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		const userId = event.sender;
		const msgtype = event.content?.msgtype;

		// Only handle text messages
		if (msgtype !== 'm.text') return;

		const body = event.content.body?.trim();
		if (!body) return;

		try {
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

	private async executeCommand(
		roomId: string,
		event: any,
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

	private async handleVoiceCommand(roomId: string, event: any, userId: string, args: string) {
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

		await this.sendReply(roomId, event, `Stimme geandert zu: **${voiceName}**`);
	}

	private async handleVoicesCommand(roomId: string, event: any) {
		try {
			const voices = await this.ttsService.getVoices();

			let response = '**Verfugbare Stimmen:**\n\n';

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

	private async handleSpeedCommand(roomId: string, event: any, userId: string, args: string) {
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

		await this.sendReply(roomId, event, `Geschwindigkeit geandert zu: **${speed}x**`);
	}

	private async handleStatusCommand(roomId: string, event: any, userId: string) {
		const settings = this.getUserSettings(userId);
		const ttsHealthy = await this.ttsService.isHealthy();

		let response = '**Aktuelle Einstellungen:**\n\n';
		response += `Stimme: \`${settings.voice}\`\n`;
		response += `Geschwindigkeit: ${settings.speed}x\n`;
		response += `Max. Textlange: ${this.maxTextLength} Zeichen\n\n`;
		response += `TTS-Service: ${ttsHealthy ? 'Online' : 'Offline'}`;

		await this.sendReply(roomId, event, response);
	}

	private async handleTextToSpeech(roomId: string, event: any, userId: string, text: string) {
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

	private async sendWelcome(roomId: string) {
		try {
			await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: WELCOME_TEXT,
				format: 'org.matrix.custom.html',
				formatted_body: this.markdownToHtml(WELCOME_TEXT),
			});
		} catch (error) {
			this.logger.error('Failed to send welcome:', error);
		}
	}

	private async sendReply(roomId: string, event: any, message: string) {
		const reply = RichReply.createFor(roomId, event, message, this.markdownToHtml(message));
		reply.msgtype = 'm.text';
		await this.client.sendMessage(roomId, reply);
	}

	private markdownToHtml(text: string): string {
		return text
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/`(.+?)`/g, '<code>$1</code>')
			.replace(/\n/g, '<br>');
	}
}
