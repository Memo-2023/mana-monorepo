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
	]);

	constructor(
		configService: ConfigService,
		private analyticsService: AnalyticsService,
		private usersService: UsersService,
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

			case 'login':
				await this.handleLogin(roomId, sender, args);
				break;

			case 'logout':
				await this.handleLogout(roomId, sender);
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

			default:
				await this.sendMessage(roomId, `Unbekannter Befehl: !${command}\n\nVerwende !help`);
		}
	}

	private async sendHelp(roomId: string) {
		const helpText = `**📊 ManaCore Stats Bot (DSGVO-konform)**

**Account:**
- \`!login email passwort\` - Anmelden
- \`!logout\` - Abmelden
- \`!status\` - Account Status

**Statistiken:**
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

	private async handleLogin(roomId: string, sender: string, args: string) {
		const parts = args.split(' ');
		if (parts.length < 2 || !parts[0] || !parts[1]) {
			await this.sendMessage(roomId, 'Verwendung: `!login email passwort`');
			return;
		}
		const [email, password] = parts;
		const result = await this.sessionService.login(sender, email, password);

		if (result.success) {
			const token = await this.sessionService.getToken(sender);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				await this.sendMessage(
					roomId,
					`✅ Erfolgreich angemeldet als **${email}**\n⚡ Credits: ${balance.balance.toFixed(2)}`
				);
			} else {
				await this.sendMessage(roomId, `✅ Erfolgreich angemeldet als **${email}**`);
			}
		} else {
			await this.sendMessage(roomId, `❌ Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleLogout(roomId: string, sender: string) {
		await this.sessionService.logout(sender);
		await this.sendMessage(roomId, '👋 Erfolgreich abgemeldet.');
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
