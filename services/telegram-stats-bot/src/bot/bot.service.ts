import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class BotService {
	private readonly logger = new Logger(BotService.name);
	private readonly chatId: string;

	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly configService: ConfigService
	) {
		this.chatId = this.configService.get<string>('telegram.chatId') || '';
	}

	async sendMessage(message: string, chatId?: string): Promise<void> {
		const targetChatId = chatId || this.chatId;

		if (!targetChatId) {
			this.logger.warn('No chat ID configured, skipping message');
			return;
		}

		try {
			await this.bot.telegram.sendMessage(targetChatId, message, {
				parse_mode: 'HTML',
			});
			this.logger.log(`Message sent to chat ${targetChatId}`);
		} catch (error) {
			this.logger.error(`Failed to send message: ${error}`);
			throw error;
		}
	}

	async sendReport(report: string): Promise<void> {
		return this.sendMessage(report);
	}
}
