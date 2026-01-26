import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { AnalyticsService } from '../analytics/analytics.service';
import { UsersService } from '../users/users.service';
import { formatHelpMessage, formatUsersReport } from '../analytics/formatters';

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);

	constructor(
		private readonly analyticsService: AnalyticsService,
		private readonly usersService: UsersService
	) {}

	@Start()
	async start(@Ctx() ctx: Context) {
		this.logger.log(`/start command from ${ctx.from?.id}`);
		await ctx.replyWithHTML(formatHelpMessage());
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		this.logger.log(`/help command from ${ctx.from?.id}`);
		await ctx.replyWithHTML(formatHelpMessage());
	}

	@Command('stats')
	async stats(@Ctx() ctx: Context) {
		this.logger.log(`/stats command from ${ctx.from?.id}`);
		await ctx.reply('📊 Lade Statistiken...');

		const report = await this.analyticsService.generateStatsOverview();
		await ctx.replyWithHTML(report);
	}

	@Command('today')
	async today(@Ctx() ctx: Context) {
		this.logger.log(`/today command from ${ctx.from?.id}`);
		await ctx.reply('📊 Lade heutige Statistiken...');

		const report = await this.analyticsService.generateDailyReport();
		await ctx.replyWithHTML(report);
	}

	@Command('week')
	async week(@Ctx() ctx: Context) {
		this.logger.log(`/week command from ${ctx.from?.id}`);
		await ctx.reply('📊 Lade Wochenstatistiken...');

		const report = await this.analyticsService.generateWeeklyReport();
		await ctx.replyWithHTML(report);
	}

	@Command('realtime')
	async realtime(@Ctx() ctx: Context) {
		this.logger.log(`/realtime command from ${ctx.from?.id}`);
		await ctx.reply('🔴 Lade Realtime-Daten...');

		const report = await this.analyticsService.generateRealtimeReport();
		await ctx.replyWithHTML(report);
	}

	@Command('users')
	async users(@Ctx() ctx: Context) {
		this.logger.log(`/users command from ${ctx.from?.id}`);
		await ctx.reply('👥 Lade User-Statistiken...');

		try {
			const stats = await this.usersService.getUserStats();
			if (!stats) {
				this.logger.warn('User stats returned null - database may not be configured');
				await ctx.reply('❌ Datenbank nicht verfügbar. Prüfe DATABASE_URL Konfiguration.');
				return;
			}

			const report = formatUsersReport(stats);
			await ctx.replyWithHTML(report);
		} catch (error) {
			this.logger.error('Failed to get user stats:', error);
			await ctx.reply(
				`❌ Fehler beim Laden der User-Statistiken: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
			);
		}
	}
}
