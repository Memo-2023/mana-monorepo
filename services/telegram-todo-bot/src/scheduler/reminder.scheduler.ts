import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { TodoClientService } from '../todo-client/todo-client.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ReminderScheduler {
	private readonly logger = new Logger(ReminderScheduler.name);

	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly todoClient: TodoClientService,
		private readonly userService: UserService
	) {}

	// Run every day at 8:00 AM Europe/Berlin
	@Cron('0 8 * * *', {
		timeZone: 'Europe/Berlin',
	})
	async sendDailyReminders() {
		this.logger.log('Starting daily reminder distribution...');

		try {
			const users = await this.userService.getUsersWithDailyReminderEnabled();
			this.logger.log(`Found ${users.length} users with daily reminder enabled`);

			let sent = 0;
			let failed = 0;

			for (const user of users) {
				// Skip users without linked account
				if (!user.accessToken) {
					this.logger.debug(`Skipping user ${user.telegramUserId}: no linked account`);
					continue;
				}

				try {
					// Get today's tasks
					const tasks = await this.todoClient.getTodayTasks(user.accessToken);

					let message: string;
					if (tasks.length === 0) {
						message = `<b>Guten Morgen!</b>\n\nDu hast keine Aufgaben fuer heute. Genieße den Tag!\n\nMit /add kannst du neue Aufgaben erstellen.`;
					} else {
						message = `<b>Guten Morgen!</b>\n\n<b>Deine Aufgaben fuer heute (${tasks.length}):</b>\n\n`;

						tasks.slice(0, 10).forEach((task, i) => {
							const priority = this.formatPriority(task.priority);
							const overdue = this.isOverdue(task.dueDate) ? ' (ueberfaellig)' : '';
							message += `${i + 1}.  ${task.title}${priority}${overdue}\n`;
						});

						if (tasks.length > 10) {
							message += `\n... und ${tasks.length - 10} weitere\n`;
						}

						message += '\nAbhaken mit /done [Nr]';
					}

					await this.bot.telegram.sendMessage(user.telegramUserId, message, {
						parse_mode: 'HTML',
					});

					sent++;
					this.logger.debug(`Sent daily reminder to user ${user.telegramUserId}`);
				} catch (error) {
					failed++;
					this.logger.warn(
						`Failed to send daily reminder to user ${user.telegramUserId}: ${error}`
					);

					// If user blocked the bot, disable reminder
					if ((error as { response?: { error_code?: number } }).response?.error_code === 403) {
						this.logger.log(`User ${user.telegramUserId} blocked bot, disabling daily reminder`);
						await this.userService.toggleDailyReminder(user.telegramUserId);
					}
				}
			}

			this.logger.log(`Daily reminder distribution complete: ${sent} sent, ${failed} failed`);
		} catch (error) {
			this.logger.error('Daily reminder distribution failed:', error);
		}
	}

	private formatPriority(priority: string): string {
		switch (priority) {
			case 'urgent':
				return ' !!!';
			case 'high':
				return ' !!';
			default:
				return '';
		}
	}

	private isOverdue(dueDate: string | null): boolean {
		if (!dueDate) return false;

		const date = new Date(dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return date < today;
	}
}
