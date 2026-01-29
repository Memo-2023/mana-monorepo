import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MatrixMessage {
	roomId: string;
	body: string;
	formattedBody?: string; // HTML formatted
	msgtype?: 'text' | 'notice';
}

export interface MatrixResult {
	success: boolean;
	eventId?: string;
	error?: string;
}

@Injectable()
export class MatrixService {
	private readonly logger = new Logger(MatrixService.name);
	private readonly homeserverUrl: string | null;
	private readonly accessToken: string | null;

	constructor(private readonly configService: ConfigService) {
		this.homeserverUrl = this.configService.get<string>('matrix.homeserverUrl') || null;
		this.accessToken = this.configService.get<string>('matrix.accessToken') || null;

		if (this.isConfigured()) {
			this.logger.log(`Matrix service initialized with homeserver: ${this.homeserverUrl}`);
		} else {
			this.logger.warn('Matrix service not configured');
		}
	}

	isConfigured(): boolean {
		return !!(this.homeserverUrl && this.accessToken);
	}

	async sendMessage(message: MatrixMessage): Promise<MatrixResult> {
		if (!this.isConfigured()) {
			return { success: false, error: 'Matrix not configured' };
		}

		const { roomId, body, formattedBody, msgtype = 'text' } = message;
		const txnId = `mana_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		const endpoint = `${this.homeserverUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`;

		const content: Record<string, string> = {
			msgtype: `m.${msgtype}`,
			body,
		};

		if (formattedBody) {
			content.format = 'org.matrix.custom.html';
			content.formatted_body = formattedBody;
		}

		try {
			const response = await fetch(endpoint, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(content),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage = (errorData as { error?: string }).error || response.statusText;
				this.logger.error(`Matrix API error: ${response.status} - ${errorMessage}`);
				return { success: false, error: errorMessage };
			}

			const data = (await response.json()) as { event_id?: string };
			this.logger.debug(`Matrix message sent to ${roomId}, eventId: ${data.event_id}`);

			return { success: true, eventId: data.event_id };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Failed to send Matrix message: ${errorMessage}`);
			return { success: false, error: errorMessage };
		}
	}
}
