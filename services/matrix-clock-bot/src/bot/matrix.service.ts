import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { ClockService } from '../clock/clock.service';
import { TranscriptionService, SessionService, CreditService } from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT } from '../config/configuration';

@Injectable()
export class MatrixService extends BaseMatrixService {
	// Demo token for development (TODO: implement proper auth)
	private readonly demoToken = process.env.CLOCK_API_TOKEN || '';

	// Note: We override COMMON_KEYWORDS' cancel->cancel with stop->stop for this bot
	private readonly keywordDetector = new KeywordCommandDetector([
		{ keywords: ['hilfe', 'help', 'befehle', 'commands'], command: 'help' },
		{ keywords: ['status', 'timer status', 'laufend'], command: 'status' },
		{ keywords: ['stop', 'stopp', 'pause', 'anhalten'], command: 'stop' },
		{ keywords: ['weiter', 'resume', 'fortsetzen'], command: 'resume' },
		{ keywords: ['zeit', 'time', 'uhrzeit', 'wie spat'], command: 'time' },
	]);

	constructor(
		configService: ConfigService,
		private clockService: ClockService,
		private transcriptionService: TranscriptionService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl:
				this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath:
				this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string | null {
		return WELCOME_TEXT;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		message: string,
		sender: string
	): Promise<void> {
		// Check keywords first
		const keywordCommand = this.keywordDetector.detect(message);
		if (keywordCommand) {
			await this.executeCommand(roomId, event, sender, keywordCommand, '');
			return;
		}

		// Handle ! commands
		if (message.startsWith('!')) {
			const [command, ...args] = message.slice(1).split(' ');
			await this.executeCommand(roomId, event, sender, command.toLowerCase(), args.join(' '));
			return;
		}

		// Try to parse as natural timer/alarm command
		await this.handleNaturalLanguage(roomId, event, sender, message);
	}

	protected async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		try {
			await this.sendReply(roomId, event, 'Verarbeite Sprachnotiz...');

			const mxcUrl = event.content.url;
			if (!mxcUrl) {
				await this.sendReply(roomId, event, 'Keine Audio-URL gefunden.');
				return;
			}

			const buffer = await this.downloadMedia(mxcUrl);
			const transcription = await this.transcriptionService.transcribe(buffer);

			if (!transcription.trim()) {
				await this.sendReply(roomId, event, 'Konnte keine Sprache erkennen.');
				return;
			}

			this.logger.log(`Transcription: ${transcription}`);

			// Try to parse as command
			const lower = transcription.toLowerCase();

			// Check for timer
			const duration = this.clockService.parseDuration(transcription);
			if (
				duration &&
				(lower.includes('timer') ||
					lower.includes('minute') ||
					lower.includes('stunde') ||
					lower.match(/\d+\s*(m|min|h)/))
			) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleTimerCommand(roomId, event, sender, transcription);
				return;
			}

			// Check for alarm
			const time = this.clockService.parseAlarmTime(transcription);
			if (time && (lower.includes('wecker') || lower.includes('alarm') || lower.includes('uhr'))) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleAlarmCommand(roomId, event, sender, transcription);
				return;
			}

