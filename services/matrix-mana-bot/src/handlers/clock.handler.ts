import { Injectable, Logger } from '@nestjs/common';
import { ClockService } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';

@Injectable()
export class ClockHandler {
	private readonly logger = new Logger(ClockHandler.name);

	constructor(private clockService: ClockService) {}

	async startTimer(ctx: CommandContext, input: string): Promise<string> {
		if (!input.trim()) {
			return `**Verwendung:** \`!timer [Dauer] [Name]\`

**Beispiele:**
• \`!timer 25m Pomodoro\`
• \`!timer 1h30m Meeting\`
• \`!timer 5m Pause\`

**Dauer-Formate:** 5m, 1h, 1h30m, 90s`;
		}

		try {
			const result = await this.clockService.startTimer(ctx.userId, input);
			this.logger.log(`Started timer for ${ctx.userId}: ${result.name}`);

			const durationStr = this.formatDuration(result.durationSeconds);
			return `⏱️ Timer gestartet: **${result.name || 'Timer'}**\nDauer: ${durationStr}\n\nStoppen mit \`!stop\``;
		} catch (error) {
			return `❌ ${error instanceof Error ? error.message : 'Fehler beim Starten des Timers'}`;
		}
	}

	async listTimers(ctx: CommandContext): Promise<string> {
		try {
			const timers = await this.clockService.getTimers(ctx.userId);

			if (timers.length === 0) {
				return '⏱️ Keine aktiven Timer.\n\nStarte einen mit `!timer [Dauer]`';
			}

			let response = '⏱️ **Aktive Timer:**\n\n';
			for (const timer of timers) {
				const remaining = this.formatDuration(timer.remainingSeconds);
				const status = timer.isPaused ? '⏸️' : '▶️';
				response += `${status} **${timer.name || 'Timer'}** - ${remaining} verbleibend\n`;
			}

			response += '\n`!stop` zum Beenden';
			return response;
		} catch (error) {
			return '❌ Fehler beim Abrufen der Timer.';
		}
	}

	async stopTimer(ctx: CommandContext, args: string): Promise<string> {
		try {
			const result = await this.clockService.stopTimer(ctx.userId, args.trim() || undefined);
			return `⏹️ Timer gestoppt: **${result.name || 'Timer'}**`;
		} catch (error) {
			return `❌ ${error instanceof Error ? error.message : 'Kein aktiver Timer gefunden'}`;
		}
	}

	async setAlarm(ctx: CommandContext, input: string): Promise<string> {
		if (!input.trim()) {
			return `**Verwendung:** \`!alarm [Zeit] [Name]\`

**Beispiele:**
• \`!alarm 14:30 Meeting\`
• \`!alarm 7:00 Aufstehen\`
• \`!alarm 18 Uhr Feierabend\``;
		}

		try {
			const result = await this.clockService.setAlarm(ctx.userId, input);
			this.logger.log(`Set alarm for ${ctx.userId}: ${result.name} at ${result.time}`);

			return `⏰ Alarm gesetzt: **${result.name || 'Alarm'}**\nZeit: ${result.time}`;
		} catch (error) {
			return `❌ ${error instanceof Error ? error.message : 'Fehler beim Setzen des Alarms'}`;
		}
	}

	async listAlarms(ctx: CommandContext): Promise<string> {
		try {
			const alarms = await this.clockService.getAlarms(ctx.userId);

			if (alarms.length === 0) {
				return '⏰ Keine aktiven Alarme.\n\nSetze einen mit `!alarm [Zeit]`';
			}

			let response = '⏰ **Aktive Alarme:**\n\n';
			for (const alarm of alarms) {
				const status = alarm.enabled ? '🔔' : '🔕';
				response += `${status} **${alarm.name || 'Alarm'}** - ${alarm.time}\n`;
			}

			return response;
		} catch (error) {
			return '❌ Fehler beim Abrufen der Alarme.';
		}
	}

	async worldClock(ctx: CommandContext, city: string): Promise<string> {
		if (!city.trim()) {
			// Show common time zones
			const zones = [
				{ city: 'Berlin', tz: 'Europe/Berlin' },
				{ city: 'London', tz: 'Europe/London' },
				{ city: 'New York', tz: 'America/New_York' },
				{ city: 'Tokyo', tz: 'Asia/Tokyo' },
				{ city: 'Sydney', tz: 'Australia/Sydney' },
			];

			let response = '🌍 **Weltuhren:**\n\n';
			const now = new Date();

			for (const { city, tz } of zones) {
				const time = now.toLocaleTimeString('de-DE', {
					timeZone: tz,
					hour: '2-digit',
					minute: '2-digit',
				});
				response += `• **${city}:** ${time}\n`;
			}

			response += '\nZeige andere Stadt: `!time [Stadt]`';
			return response;
		}

		try {
			const result = await this.clockService.getWorldClock(city);
			return `🕐 **${result.city}:** ${result.time}\n📅 ${result.date}`;
		} catch (error) {
			return `❌ Stadt "${city}" nicht gefunden.\n\nVersuche: Berlin, London, New York, Tokyo, Sydney`;
		}
	}

	private formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		const parts: string[] = [];
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0) parts.push(`${minutes}m`);
		if (secs > 0 && hours === 0) parts.push(`${secs}s`);

		return parts.join(' ') || '0s';
	}
}
