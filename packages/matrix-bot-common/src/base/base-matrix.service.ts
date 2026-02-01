import { Logger, type OnModuleInit, type OnModuleDestroy } from '@nestjs/common';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichReply,
} from 'matrix-bot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import { type MatrixBotConfig, type MatrixRoomEvent, isTextMessage, isAudioMessage } from './types';
import { markdownToHtml } from '../markdown/markdown-formatter';

/**
 * Abstract base class for Matrix bot services
 *
 * Provides common functionality:
 * - Matrix client initialization
 * - Room join handling
 * - Message routing
 * - Markdown message sending
 * - Graceful shutdown
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyBotService extends BaseMatrixService {
 *   protected async handleTextMessage(roomId: string, event: MatrixRoomEvent, message: string) {
 *     if (message.startsWith('!hello')) {
 *       await this.sendReply(roomId, event, 'Hello!');
 *     }
 *   }
 *
 *   protected getConfig(): MatrixBotConfig {
 *     return {
 *       homeserverUrl: this.configService.get('matrix.homeserverUrl'),
 *       accessToken: this.configService.get('matrix.accessToken'),
 *       storagePath: this.configService.get('matrix.storagePath'),
 *       allowedRooms: this.configService.get('matrix.allowedRooms'),
 *     };
 *   }
 * }
 * ```
 */
/**
 * Interface for config service to support both @nestjs/config v3 and v4
 */
export interface IConfigService {
	get<T = unknown>(propertyPath: string): T | undefined;
}

export abstract class BaseMatrixService implements OnModuleInit, OnModuleDestroy {
	protected readonly logger = new Logger(this.constructor.name);
	protected client!: MatrixClient;
	protected botUserId = '';
	protected readonly allowedRooms: string[];

	constructor(protected configService: IConfigService) {
		this.allowedRooms = this.getConfig().allowedRooms;
	}

	/**
	 * Get Matrix configuration - must be implemented by subclass
	 */
	protected abstract getConfig(): MatrixBotConfig;

	/**
	 * Handle a text message - must be implemented by subclass
	 */
	protected abstract handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void>;

	/**
	 * Handle an audio message (optional override)
	 */
	protected async handleAudioMessage(
		_roomId: string,
		_event: MatrixRoomEvent,
		_sender: string
	): Promise<void> {
		// Default: no-op, override in subclass for voice support
	}

	/**
	 * Get welcome/introduction message (optional override)
	 */
	protected getIntroductionMessage(): string | null {
		return null;
	}

	/**
	 * Initialize the Matrix client
	 */
	async onModuleInit(): Promise<void> {
		const config = this.getConfig();

		if (!config.accessToken) {
			this.logger.error('MATRIX_ACCESS_TOKEN is required');
			return;
		}

		// Ensure storage directory exists
		const storageDir = path.dirname(config.storagePath);
		if (!fs.existsSync(storageDir)) {
			fs.mkdirSync(storageDir, { recursive: true });
			this.logger.log(`Created storage directory: ${storageDir}`);
		}

		// Initialize client
		const storage = new SimpleFsStorageProvider(config.storagePath);
		this.client = new MatrixClient(config.homeserverUrl, config.accessToken, storage);

		// Setup auto-join for allowed rooms
		AutojoinRoomsMixin.setupOnClient(this.client);

		// Get bot user ID
		this.botUserId = await this.client.getUserId();
		this.logger.log(`Bot user ID: ${this.botUserId}`);

		// Setup room join handler
		this.client.on('room.join', async (roomId: string) => {
			await this.onRoomJoin(roomId);
		});

		// Setup message handler
		this.client.on('room.message', async (roomId: string, event: MatrixRoomEvent) => {
			await this.onRoomMessage(roomId, event);
		});

		// Start the client
		await this.client.start();
		this.logger.log('Matrix client started');
	}

	/**
	 * Graceful shutdown
	 */
	async onModuleDestroy(): Promise<void> {
		if (this.client) {
			await this.client.stop();
			this.logger.log('Matrix client stopped');
		}
	}

	/**
	 * Handle room join event
	 */
	protected async onRoomJoin(roomId: string): Promise<void> {
		this.logger.log(`Joined room: ${roomId}`);

		// Send introduction message if defined
		const intro = this.getIntroductionMessage();
		if (intro) {
			await this.sendMessage(roomId, intro);
		}
	}

	/**
	 * Handle incoming room message
	 */
	protected async onRoomMessage(roomId: string, event: MatrixRoomEvent): Promise<void> {
		// Ignore own messages
		if (event.sender === this.botUserId) return;

		// Check room permissions
		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		try {
			if (isTextMessage(event)) {
				const message = event.content.body.trim();
				await this.handleTextMessage(roomId, event, message, event.sender);
			} else if (isAudioMessage(event)) {
				await this.handleAudioMessage(roomId, event, event.sender);
			}
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendReply(roomId, event, '❌ Ein Fehler ist aufgetreten.');
		}
	}

	/**
	 * Send a message to a room
	 */
	protected async sendMessage(roomId: string, message: string): Promise<string> {
		return this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: message,
			format: 'org.matrix.custom.html',
			formatted_body: markdownToHtml(message),
		});
	}

	/**
	 * Send a reply to an event
	 */
	protected async sendReply(
		roomId: string,
		event: MatrixRoomEvent,
		message: string
	): Promise<string> {
		const reply = RichReply.createFor(roomId, event, message, markdownToHtml(message));
		reply.msgtype = 'm.text';
		return this.client.sendMessage(roomId, reply);
	}

	/**
	 * Send a notice (non-highlighted message)
	 */
	protected async sendNotice(roomId: string, message: string): Promise<string> {
		return this.client.sendMessage(roomId, {
			msgtype: 'm.notice',
			body: message,
			format: 'org.matrix.custom.html',
			formatted_body: markdownToHtml(message),
		});
	}

	/**
	 * Download media from Matrix
	 */
	protected async downloadMedia(mxcUrl: string): Promise<Buffer> {
		const result = await this.client.downloadContent(mxcUrl);
		return result.data;
	}

	/**
	 * Upload media to Matrix
	 */
	protected async uploadMedia(
		buffer: Buffer,
		contentType: string,
		filename: string
	): Promise<string> {
		return this.client.uploadContent(buffer, contentType, filename);
	}

	/**
	 * Get the Matrix client (for advanced operations)
	 */
	protected getClient(): MatrixClient {
		return this.client;
	}

	/**
	 * Check if a room is allowed
	 */
	protected isRoomAllowed(roomId: string): boolean {
		if (this.allowedRooms.length === 0) return true;
		return this.allowedRooms.includes(roomId);
	}
}