			// Check for stop/status commands
			if (lower.includes('stop') || lower.includes('stopp') || lower.includes('pause')) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleStopCommand(roomId, event, sender);
				return;
			}

			if (lower.includes('status') || lower.includes('wie viel')) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleStatusCommand(roomId, event, sender);
				return;
			}

			await this.sendReply(
				roomId,
				event,
				`"${transcription}"\n\nKonnte Befehl nicht verstehen. Versuche "Timer 25 Minuten" oder "Wecker 7 Uhr".`
			);
		} catch (error) {
			this.logger.error('Audio processing failed:', error);
			await this.sendReply(roomId, event, 'Fehler bei der Sprachverarbeitung.');
		}
	}

	private async executeCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		command: string,
		args: string
	) {
		switch (command) {
			case 'help':
			case 'hilfe':
				await this.sendReply(roomId, event, HELP_TEXT);
				break;

			case 'login':
				await this.handleLogin(roomId, event, userId, args);
				break;

			case 'logout':
				await this.handleLogout(roomId, event, userId);
				break;

			case 'timer':
				await this.handleTimerCommand(roomId, event, userId, args);
				break;

			case 'stop':
			case 'stopp':
			case 'pause':
				await this.handleStopCommand(roomId, event, userId);
				break;

			case 'resume':
			case 'weiter':
				await this.handleResumeCommand(roomId, event, userId);
				break;

			case 'reset':
				await this.handleResetCommand(roomId, event, userId);
				break;

			case 'status':
				await this.handleStatusCommand(roomId, event, userId);
				break;

			case 'timers':
				await this.handleTimersCommand(roomId, event, userId);
				break;

			case 'alarm':
			case 'wecker':
				await this.handleAlarmCommand(roomId, event, userId, args);
				break;

			case 'alarms':
			case 'alarme':
				await this.handleAlarmsCommand(roomId, event, userId);
				break;

			case 'zeit':
			case 'time':
				await this.handleTimeCommand(roomId, event, userId);
				break;

			case 'weltuhr':
				await this.handleWorldClockCommand(roomId, event, userId, args);
				break;

			case 'weltuhren':
				await this.handleWorldClocksCommand(roomId, event, userId);
				break;

			default:
				// Silently ignore unknown commands
				break;
		}
	}

	private async handleTimerCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		if (!args.trim()) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!timer 25m` oder `!timer 1h30m`\n\nBeispiele:\n- `!timer 25` (25 Minuten)\n- `!timer 1h` (1 Stunde)\n- `!timer 90m Pomodoro` (90 Min mit Label)'
			);
			return;
		}

		const durationSeconds = this.clockService.parseDuration(args);
		if (!durationSeconds) {
			await this.sendReply(roomId, event, 'Konnte Zeit nicht verstehen. Beispiel: `!timer 25m`');
			return;
		}

		// Extract label if present (everything after the duration)
		const label = args.replace(/[\d\s]*[hms]+/gi, '').trim() || null;

		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung. Bitte zuerst `!login`.');
				return;
			}

			// Create and start timer
			const timer = await this.clockService.createTimer(durationSeconds, label, token);
			await this.clockService.startTimer(timer.id, token);

			const durationStr = this.clockService.formatDuration(durationSeconds);
			let response = `**Timer gestartet!**\n\nDauer: ${durationStr}`;
			if (label) response += `\nLabel: ${label}`;
			response += '\n\n`!stop` zum Pausieren, `!status` fur Status';

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Timer creation failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Erstellen des Timers.');
		}
	}

	private async handleStopCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const runningTimer = await this.clockService.getRunningTimer(token);
			if (!runningTimer) {
				await this.sendReply(roomId, event, 'Kein laufender Timer.');
				return;
			}

			if (runningTimer.status === 'paused') {
				await this.sendReply(
					roomId,
					event,
					'Timer ist bereits pausiert. `!resume` zum Fortsetzen.'
				);
				return;
			}

			const timer = await this.clockService.pauseTimer(runningTimer.id, token);
			const remaining = this.clockService.formatDuration(timer.remainingSeconds);

			await this.sendReply(
				roomId,
				event,
				`**Timer pausiert**\n\nVerbleibend: ${remaining}\n\n\`!resume\` zum Fortsetzen, \`!reset\` zum Zurucksetzen`
			);
		} catch (error) {
			this.logger.error('Stop failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Pausieren.');
		}
	}

	private async handleResumeCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const pausedTimer = await this.clockService.getRunningTimer(token);
			if (!pausedTimer || pausedTimer.status !== 'paused') {
				await this.sendReply(roomId, event, 'Kein pausierter Timer.');
				return;
			}

			const timer = await this.clockService.startTimer(pausedTimer.id, token);
			const remaining = this.clockService.formatDuration(timer.remainingSeconds);

			await this.sendReply(roomId, event, `**Timer fortgesetzt**\n\nVerbleibend: ${remaining}`);
		} catch (error) {
			this.logger.error('Resume failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Fortsetzen.');
		}
	}

	private async handleResetCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const activeTimer = await this.clockService.getRunningTimer(token);
			if (!activeTimer) {
				await this.sendReply(roomId, event, 'Kein aktiver Timer.');
				return;
			}

			await this.clockService.resetTimer(activeTimer.id, token);
			await this.sendReply(roomId, event, 'Timer zuruckgesetzt.');
		} catch (error) {
			this.logger.error('Reset failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Zurucksetzen.');
		}
	}

	private async handleLogin(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const parts = args.split(' ');
		if (parts.length < 2 || !parts[0] || !parts[1]) {
			await this.sendReply(roomId, event, 'Verwendung: `!login email passwort`');
			return;
		}
		const [email, password] = parts;
		const result = await this.sessionService.login(userId, email, password);

		if (result.success) {
			const token = await this.sessionService.getToken(userId);
			if (token) {
				const balance = await this.creditService.getBalance(token);
				await this.sendReply(
					roomId,
					event,
					`✅ Erfolgreich angemeldet als **${email}**\n⚡ Credits: ${balance.balance.toFixed(2)}`
				);
			} else {
				await this.sendReply(roomId, event, `✅ Erfolgreich angemeldet als **${email}**`);
			}
		} else {
			await this.sendReply(roomId, event, `❌ Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleLogout(roomId: string, event: MatrixRoomEvent, userId: string) {
		await this.sessionService.logout(userId);
		await this.sendReply(roomId, event, '👋 Erfolgreich abgemeldet.');
	}

	private async handleStatusCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Auth-Status zuerst
		const loggedIn = await this.sessionService.isLoggedIn(userId);
		const session = await this.sessionService.getSession(userId);
		const token = await this.sessionService.getToken(userId);

		let response = '**🕐 Clock Bot Status**\n\n';

		if (loggedIn && session && token) {
			const balance = await this.creditService.getBalance(token);
			response += `👤 Angemeldet als: ${session.email}\n`;
			response += `⚡ Credits: ${balance.balance.toFixed(2)}\n\n`;
		} else {
			response += `❌ Nicht angemeldet\n`;
			response += `Nutze \`!login email passwort\` zum Anmelden.\n\n`;
		}

		// Timer-Status
		try {
			const timerToken = await this.getToken(userId);
			if (timerToken) {
				const timer = await this.clockService.getRunningTimer(timerToken);
				if (timer) {
					const remaining = this.clockService.formatDuration(timer.remainingSeconds);
					const total = this.clockService.formatDuration(timer.durationSeconds);
					const statusIcon = timer.status === 'running' ? '▶️' : '⏸️';
					const statusText = timer.status === 'running' ? 'Läuft' : 'Pausiert';
					response += `**${statusIcon} Timer ${statusText}**\n`;
					response += `Verbleibend: ${remaining} / ${total}`;
					if (timer.label) response += `\nLabel: ${timer.label}`;
				} else {
					response += `Kein aktiver Timer.\n\nStarte einen mit \`!timer 25m\``;
				}
			} else {
				response += `Timer-Status nicht verfügbar (nicht angemeldet).`;
			}
		} catch (error) {
			this.logger.error('Timer status failed:', error);
			response += `Timer-Status nicht verfügbar.`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleTimersCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const timers = await this.clockService.getTimers(token);
			if (timers.length === 0) {
				await this.sendReply(roomId, event, 'Keine Timer.\n\nErstelle einen mit `!timer 25m`');
				return;
			}

			let response = '**Deine Timer:**\n\n';
			timers.forEach((t, i) => {
				const duration = this.clockService.formatDuration(t.durationSeconds);
				const statusIcon = t.status === 'running' ? '' : t.status === 'paused' ? '' : '';
				const label = t.label ? ` - ${t.label}` : '';
				response += `${i + 1}. ${statusIcon} ${duration}${label}\n`;
			});

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Timers list failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Abrufen der Timer.');
		}
	}

	private async handleAlarmCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const parts = args.trim().split(' ');

		// Handle !alarm off/on/delete commands
		if (parts[0] === 'off' || parts[0] === 'on' || parts[0] === 'delete') {
			// TODO: Implement alarm management
			await this.sendReply(roomId, event, 'Alarm-Verwaltung kommt bald!');
			return;
		}

		const time = this.clockService.parseAlarmTime(args);
		if (!time) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!alarm 07:30` oder `!alarm 7 Uhr 30`\n\nBeispiel: `!alarm 06:00 Aufstehen!`'
			);
			return;
		}

		// Extract label (everything after the time)
		const label = args.replace(/[\d:]+\s*(uhr\s*\d*)?/gi, '').trim() || null;

		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			await this.clockService.createAlarm(time, label, token);
			let response = `**Alarm gestellt!**\n\nZeit: ${time.substring(0, 5)} Uhr`;
			if (label) response += `\nLabel: ${label}`;

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Alarm creation failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Erstellen des Alarms.');
		}
	}

	private async handleAlarmsCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const alarms = await this.clockService.getAlarms(token);
			if (alarms.length === 0) {
				await this.sendReply(roomId, event, 'Keine Alarme.\n\nErstelle einen mit `!alarm 07:30`');
				return;
			}

			let response = '**Deine Alarme:**\n\n';
			alarms.forEach((a, i) => {
				const time = a.time.substring(0, 5);
				const enabledIcon = a.enabled ? '' : '';
				const label = a.label ? ` - ${a.label}` : '';
				response += `${i + 1}. ${enabledIcon} ${time} Uhr${label}\n`;
			});

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Alarms list failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Abrufen der Alarme.');
		}
	}

	private async handleTimeCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		const now = new Date();
		const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		const dateStr = now.toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});

		let response = `**${timeStr} Uhr**\n${dateStr}`;

		try {
			const token = await this.getToken(userId);
			if (token) {
				const worldClocks = await this.clockService.getWorldClocks(token);
				if (worldClocks.length > 0) {
					response += '\n\n**Weltuhren:**';
					for (const wc of worldClocks) {
						const wcTime = new Date().toLocaleTimeString('de-DE', {
							hour: '2-digit',
							minute: '2-digit',
							timeZone: wc.timezone,
						});
						response += `\n${wc.cityName}: ${wcTime}`;
					}
				}
			}
		} catch {
			// Ignore world clock errors
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleWorldClockCommand(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		if (!args.trim()) {
			await this.sendReply(
				roomId,
				event,
				'**Verwendung:** `!weltuhr Berlin` oder `!weltuhr New York`'
			);
			return;
		}

		try {
			const results = await this.clockService.searchTimezones(args);
			if (results.length === 0) {
				await this.sendReply(roomId, event, `Keine Zeitzone fur "${args}" gefunden.`);
				return;
			}

			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const best = results[0];
			await this.clockService.addWorldClock(best.timezone, best.city, token);
			await this.sendReply(roomId, event, `**Weltuhr hinzugefugt:** ${best.city}`);
		} catch (error) {
			this.logger.error('World clock add failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Hinzufugen der Weltuhr.');
		}
	}

	private async handleWorldClocksCommand(roomId: string, event: MatrixRoomEvent, userId: string) {
		try {
			const token = await this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const clocks = await this.clockService.getWorldClocks(token);
			if (clocks.length === 0) {
				await this.sendReply(
					roomId,
					event,
					'Keine Weltuhren.\n\nFuge eine hinzu mit `!weltuhr Berlin`'
				);
				return;
			}

			let response = '**Deine Weltuhren:**\n\n';
			for (const wc of clocks) {
				const time = new Date().toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit',
					timeZone: wc.timezone,
				});
				response += `${wc.cityName}: **${time}**\n`;
			}

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('World clocks list failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Abrufen der Weltuhren.');
		}
	}

	private async handleNaturalLanguage(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		text: string
	) {
		const lower = text.toLowerCase();

		// Try to detect timer intent
		if (
			lower.includes('timer') ||
			lower.includes('stoppuhr') ||
			lower.match(/start\s*\d+/) ||
			lower.match(/\d+\s*(min|m|h|stunde)/)
		) {
			const duration = this.clockService.parseDuration(text);
			if (duration) {
				await this.handleTimerCommand(roomId, event, userId, text);
				return;
			}
		}

		// Try to detect alarm intent
		if (
			lower.includes('wecker') ||
			lower.includes('alarm') ||
			lower.includes('weck mich') ||
			lower.match(/\d{1,2}:\d{2}/) ||
			lower.match(/\d{1,2}\s*uhr/)
		) {
			const time = this.clockService.parseAlarmTime(text);
			if (time) {
				await this.handleAlarmCommand(roomId, event, userId, text);
				return;
			}
		}

		// No match - don't respond to random messages
	}

	private async getToken(userId: string): Promise<string | null> {
		// SessionService hat Priorität (Login via mana-core-auth)
		const sessionToken = await this.sessionService.getToken(userId);
		if (sessionToken) return sessionToken;

		// Fallback auf clockService Token
		const storedToken = this.clockService.getUserToken(userId);
		if (storedToken) return storedToken;

		// Entwicklungs-Fallback
		return this.demoToken || null;
	}
}
