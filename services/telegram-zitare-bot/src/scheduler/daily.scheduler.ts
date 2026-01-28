import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { QuotesService } from '../quotes/quotes.service';
import { UserService } from '../user/user.service';

@Injectable()
export class DailyScheduler {
	private readonly logger = new Logger(DailyScheduler.name);

	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly quotesService: QuotesService,
		private readonly userService: UserService
	) {}

	// Run every day at 8:00 AM Europe/Berlin
	@Cron('0 8 * * *', {
		timeZone: 'Europe/Berlin',
	})
	async sendDailyQuotes() {
		this.logger.log('Starting daily quote distribution...');

		try {
			const users = await this.userService.getUsersWithDailyEnabled();
			this.logger.log(`Found ${users.length} users with daily enabled`);

			let sent = 0;
			let failed = 0;

			for (const user of users) {
				try {
					const quote = this.quotesService.getRandomQuote();
					const message =
						`☀️ <b>Dein tägliches Zitat:</b>\n\n` + this.quotesService.formatQuote(quote);

					await this.bot.telegram.sendMessage(user.telegramUserId, message, {
						parse_mode: 'HTML',
					});

					sent++;
					this.logger.debug(`Sent daily quote to user ${user.telegramUserId}`);
				} catch (error) {
					failed++;
					this.logger.warn(`Failed to send daily quote to user ${user.telegramUserId}: ${error}`);

					// If user blocked the bot, disable daily
					if ((error as { response?: { error_code?: number } }).response?.error_code === 403) {
						this.logger.log(`User ${user.telegramUserId} blocked bot, disabling daily`);
						await this.userService.toggleDaily(user.telegramUserId);
					}
				}
			}

			this.logger.log(`Daily quote distribution complete: ${sent} sent, ${failed} failed`);
		} catch (error) {
			this.logger.error('Daily quote distribution failed:', error);
		}
	}
}
