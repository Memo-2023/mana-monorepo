import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseMatrixService, MatrixBotConfig, MatrixRoomEvent } from '@manacore/matrix-bot-common';
import { CommandRouterService, CommandContext } from './command-router.service';
import { VoiceService } from '../voice/voice.service';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	private voiceEnabled: boolean;

	constructor(
		configService: ConfigService,
		@Inject(forwardRef(() => CommandRouterService))
		private commandRouter: CommandRouterService,
		@Inject(forwardRef(() => VoiceService))
		private voiceService: VoiceService
	) {
		super(configService);
		this.voiceEnabled = configService.get('voice.enabled') !== false;
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/mana-bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	async onModuleInit() {
		await super.onModuleInit();

		if (!this.client) return;

		// Handle room invites with introduction
		this.client.on('room.invite', async (roomId: string) => {
			this.logger.log(`Invited to room ${roomId}, joining...`);
			await this.client.joinRoom(roomId);

			setTimeout(async () => {
				try {
					await this.sendBotIntroduction(roomId);
				} catch (error) {
					this.logger.error(`Failed to send introduction to ${roomId}:`, error);
				}
			}, 2000);
		});

		// Handle member joins for welcome message
		this.client.on('room.event', async (roomId: string, event: any) => {
			if (event.type === 'm.room.member' && event.content?.membership === 'join') {
				const userId = event.state_key;
				if (userId === this.botUserId) return;
				if (event.unsigned?.prev_content?.membership !== 'join') {
					await this.sendWelcomeMessage(roomId, userId);
				}
			}
		});

		this.botUserId = await this.client.getUserId();
		this.logger.log(`Mana Gateway Bot connected`);
		this.logger.log(`Bot user ID: ${this.botUserId}`);
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		const ctx: CommandContext = {
			roomId,
			userId: sender,
			message,
			event,
		};

		try {
			// Set typing indicator
			await this.client.setTyping(roomId, true, 30000);

			// Route the message
			const response = await this.commandRouter.route(ctx);

			// Stop typing
			await this.client.setTyping(roomId, false);

			if (response) {
				await this.sendReply(roomId, event, response);
			}
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error(`Error handling message:`, error);
			await this.sendReply(
				roomId,
				event,
				'❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
			);
		}
	}

	/**
	 * Handle voice note messages - transcribe, process, and respond with audio
	 */
	protected async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		if (!this.voiceEnabled) {
			return;
		}

		const audioUrl = event.content?.url;
		if (!audioUrl) {
			this.logger.warn('Audio message without URL');
			return;
		}

		try {
			// Set typing indicator
			await this.client.setTyping(roomId, true, 60000);

			// Download audio from Matrix
			this.logger.debug(`Downloading audio from ${audioUrl}`);
			const audioBuffer = await this.downloadMedia(audioUrl);

			// Transcribe audio
			this.logger.debug(`Transcribing ${audioBuffer.length} bytes`);
			const transcription = await this.voiceService.transcribe(audioBuffer);

			if (!transcription.text || transcription.text.trim() === '') {
				await this.client.setTyping(roomId, false);
				await this.sendReply(
					roomId,
					event,
					'🎤 Ich konnte leider nichts verstehen. Bitte versuche es noch einmal.'
				);
				return;
			}

			const message = transcription.text.trim();
			this.logger.log(`Transcribed from ${sender}: "${message}"`);

			// Show what was understood
			await this.sendReply(roomId, event, `🎤 *"${message}"*`);

			// Create context and route
			const ctx: CommandContext = {
				roomId,
				userId: sender,
				message,
				event,
				isVoice: true, // Flag for voice input
			};

			// Route the transcribed message
			const response = await this.commandRouter.route(ctx);

			// Stop typing
			await this.client.setTyping(roomId, false);

			if (response) {
				// Send text response first
				await this.sendReply(roomId, event, response);

				// Then generate and send audio response (non-blocking)
				const prefs = this.voiceService.getUserPreferences(sender);
				if (prefs.voiceEnabled) {
					this.generateAndSendAudioResponse(roomId, response, sender).catch((err) =>
						this.logger.error(`Failed to send audio response: ${err}`)
					);
				}
			}
		} catch (error) {
			await this.client.setTyping(roomId, false);
			this.logger.error(`Error handling voice message:`, error);
			await this.sendReply(
				roomId,
				event,
				'❌ Spracherkennung fehlgeschlagen. Bitte versuche es noch einmal.'
			);
		}
	}

	/**
	 * Generate TTS audio and send as Matrix audio message
	 */
	private async generateAndSendAudioResponse(
		roomId: string,
		text: string,
		userId: string
	): Promise<void> {
		try {
			// Prepare text for speech (remove markdown, emojis, etc.)
			const speechText = this.prepareTextForSpeech(text);

			// Skip if text is too short or empty
			if (!speechText || speechText.length < 5) {
				return;
			}

			// Skip if text is very long (summarize would be better)
			if (speechText.length > 800) {
				this.logger.debug(`Text too long for audio (${speechText.length} chars), skipping`);
				return;
			}

			// Generate audio
			const audioBuffer = await this.voiceService.synthesize(speechText, userId);

			// Upload to Matrix
			const mxcUrl = await this.uploadMedia(audioBuffer, 'audio/mpeg', 'response.mp3');

			// Send audio message
			await this.client.sendMessage(roomId, {
				msgtype: 'm.audio',
				body: 'Sprachantwort',
				url: mxcUrl,
				info: {
					mimetype: 'audio/mpeg',
					size: audioBuffer.length,
				},
			});

			this.logger.debug(`Sent audio response (${audioBuffer.length} bytes)`);
		} catch (error) {
			this.logger.error(`Failed to generate audio response: ${error}`);
			// Don't throw - audio is optional
		}
	}

	/**
	 * Prepare text for text-to-speech
	 * Removes markdown formatting, excessive whitespace, and formats for natural speech
	 */
	private prepareTextForSpeech(text: string): string {
		let result = text;

		// Remove code blocks
		result = result.replace(/```[\s\S]*?```/g, '');
		result = result.replace(/`[^`]+`/g, '');

		// Remove markdown formatting
		result = result.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
		result = result.replace(/\*(.+?)\*/g, '$1'); // Italic
		result = result.replace(/~~(.+?)~~/g, '$1'); // Strikethrough
		result = result.replace(/^#+\s*/gm, ''); // Headers

		// Remove common emojis (keep some for context)
		result = result.replace(/[📋📅⏱️🔮💡❌✅🎤🔊☀️💪🔔]/g, '');

		// Convert bullet points to natural speech
		result = result.replace(/^[•\-]\s*/gm, '');

		// Convert numbered lists
		result = result.replace(/^\d+\.\s*/gm, '');

		// Clean up time formats for German speech
		result = result.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
			const hour = parseInt(h);
			const min = parseInt(m);
			if (min === 0) {
				return `${hour} Uhr`;
			} else if (min === 30) {
				return `halb ${hour + 1}`;
			} else if (min === 15) {
				return `viertel nach ${hour}`;
			} else if (min === 45) {
				return `viertel vor ${hour + 1}`;
			}
			return `${hour} Uhr ${min}`;
		});

		// Clean up multiple newlines and spaces
		result = result.replace(/\n{2,}/g, '. ');
		result = result.replace(/\n/g, ' ');
		result = result.replace(/\s{2,}/g, ' ');

		// Remove URLs
		result = result.replace(/https?:\/\/[^\s]+/g, '');

		// Clean up punctuation
		result = result.replace(/\s+([.,!?])/g, '$1');
		result = result.replace(/([.,!?])\s*([.,!?])/g, '$1');

		return result.trim();
	}

	private async sendWelcomeMessage(roomId: string, userId: string) {
		try {
			await this.sendMessage(roomId, WELCOME_TEXT);
			this.logger.log(`Sent welcome message to ${userId} in ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to send welcome message: ${error}`);
		}
	}

	private async sendBotIntroduction(roomId: string) {
		await this.sendMessage(roomId, BOT_INTRODUCTION);

		// Try to pin the help message
		try {
			const helpEventId = await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: HELP_TEXT,
				format: 'org.matrix.custom.html',
				formatted_body: this.markdownToHtmlPublic(HELP_TEXT),
			});

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});
			this.logger.log(`Pinned help message in ${roomId}`);
		} catch (error) {
			this.logger.debug(`Could not pin help (might lack permissions): ${error}`);
		}
	}

	private markdownToHtmlPublic(text: string): string {
		return text
			.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/~~(.+?)~~/g, '<del>$1</del>')
			.replace(/\n/g, '<br>');
	}

	getClient() {
		return this.client;
	}
}
