import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichConsoleLogger,
	LogService,
	LogLevel,
} from 'matrix-bot-sdk';
import { AnalyticsService } from '../analytics/analytics.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client!: MatrixClient;
	private botUserId: string = '';
	private reportRoomId: string = '';

	constructor(
		private configService: ConfigService,
		private analyticsService: AnalyticsService,
		private usersService: UsersService
	) {
		this.reportRoomId = this.configService.get<string>('matrix.reportRoomId') || '';
	}

	async onModuleInit() {
		const homeserverUrl = this.configService.get<string>('matrix.homeserverUrl');
		const accessToken = this.configService.get<string>('matrix.accessToken');
		const storagePath = this.configService.get<string>('matrix.storagePath');

		if (!accessToken) {
			this.logger.error('MATRIX_ACCESS_TOKEN is required');
			return;
		}

		LogService.setLogger(new RichConsoleLogger());
		LogService.setLevel(LogLevel.INFO);

		const storage = new SimpleFsStorageProvider(storagePath || './data/bot-storage.json');
		this.client = new MatrixClient(homeserverUrl!, accessToken, storage);

		AutojoinRoomsMixin.setupOnClient(this.client);

		this.botUserId = await this.client.getUserId();
		this.logger.log(`Bot user ID: ${this.botUserId}`);

		this.client.on('room.message', this.handleRoomMessage.bind(this));

		await this.client.start();
		this.logger.log('Matrix Stats Bot started successfully');
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.stop();
			this.logger.log('Matrix Stats Bot stopped');
		}
	}

	private async handleRoomMessage(roomId: string, event: any) {
		if (event.sender === this.botUserId) return;

		const content = event.content as { msgtype?: string; body?: string };
		if (content.msgtype !== 'm.text') return;

		const body = content.body;
		if (!body || !body.startsWith('!')) return;

		const [command] = body.slice(1).split(' ');
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

	private async sendMessage(roomId: string, message: string) {
		const htmlBody = this.markdownToHtml(message);

		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: message,
			format: 'org.matrix.custom.html',
			formatted_body: htmlBody,
		});
	}

	private markdownToHtml(markdown: string): string {
		return markdown
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/\*([^*]+)\*/g, '<em>$1</em>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\n/g, '<br/>');
	}
}
