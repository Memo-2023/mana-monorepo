import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	MatrixClient,
	SimpleFsStorageProvider,
	AutojoinRoomsMixin,
	RichReply,
} from 'matrix-bot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import { ClockService, Timer, Alarm } from '../clock/clock.service';
import { TranscriptionService } from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT } from '../config/configuration';

// Natural language keywords
const KEYWORD_COMMANDS: { keywords: string[]; command: string }[] = [
	{ keywords: ['hilfe', 'help', 'befehle', 'commands'], command: 'help' },
	{ keywords: ['status', 'timer status', 'laufend'], command: 'status' },
	{ keywords: ['stop', 'stopp', 'pause', 'anhalten'], command: 'stop' },
	{ keywords: ['weiter', 'resume', 'fortsetzen'], command: 'resume' },
	{ keywords: ['zeit', 'time', 'uhrzeit', 'wie spat'], command: 'time' },
];

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client!: MatrixClient;
	private readonly homeserverUrl: string;
	private readonly accessToken: string;
	private readonly allowedRooms: string[];
	private readonly storagePath: string;
	private botUserId: string = '';

	// Demo token for development (TODO: implement proper auth)
	private readonly demoToken = process.env.CLOCK_API_TOKEN || '';

	constructor(
		private configService: ConfigService,
		private clockService: ClockService,
		private transcriptionService: TranscriptionService
	) {
		this.homeserverUrl = this.configService.get<string>(
			'matrix.homeserverUrl',
			'http://localhost:8008'
		);
		this.accessToken = this.configService.get<string>('matrix.accessToken', '');
		this.allowedRooms = this.configService.get<string[]>('matrix.allowedRooms', []);
		this.storagePath = this.configService.get<string>(
			'matrix.storagePath',
			'./data/bot-storage.json'
		);
	}

	async onModuleInit() {
		if (!this.accessToken) {
			this.logger.warn('No Matrix access token configured. Bot will not start.');
			return;
		}

		await this.initializeClient();
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.stop();
		}
	}

	private async initializeClient() {
		try {
			const storageDir = path.dirname(this.storagePath);
			if (!fs.existsSync(storageDir)) {
				fs.mkdirSync(storageDir, { recursive: true });
			}

			const storage = new SimpleFsStorageProvider(this.storagePath);
			this.client = new MatrixClient(this.homeserverUrl, this.accessToken, storage);

			AutojoinRoomsMixin.setupOnClient(this.client);

			this.client.on('room.invite', async (roomId: string) => {
				this.logger.log(`Invited to room ${roomId}, joining...`);
				await this.client.joinRoom(roomId);

				setTimeout(async () => {
					await this.sendWelcome(roomId);
				}, 2000);
			});

			this.client.on('room.message', async (roomId: string, event: any) => {
				await this.handleMessage(roomId, event);
			});

			await this.client.start();
			this.botUserId = await this.client.getUserId();
			this.logger.log(`Matrix Clock Bot connected as ${this.botUserId}`);
		} catch (error) {
			this.logger.error('Failed to initialize Matrix client:', error);
		}
	}

	private async handleMessage(roomId: string, event: any) {
		if (event.sender === this.botUserId) return;

		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			return;
		}

		const userId = event.sender;
		const msgtype = event.content?.msgtype;

		// Handle audio messages
		if (msgtype === 'm.audio' && event.content?.url) {
			await this.handleAudioMessage(roomId, event, userId);
			return;
		}

		if (msgtype !== 'm.text') return;

		const body = event.content.body?.trim();
		if (!body) return;

		try {
			// Check keywords first
			const keywordCommand = this.detectKeywordCommand(body);
			if (keywordCommand) {
				await this.executeCommand(roomId, event, userId, keywordCommand, '');
				return;
			}

			// Handle ! commands
			if (body.startsWith('!')) {
				const [command, ...args] = body.slice(1).split(' ');
				await this.executeCommand(roomId, event, userId, command.toLowerCase(), args.join(' '));
				return;
			}

			// Try to parse as natural timer/alarm command
			await this.handleNaturalLanguage(roomId, event, userId, body);
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendReply(roomId, event, 'Ein Fehler ist aufgetreten.');
		}
	}

	private detectKeywordCommand(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();
		if (lowerMessage.length > 50) return null;

		for (const { keywords, command } of KEYWORD_COMMANDS) {
			for (const keyword of keywords) {
				if (lowerMessage === keyword || lowerMessage.startsWith(keyword + ' ')) {
					return command;
				}
			}
		}
		return null;
	}

	private async executeCommand(
		roomId: string,
		event: any,
		userId: string,
		command: string,
		args: string
	) {
		switch (command) {
			case 'help':
			case 'hilfe':
				await this.sendReply(roomId, event, HELP_TEXT);
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

	private async handleTimerCommand(roomId: string, event: any, userId: string, args: string) {
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
			const token = this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung. Bitte zuerst `!login`.');
				return;
			}

			// Create and start timer
			const timer = await this.clockService.createTimer(durationSeconds, label, token);
			const startedTimer = await this.clockService.startTimer(timer.id, token);

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

	private async handleStopCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
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

	private async handleResumeCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
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

	private async handleResetCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
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

	private async handleStatusCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const timer = await this.clockService.getRunningTimer(token);
			if (!timer) {
				await this.sendReply(roomId, event, 'Kein aktiver Timer.\n\nStarte einen mit `!timer 25m`');
				return;
			}

			const remaining = this.clockService.formatDuration(timer.remainingSeconds);
			const total = this.clockService.formatDuration(timer.durationSeconds);
			const statusIcon = timer.status === 'running' ? '' : '';
			const statusText = timer.status === 'running' ? 'Lauft' : 'Pausiert';

			let response = `**${statusIcon} Timer ${statusText}**\n\n`;
			response += `Verbleibend: ${remaining} / ${total}`;
			if (timer.label) response += `\nLabel: ${timer.label}`;

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Status failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Abrufen des Status.');
		}
	}

	private async handleTimersCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
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

	private async handleAlarmCommand(roomId: string, event: any, userId: string, args: string) {
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
			const token = this.getToken(userId);
			if (!token) {
				await this.sendReply(roomId, event, 'Keine Authentifizierung.');
				return;
			}

			const alarm = await this.clockService.createAlarm(time, label, token);
			let response = `**Alarm gestellt!**\n\nZeit: ${time.substring(0, 5)} Uhr`;
			if (label) response += `\nLabel: ${label}`;

			await this.sendReply(roomId, event, response);
		} catch (error) {
			this.logger.error('Alarm creation failed:', error);
			await this.sendReply(roomId, event, 'Fehler beim Erstellen des Alarms.');
		}
	}

	private async handleAlarmsCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
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

	private async handleTimeCommand(roomId: string, event: any, userId: string) {
		const now = new Date();
		const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		const dateStr = now.toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});

		let response = `**${timeStr} Uhr**\n${dateStr}`;

		try {
			const token = this.getToken(userId);
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

	private async handleWorldClockCommand(roomId: string, event: any, userId: string, args: string) {
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

			const token = this.getToken(userId);
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

	private async handleWorldClocksCommand(roomId: string, event: any, userId: string) {
		try {
			const token = this.getToken(userId);
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

	private async handleNaturalLanguage(roomId: string, event: any, userId: string, text: string) {
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

	private async handleAudioMessage(roomId: string, event: any, userId: string) {
		try {
			await this.sendReply(roomId, event, 'Verarbeite Sprachnotiz...');

			const mxcUrl = event.content.url;
			const httpUrl = this.client.mxcToHttp(mxcUrl);

			const response = await fetch(httpUrl);
			if (!response.ok) {
				throw new Error(`Failed to download audio: ${response.status}`);
			}

			const buffer = Buffer.from(await response.arrayBuffer());
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
				await this.handleTimerCommand(roomId, event, userId, transcription);
				return;
			}

			// Check for alarm
			const time = this.clockService.parseAlarmTime(transcription);
			if (time && (lower.includes('wecker') || lower.includes('alarm') || lower.includes('uhr'))) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleAlarmCommand(roomId, event, userId, transcription);
				return;
			}

			// Check for stop/status commands
			if (lower.includes('stop') || lower.includes('stopp') || lower.includes('pause')) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleStopCommand(roomId, event, userId);
				return;
			}

			if (lower.includes('status') || lower.includes('wie viel')) {
				await this.sendReply(roomId, event, `"${transcription}"`);
				await this.handleStatusCommand(roomId, event, userId);
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

	private getToken(userId: string): string | null {
		// First check if user has a stored token
		const storedToken = this.clockService.getUserToken(userId);
		if (storedToken) return storedToken;

		// Fall back to demo token for development
		return this.demoToken || null;
	}

	private async sendWelcome(roomId: string) {
		try {
			await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: WELCOME_TEXT,
				format: 'org.matrix.custom.html',
				formatted_body: this.markdownToHtml(WELCOME_TEXT),
			});
		} catch (error) {
			this.logger.error('Failed to send welcome:', error);
		}
	}

	private async sendReply(roomId: string, event: any, message: string) {
		const reply = RichReply.createFor(roomId, event, message, this.markdownToHtml(message));
		reply.msgtype = 'm.text';
		await this.client.sendMessage(roomId, reply);
	}

	private markdownToHtml(text: string): string {
		return text
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/`(.+?)`/g, '<code>$1</code>')
			.replace(/\n/g, '<br>');
	}
}
