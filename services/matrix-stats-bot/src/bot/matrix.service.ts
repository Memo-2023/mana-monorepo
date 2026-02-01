import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { AnalyticsService } from '../analytics/analytics.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatrixService extends BaseMatrixService {
	private reportRoomId: string = '';

	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['stats', 'statistik', 'statistiken', 'uebersicht'], command: 'stats' },
		{ keywords: ['heute', 'today', 'tagesstatistik'], command: 'today' },
		{ keywords: ['woche', 'week', 'wochenstatistik'], command: 'week' },
		{ keywords: ['realtime', 'live', 'aktive', 'jetzt'], command: 'realtime' },
		{ keywords: ['users', 'benutzer', 'nutzer', 'registrierte'], command: 'users' },
	]);

	constructor(
		configService: ConfigService,
		private analyticsService: AnalyticsService,
		private usersService: UsersService
	) {
		super(configService);
		this.reportRoomId = this.configService.get<string>('matrix.reportRoomId') || '';
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get<string>('matrix.homeserverUrl') || '',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: [], // No room restrictions
		};
	}

	protected async handleTextMessage(
		roomId: string,
		_event: MatrixRoomEvent,
		message: string,
		_sender: string
	): Promise<void> {
		// Check for keyword commands first
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			message = `!${keywordCommand}`;
		}

		if (!message.startsWith('!')) return;

		const [command] = message.slice(1).split(' ');
		await this.handleCommand(roomId, command.toLowerCase());
	}

	private async handleCommand(roomId: string, command: string) {
		switch (command) {
			case 'help':
			case 'start':
				await this.sendHelp(roomId);
				break;

			case 'stats':
				await this.sendStats(roomId);
				break;

			case 'today':
				await this.sendToday(roomId);
				break;

			case 'week':
				await this.sendWeek(roomId);
				break;

			case 'realtime':
				await this.sendRealtime(roomId);
				break;

			case 'users':
				await this.sendUsers(roomId);
				break;

			default:
				await this.sendMessage(roomId, `Unbekannter Befehl: !${command}\n\nVerwende !help`);
		}
	}

	private async sendHelp(roomId: string) {
		const helpText = `**📊 ManaCore Stats Bot (DSGVO-konform)**

**Befehle:**
- \`!stats\` - Übersicht aller Apps (30 Tage)
- \`!today\` - Heutige Statistiken
- \`!week\` - Wochenstatistiken
- \`!realtime\` - Aktive Besucher jetzt
- \`!users\` - Registrierte Benutzer
- \`!help\` - Diese Hilfe

Daten von Umami Analytics (self-hosted).`;

		await this.sendMessage(roomId, helpText);
	}

	private async sendStats(roomId: string) {
		await this.sendMessage(roomId, '📊 Lade Statistiken...');
		const report = await this.analyticsService.generateStatsOverview();
		await this.sendMessage(roomId, report);
	}

	private async sendToday(roomId: string) {
		await this.sendMessage(roomId, '📊 Lade heutige Statistiken...');
		const report = await this.analyticsService.generateDailyReport();
		await this.sendMessage(roomId, report);
	}

	private async sendWeek(roomId: string) {
		await this.sendMessage(roomId, '📊 Lade Wochenstatistiken...');
		const report = await this.analyticsService.generateWeeklyReport();
		await this.sendMessage(roomId, report);
	}

	private async sendRealtime(roomId: string) {
		const report = await this.analyticsService.generateRealtimeReport();
		await this.sendMessage(roomId, report);
	}

	private async sendUsers(roomId: string) {
		const stats = await this.usersService.getUserStats();

		if (!stats) {
			await this.sendMessage(roomId, '❌ Datenbank nicht verfügbar.');
			return;
		}

		const report = `**👥 Benutzer-Statistiken**

**Gesamt:** ${stats.total} Benutzer
**Verifiziert:** ${stats.verified} (${((stats.verified / stats.total) * 100).toFixed(1)}%)

**Neue Benutzer:**
- Letzte 7 Tage: ${stats.lastWeek}
- Letzte 30 Tage: ${stats.lastMonth}`;

		await this.sendMessage(roomId, report);
	}

	// Public method for scheduled reports
	async sendScheduledReport(report: string) {
		if (!this.reportRoomId) {
			this.logger.warn('No report room configured');
			return;
		}

		await this.sendMessage(this.reportRoomId, report);
	}
}
