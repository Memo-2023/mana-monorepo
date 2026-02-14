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
import { InfrastructureService } from '../infrastructure/infrastructure.service';
import { TranscriptionService, SessionService, CreditService } from '@manacore/bot-services';

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
		{ keywords: ['system', 'server', 'macmini', 'mac'], command: 'system' },
		{ keywords: ['services', 'dienste', 'backends', 'health'], command: 'services' },
		{ keywords: ['traffic', 'requests', 'http', 'api'], command: 'traffic' },
		{ keywords: ['db', 'database', 'datenbank', 'postgres', 'redis'], command: 'db' },
		{ keywords: ['growth', 'wachstum', 'registrierungen'], command: 'growth' },
	]);

	constructor(
		configService: ConfigService,
		private analyticsService: AnalyticsService,
		private usersService: UsersService,
		private infrastructureService: InfrastructureService,
		private readonly transcriptionService: TranscriptionService,
		private sessionService: SessionService,
		private creditService: CreditService
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
		sender: string
	): Promise<void> {
		// Check for keyword commands first
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			message = `!${keywordCommand}`;
		}

		if (!message.startsWith('!')) return;

		const [command, ...args] = message.slice(1).split(' ');
		await this.handleCommand(roomId, command.toLowerCase(), sender, args.join(' '));
	}

	protected override async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		try {
			const mxcUrl = event.content.url;
			if (!mxcUrl) return;

			const audioBuffer = await this.downloadMedia(mxcUrl);
			const text = await this.transcriptionService.transcribe(audioBuffer);
			if (!text) {
				await this.sendReply(roomId, event, 'Sprachnachricht konnte nicht erkannt werden.');
				return;
			}

			await this.sendMessage(roomId, `*"${text}"*`);
			await this.handleTextMessage(roomId, event, text, sender);
		} catch (error) {
			this.logger.error(`Audio transcription error: ${error}`);
			await this.sendReply(roomId, event, 'Fehler bei der Spracherkennung.');
		}
	}

	private async handleCommand(roomId: string, command: string, sender: string, args: string) {
		switch (command) {
			case 'help':
			case 'start':
				await this.sendHelp(roomId);
				break;

			case 'status':
				await this.handleStatus(roomId, sender);
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

			case 'system':
				await this.sendSystem(roomId);
				break;

			case 'services':
				await this.sendServices(roomId);
				break;

			case 'traffic':
				await this.sendTraffic(roomId);
				break;

			case 'db':
				await this.sendDatabase(roomId);
				break;

			case 'growth':
				await this.sendGrowth(roomId);
				break;

			default:
				await this.sendMessage(roomId, `Unbekannter Befehl: !${command}\n\nVerwende !help`);
		}
	}

	private async sendHelp(roomId: string) {
		const helpText = `**📊 ManaCore Stats Bot**

**Analytics (Umami):**
- \`!stats\` - Übersicht aller Apps (30 Tage)
- \`!today\` - Heutige Statistiken
- \`!week\` - Wochenstatistiken
- \`!realtime\` - Aktive Besucher jetzt

**Infrastruktur (Prometheus):**
- \`!system\` - Mac Mini Status (CPU, RAM, Disk)
- \`!services\` - Backend Service Status
- \`!traffic\` - HTTP Traffic & Latenz
- \`!db\` - Datenbank Status
- \`!growth\` - User Wachstum

**Account:**
- \`!status\` - Account Status
- \`!help\` - Diese Hilfe`;

		await this.sendMessage(roomId, helpText);
	}

	private async sendStats(roomId: string) {
		await this.sendMessage(roomId, '📊 Lade Statistiken...');
		try {
			const report = await this.analyticsService.generateStatsOverview();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate stats overview:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler beim Laden der Statistiken: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendToday(roomId: string) {
		await this.sendMessage(roomId, '📊 Lade heutige Statistiken...');
		try {
			const report = await this.analyticsService.generateDailyReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate daily report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler beim Laden: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendWeek(roomId: string) {
		await this.sendMessage(roomId, '📊 Lade Wochenstatistiken...');
		try {
			const report = await this.analyticsService.generateWeeklyReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate weekly report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler beim Laden: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendRealtime(roomId: string) {
		try {
			const report = await this.analyticsService.generateRealtimeReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate realtime report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler beim Laden: ${error instanceof Error ? error.message : String(error)}`
			);
		}
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

	private async sendSystem(roomId: string) {
		try {
			const report = await this.infrastructureService.generateSystemReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate system report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendServices(roomId: string) {
		try {
			const report = await this.infrastructureService.generateServicesReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate services report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendTraffic(roomId: string) {
		try {
			const report = await this.infrastructureService.generateTrafficReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate traffic report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendDatabase(roomId: string) {
		try {
			const report = await this.infrastructureService.generateDatabaseReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate database report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async sendGrowth(roomId: string) {
		try {
			const report = await this.infrastructureService.generateGrowthReport();
			await this.sendMessage(roomId, report);
		} catch (error) {
			this.logger.error('Failed to generate growth report:', error);
			await this.sendMessage(
				roomId,
				`❌ Fehler: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	private async handleStatus(roomId: string, sender: string) {
		const loggedIn = await this.sessionService.isLoggedIn(sender);
		const session = await this.sessionService.getSession(sender);
		const token = await this.sessionService.getToken(sender);

		let response = '**📊 Stats Bot Status**\n\n';

		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			response += `👤 Angemeldet als: ${session.email}\n`;
			response += `⚡ Credits: ${balance.balance.toFixed(2)}\n`;
		} else {
			response += `❌ Nicht angemeldet\n`;
			response += `Nutze \`!login email passwort\` zum Anmelden.`;
		}

		await this.sendMessage(roomId, response);
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
