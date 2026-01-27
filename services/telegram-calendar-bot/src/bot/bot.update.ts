import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, On, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { CalendarClient } from '../calendar/calendar.client';
import { UserService } from '../user/user.service';
import {
	formatHelpMessage,
	formatTodayEvents,
	formatTomorrowEvents,
	formatWeekEvents,
	formatNextEvents,
	formatCalendars,
	formatStatusMessage,
} from './formatters';

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);
	private readonly allowedUsers: number[];

	constructor(
		private readonly configService: ConfigService,
		private readonly calendarClient: CalendarClient,
		private readonly userService: UserService
	) {
		this.allowedUsers = this.configService.get<number[]>('telegram.allowedUsers') || [];
	}

	/**
	 * Check if user is allowed (if restriction is enabled)
	 */
	private isAllowed(userId: number): boolean {
		if (this.allowedUsers.length === 0) return true;
		return this.allowedUsers.includes(userId);
	}

	/**
	 * Get user's access token
	 */
	private async getAccessToken(telegramUserId: number): Promise<string | null> {
		const user = await this.userService.getUserByTelegramId(telegramUserId);
		if (!user || !user.isActive || !user.accessToken) {
			return null;
		}
		return user.accessToken;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/start from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			await ctx.reply('❌ Du bist nicht berechtigt, diesen Bot zu nutzen.');
			return;
		}

		await ctx.replyWithHTML(formatHelpMessage());
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/help from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		await ctx.replyWithHTML(formatHelpMessage());
	}

	@Command('today')
	async today(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/today from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('📅 Lade heutige Termine...');
		await this.userService.updateLastActive(userId);

		const events = await this.calendarClient.getTodayEvents(accessToken);
		await ctx.replyWithHTML(formatTodayEvents(events));
	}

	@Command('tomorrow')
	async tomorrow(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/tomorrow from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('📅 Lade morgige Termine...');
		await this.userService.updateLastActive(userId);

		const events = await this.calendarClient.getTomorrowEvents(accessToken);
		await ctx.replyWithHTML(formatTomorrowEvents(events));
	}

	@Command('week')
	async week(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/week from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await ctx.reply('📅 Lade Wochenübersicht...');
		await this.userService.updateLastActive(userId);

		const events = await this.calendarClient.getWeekEvents(accessToken);
		await ctx.replyWithHTML(formatWeekEvents(events));
	}

	@Command('next')
	async next(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/next from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		// Parse count from command
		const parts = text.split(' ');
		const count = parts.length > 1 ? parseInt(parts[1], 10) || 5 : 5;
		const limitedCount = Math.min(Math.max(count, 1), 20);

		await ctx.reply(`📅 Lade nächste ${limitedCount} Termine...`);
		await this.userService.updateLastActive(userId);

		const events = await this.calendarClient.getNextEvents(accessToken, limitedCount);
		await ctx.replyWithHTML(formatNextEvents(events, limitedCount));
	}

	@Command('calendars')
	async calendars(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/calendars from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		await this.userService.updateLastActive(userId);

		const calendars = await this.calendarClient.getCalendars(accessToken);
		await ctx.replyWithHTML(formatCalendars(calendars));
	}

	@Command('add')
	async add(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		this.logger.log(`/add from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		// Remove /add command from text
		const input = text.replace(/^\/add\s*/i, '').trim();

		if (!input) {
			await ctx.replyWithHTML(`📝 <b>Termin erstellen</b>

Beispiele:
• /add Meeting morgen um 14 Uhr
• /add Arzt | 20.01.2025 10:00 | 1h
• /add Geburtstag Lisa | 15.03.2025 | ganztägig

Format: /add [Titel] | [Datum Zeit] | [Dauer]`);
			return;
		}

		// TODO: Implement NLP parsing
		await ctx.reply(
			`⚠️ Natürliche Spracheingabe wird noch implementiert.\n\nEmpfangener Text: "${input}"`
		);
	}

	@Command('remind')
	async remind(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/remind from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const user = await this.userService.getUserByTelegramId(userId);
		if (!user) {
			await ctx.reply('❌ Bitte verknüpfe zuerst deinen Account mit /link');
			return;
		}

		const settings = await this.userService.getReminderSettings(userId);

		await ctx.replyWithHTML(`⚙️ <b>Erinnerungseinstellungen</b>

📢 Standard-Erinnerung: ${settings?.defaultReminderMinutes || 15} Minuten vorher
🌅 Morgen-Briefing: ${settings?.morningBriefingEnabled ? `Aktiv (${settings.morningBriefingTime})` : 'Deaktiviert'}
🌍 Zeitzone: ${settings?.timezone || 'Europe/Berlin'}

<i>Einstellungen können in der Web-App geändert werden.</i>`);
	}

	@Command('status')
	async status(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/status from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const user = await this.userService.getUserByTelegramId(userId);

		await ctx.replyWithHTML(
			formatStatusMessage(
				!!user?.isActive && !!user?.accessToken,
				user?.telegramUsername || user?.telegramFirstName,
				user?.lastActiveAt || undefined
			)
		);
	}

	@Command('link')
	async link(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/link from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		// TODO: Implement proper OAuth flow or token-based linking
		await ctx.replyWithHTML(`🔗 <b>Account verknüpfen</b>

Um deinen ManaCore Account zu verknüpfen:

1. Öffne die Calendar Web-App
2. Gehe zu <b>Einstellungen → Integrationen → Telegram</b>
3. Klicke auf "Mit Telegram verknüpfen"
4. Gib deine Telegram User-ID ein: <code>${userId}</code>

Nach der Verknüpfung kannst du alle Bot-Funktionen nutzen.`);
	}

	@Command('unlink')
	async unlink(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		this.logger.log(`/unlink from user ${userId}`);

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		const success = await this.userService.unlinkUser(userId);

		if (success) {
			await ctx.reply('✅ Account-Verknüpfung wurde aufgehoben.');
		} else {
			await ctx.reply('❌ Fehler beim Aufheben der Verknüpfung.');
		}
	}

	@On('text')
	async onText(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;

		// Ignore commands
		if (text.startsWith('/')) return;

		if (!userId || !this.isAllowed(userId)) {
			return;
		}

		// Check if user is linked
		const accessToken = await this.getAccessToken(userId);
		if (!accessToken) {
			// Don't respond to random text from unlinked users
			return;
		}

		// TODO: Implement NLP for natural language event creation
		// For now, just acknowledge
		this.logger.log(`Text message from ${userId}: ${text.substring(0, 50)}...`);
	}
}
