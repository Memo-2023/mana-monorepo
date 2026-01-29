import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichReply,
} from 'matrix-bot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import { CommandRouterService, CommandContext } from './command-router.service';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client: MatrixClient;
	private botUserId: string = '';
	private readonly homeserverUrl: string;
	private readonly accessToken: string;
	private readonly allowedRooms: string[];
	private readonly storagePath: string;

	constructor(
		private configService: ConfigService,
		@Inject(forwardRef(() => CommandRouterService))
		private commandRouter: CommandRouterService
	) {
		this.homeserverUrl = this.configService.get<string>('matrix.homeserverUrl', 'http://localhost:8008');
		this.accessToken = this.configService.get<string>('matrix.accessToken', '');
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms', []);
		this.storagePath = this.configService.get<string>('matrix.storagePath', './data/mana-bot-storage.json');
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
			this.logger.log('Matrix client stopped');
		}
	}

	private async initializeClient() {
		try {
			// Ensure storage directory exists
			const storageDir = path.dirname(this.storagePath);
			if (!fs.existsSync(storageDir)) {
				fs.mkdirSync(storageDir, { recursive: true });
			}

			const storage = new SimpleFsStorageProvider(this.storagePath);
			this.client = new MatrixClient(this.homeserverUrl, this.accessToken, storage);

			// Auto-join rooms when invited
			AutojoinRoomsMixin.setupOnClient(this.client);

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

			// Set up message handler
			this.client.on('room.message', async (roomId: string, event: any) => {
				await this.handleMessage(roomId, event);
			});

			await this.client.start();
			this.botUserId = await this.client.getUserId();

			this.logger.log(`Mana Gateway Bot connected to ${this.homeserverUrl}`);
			this.logger.log(`Bot user ID: ${this.botUserId}`);

			if (this.allowedRooms.length > 0) {
				this.logger.log(`Allowed rooms: ${this.allowedRooms.join(', ')}`);
			} else {
				this.logger.log('No room restrictions - bot will respond in all rooms');
			}
		} catch (error) {
			this.logger.error('Failed to initialize Matrix client:', error);
		}
	}

	private async handleMessage(roomId: string, event: any) {
		// Ignore messages from the bot itself
		if (event.sender === this.botUserId) return;

		// Check if room is allowed
		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		const msgtype = event.content?.msgtype;
		const body = event.content?.body?.trim();

		// Only handle text messages for now
		if (msgtype !== 'm.text' || !body) return;

		const ctx: CommandContext = {
			roomId,
			userId: event.sender,
			message: body,
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

	async sendReply(roomId: string, event: any, message: string) {
		const reply = RichReply.createFor(roomId, event, message, this.markdownToHtml(message));
		reply.msgtype = 'm.text';
		await this.client.sendMessage(roomId, reply);
	}

	async sendMessage(roomId: string, message: string) {
		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: message,
			format: 'org.matrix.custom.html',
			formatted_body: this.markdownToHtml(message),
		});
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
				formatted_body: this.markdownToHtml(HELP_TEXT),
			});

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});
			this.logger.log(`Pinned help message in ${roomId}`);
		} catch (error) {
			this.logger.debug(`Could not pin help (might lack permissions): ${error}`);
		}
	}

	private markdownToHtml(text: string): string {
		return text
			.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/~~(.+?)~~/g, '<del>$1</del>')
			.replace(/\n/g, '<br>');
	}

	getClient(): MatrixClient {
		return this.client;
	}
}
