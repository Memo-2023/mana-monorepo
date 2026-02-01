import { Injectable, Logger } from '@nestjs/common';
import { MatrixClient, RichReply } from 'matrix-bot-sdk';
import { markdownToHtml } from '../markdown/markdown-formatter';

/**
 * Message content for Matrix
 */
export interface MatrixMessageContent {
	msgtype: string;
	body: string;
	format?: string;
	formatted_body?: string;
	'm.relates_to'?: {
		'm.in_reply_to'?: { event_id: string };
		event_id?: string;
		rel_type?: string;
	};
}

/**
 * Options for sending messages
 */
export interface SendMessageOptions {
	/** Convert markdown to HTML (default: true) */
	markdown?: boolean;
	/** Message type (default: 'm.text') */
	msgtype?: string;
}

/**
 * Shared message service for Matrix bots
 *
 * Provides standardized methods for sending messages, replies, and reactions.
 *
 * @example
 * ```typescript
 * const messageService = new MatrixMessageService();
 *
 * // Send a simple message
 * await messageService.sendMessage(client, roomId, 'Hello!');
 *
 * // Send a reply to an event
 * await messageService.sendReply(client, roomId, event, 'Thanks!');
 *
 * // Send a reaction
 * await messageService.sendReaction(client, roomId, eventId, '👍');
 * ```
 */
@Injectable()
export class MatrixMessageService {
	private readonly logger = new Logger(MatrixMessageService.name);

	/**
	 * Send a message to a room
	 */
	async sendMessage(
		client: MatrixClient,
		roomId: string,
		message: string,
		options: SendMessageOptions = {}
	): Promise<string> {
		const { markdown = true, msgtype = 'm.text' } = options;

		const content: MatrixMessageContent = {
			msgtype,
			body: message,
		};

		if (markdown) {
			content.format = 'org.matrix.custom.html';
			content.formatted_body = markdownToHtml(message);
		}

		return client.sendMessage(roomId, content);
	}

	/**
	 * Send a reply to a specific event
	 */
	async sendReply(
		client: MatrixClient,
		roomId: string,
		event: { event_id: string; content?: { body?: string } },
		message: string,
		options: SendMessageOptions = {}
	): Promise<string> {
		const { markdown = true, msgtype = 'm.text' } = options;

		const htmlMessage = markdown ? markdownToHtml(message) : message;
		const reply = RichReply.createFor(roomId, event, message, htmlMessage);
		reply.msgtype = msgtype;

		return client.sendMessage(roomId, reply);
	}

	/**
	 * Send a reaction to an event
	 */
	async sendReaction(
		client: MatrixClient,
		roomId: string,
		eventId: string,
		emoji: string
	): Promise<string> {
		return client.sendEvent(roomId, 'm.reaction', {
			'm.relates_to': {
				rel_type: 'm.annotation',
				event_id: eventId,
				key: emoji,
			},
		});
	}

	/**
	 * Send a notice (non-highlighted message)
	 */
	async sendNotice(
		client: MatrixClient,
		roomId: string,
		message: string,
		options: Omit<SendMessageOptions, 'msgtype'> = {}
	): Promise<string> {
		return this.sendMessage(client, roomId, message, { ...options, msgtype: 'm.notice' });
	}

	/**
	 * Send an image to a room
	 */
	async sendImage(
		client: MatrixClient,
		roomId: string,
		mxcUrl: string,
		filename: string,
		info?: { w?: number; h?: number; mimetype?: string; size?: number }
	): Promise<string> {
		return client.sendMessage(roomId, {
			msgtype: 'm.image',
			body: filename,
			url: mxcUrl,
			info: info || {},
		});
	}

	/**
	 * Send a file to a room
	 */
	async sendFile(
		client: MatrixClient,
		roomId: string,
		mxcUrl: string,
		filename: string,
		info?: { mimetype?: string; size?: number }
	): Promise<string> {
		return client.sendMessage(roomId, {
			msgtype: 'm.file',
			body: filename,
			url: mxcUrl,
			info: info || {},
		});
	}

	/**
	 * Edit an existing message
	 */
	async editMessage(
		client: MatrixClient,
		roomId: string,
		originalEventId: string,
		newMessage: string,
		options: SendMessageOptions = {}
	): Promise<string> {
		const { markdown = true, msgtype = 'm.text' } = options;

		const content: MatrixMessageContent = {
			msgtype,
			body: `* ${newMessage}`,
			'm.relates_to': {
				rel_type: 'm.replace',
				event_id: originalEventId,
			},
		};

		if (markdown) {
			content.format = 'org.matrix.custom.html';
			content.formatted_body = `* ${markdownToHtml(newMessage)}`;
		}

		return client.sendMessage(roomId, {
			...content,
			'm.new_content': {
				msgtype,
				body: newMessage,
				format: markdown ? 'org.matrix.custom.html' : undefined,
				formatted_body: markdown ? markdownToHtml(newMessage) : undefined,
			},
		});
	}

	/**
	 * Set room topic
	 */
	async setRoomTopic(client: MatrixClient, roomId: string, topic: string): Promise<void> {
		await client.sendStateEvent(roomId, 'm.room.topic', '', { topic });
	}

	/**
	 * Pin a message in a room
	 */
	async pinMessage(client: MatrixClient, roomId: string, eventId: string): Promise<void> {
		try {
			// Get current pinned events
			const pinnedEvents = await client
				.getRoomStateEvent(roomId, 'm.room.pinned_events', '')
				.catch(() => ({ pinned: [] }));

			const pinned: string[] = pinnedEvents?.pinned || [];

			// Add new event if not already pinned
			if (!pinned.includes(eventId)) {
				pinned.push(eventId);
				await client.sendStateEvent(roomId, 'm.room.pinned_events', '', { pinned });
			}
		} catch (error) {
			this.logger.warn(`Failed to pin message: ${error}`);
		}
	}
}
