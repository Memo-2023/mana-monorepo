import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { KeywordCommandDetector, COMMON_KEYWORDS } from '@manacore/matrix-bot-common';
import { AiHandler } from '../handlers/ai.handler';
import { TodoHandler } from '../handlers/todo.handler';
import { CalendarHandler } from '../handlers/calendar.handler';
import { ClockHandler } from '../handlers/clock.handler';
import { HelpHandler } from '../handlers/help.handler';
import { VoiceHandler } from '../handlers/voice.handler';
import { OrchestrationService } from '../orchestration/orchestration.service';

export interface CommandContext {
	roomId: string;
	userId: string;
	message: string;
	event: any;
	isVoice?: boolean; // True if message came from voice input
}

interface CommandRoute {
	patterns: (string | RegExp)[];
	handler: (ctx: CommandContext, args: string) => Promise<string>;
	description: string;
}

@Injectable()
export class CommandRouterService {
	private readonly keywordDetector = new KeywordCommandDetector([
		...COMMON_KEYWORDS,
		{ keywords: ['modelle', 'models', 'welche modelle', 'ai models'], command: 'models' },
		{ keywords: ['meine aufgaben', 'zeige aufgaben', 'todo liste', 'was muss ich', 'aufgaben'], command: 'list' },
		{ keywords: ['heute', 'was steht heute an', 'today'], command: 'today' },
		{ keywords: ['termine', 'kalender', 'meine termine', 'calendar'], command: 'cal' },
		{ keywords: ['timer', 'stoppuhr', 'zeitmesser'], command: 'timers' },
		{ keywords: ['zusammenfassung', 'wie war mein tag', 'tagesrueckblick', 'summary'], command: 'summary' },
		{ keywords: ['todo', 'aufgabe', 'neue aufgabe', 'task'], command: 'todo' },
		{ keywords: ['alarm', 'wecker', 'alarme'], command: 'alarms' },
		{ keywords: ['clear', 'loeschen', 'verlauf loeschen', 'reset'], command: 'clear' },
	]);
	private readonly logger = new Logger(CommandRouterService.name);
	private routes: CommandRoute[] = [];

	constructor(
		@Inject(forwardRef(() => AiHandler))
		private aiHandler: AiHandler,
		@Inject(forwardRef(() => TodoHandler))
		private todoHandler: TodoHandler,
		@Inject(forwardRef(() => CalendarHandler))
		private calendarHandler: CalendarHandler,
		@Inject(forwardRef(() => ClockHandler))
		private clockHandler: ClockHandler,
		@Inject(forwardRef(() => HelpHandler))
		private helpHandler: HelpHandler,
		@Inject(forwardRef(() => VoiceHandler))
		private voiceHandler: VoiceHandler,
		@Inject(forwardRef(() => OrchestrationService))
		private orchestration: OrchestrationService
	) {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.routes = [
			// Help
			{
				patterns: ['!help', '!start', '!hilfe'],
				handler: (ctx) => this.helpHandler.showHelp(ctx),
				description: 'Show help',
			},

			// Auth Commands
			{
				patterns: ['!login'],
				handler: (ctx, args) => this.helpHandler.handleLogin(ctx, args),
				description: 'Login with email and password',
			},
			{
				patterns: ['!logout'],
				handler: (ctx) => this.helpHandler.handleLogout(ctx),
				description: 'Logout',
			},

			// AI Commands
			{
				patterns: ['!models', '!modelle'],
				handler: (ctx) => this.aiHandler.listModels(ctx),
				description: 'List AI models',
			},
			{
				patterns: ['!model'],
				handler: (ctx, args) => this.aiHandler.setModel(ctx, args),
				description: 'Switch AI model',
			},
			{
				patterns: ['!all'],
				handler: (ctx, args) => this.aiHandler.compareAll(ctx, args),
				description: 'Compare all models',
			},
			{
				patterns: ['!clear', '!reset'],
				handler: (ctx) => this.aiHandler.clearHistory(ctx),
				description: 'Clear chat history',
			},

			// Todo Commands
			{
				patterns: ['!todo', '!add', '!neu'],
				handler: (ctx, args) => this.todoHandler.create(ctx, args),
				description: 'Create todo',
			},
			{
				patterns: ['!list', '!liste', '!alle'],
				handler: (ctx) => this.todoHandler.list(ctx),
				description: 'List todos',
			},
			{
				patterns: ['!today', '!heute'],
				handler: (ctx) => this.todoHandler.today(ctx),
				description: "Today's todos",
			},
			{
				patterns: ['!inbox'],
				handler: (ctx) => this.todoHandler.inbox(ctx),
				description: 'Inbox todos',
			},
			{
				patterns: ['!done', '!erledigt', '!fertig'],
				handler: (ctx, args) => this.todoHandler.complete(ctx, args),
				description: 'Complete todo',
			},
			{
				patterns: ['!delete', '!löschen'],
				handler: (ctx, args) => this.todoHandler.delete(ctx, args),
				description: 'Delete todo',
			},
			{
				patterns: ['!projects', '!projekte'],
				handler: (ctx) => this.todoHandler.projects(ctx),
				description: 'List projects',
			},

			// Calendar Commands
			{
				patterns: ['!cal', '!termine'],
				handler: (ctx) => this.calendarHandler.today(ctx),
				description: "Today's events",
			},
			{
				patterns: ['!week', '!woche'],
				handler: (ctx) => this.calendarHandler.week(ctx),
				description: 'Week events',
			},
			{
				patterns: ['!event', '!termin'],
				handler: (ctx, args) => this.calendarHandler.create(ctx, args),
				description: 'Create event',
			},
			{
				patterns: ['!calendars', '!kalender'],
				handler: (ctx) => this.calendarHandler.listCalendars(ctx),
				description: 'List calendars',
			},

			// Clock Commands
			{
				patterns: ['!timer'],
				handler: (ctx, args) => this.clockHandler.startTimer(ctx, args),
				description: 'Start timer',
			},
			{
				patterns: ['!timers'],
				handler: (ctx) => this.clockHandler.listTimers(ctx),
				description: 'List timers',
			},
			{
				patterns: ['!alarm'],
				handler: (ctx, args) => this.clockHandler.setAlarm(ctx, args),
				description: 'Set alarm',
			},
			{
				patterns: ['!alarms'],
				handler: (ctx) => this.clockHandler.listAlarms(ctx),
				description: 'List alarms',
			},
			{
				patterns: ['!time', '!zeit'],
				handler: (ctx, args) => this.clockHandler.worldClock(ctx, args),
				description: 'World clock',
			},
			{
				patterns: ['!stop'],
				handler: (ctx, args) => this.clockHandler.stopTimer(ctx, args),
				description: 'Stop timer',
			},

			// Cross-Feature (Orchestration)
			{
				patterns: ['!summary', '!zusammenfassung'],
				handler: (ctx) => this.orchestration.dailySummary(ctx),
				description: 'Daily summary',
			},
			{
				patterns: ['!ai-todo'],
				handler: (ctx, args) => this.orchestration.aiToTodos(ctx, args),
				description: 'AI extracts todos',
			},

			// Status
			{
				patterns: ['!status'],
				handler: (ctx) => this.helpHandler.showStatus(ctx),
				description: 'Show status',
			},

			// Voice Commands
			{
				patterns: ['!voice', '!sprache'],
				handler: (ctx, args) => this.voiceHandler.voiceSettings(ctx, args),
				description: 'Voice settings',
			},
			{
				patterns: ['!stimmen', '!voices'],
				handler: (ctx) => this.voiceHandler.listVoices(ctx),
				description: 'List voices',
			},
			{
				patterns: ['!stimme'],
				handler: (ctx, args) => this.voiceHandler.setVoice(ctx, args),
				description: 'Set voice',
			},
			{
				patterns: ['!speed', '!tempo', '!geschwindigkeit'],
				handler: (ctx, args) => this.voiceHandler.setSpeed(ctx, args),
				description: 'Set speech speed',
			},
		];
	}

	async route(ctx: CommandContext): Promise<string | null> {
		const message = ctx.message.trim();

		// Check for natural language keywords first
		const keywordCommand = this.detectKeywordCommand(message);
		if (keywordCommand) {
			return this.routeCommand({ ...ctx, message: keywordCommand });
		}

		// Check for ! commands
		if (message.startsWith('!')) {
			return this.routeCommand(ctx);
		}

		// Default: treat as AI chat
		return this.aiHandler.chat(ctx, message);
	}

	private async routeCommand(ctx: CommandContext): Promise<string | null> {
		const { command, args } = this.parseCommand(ctx.message);

		for (const route of this.routes) {
			if (this.matchesPattern(command, route.patterns)) {
				this.logger.debug(`Routing "${command}" to ${route.description}`);
				try {
					return await route.handler(ctx, args);
				} catch (error) {
					this.logger.error(`Error in handler for "${command}":`, error);
					return `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
				}
			}
		}

		// Unknown command
		return null;
	}

	private detectKeywordCommand(message: string): string | null {
		const command = this.keywordDetector.detect(message);
		if (command) {
			this.logger.debug(`Detected keyword -> "!${command}"`);
			return `!${command}`;
		}
		return null;
	}

	private matchesPattern(command: string, patterns: (string | RegExp)[]): boolean {
		for (const pattern of patterns) {
			if (typeof pattern === 'string') {
				if (command === pattern) return true;
			} else if (pattern.test(command)) {
				return true;
			}
		}
		return false;
	}

	private parseCommand(message: string): { command: string; args: string } {
		const trimmed = message.trim();
		if (trimmed.startsWith('!')) {
			const [cmd, ...rest] = trimmed.split(' ');
			return { command: cmd.toLowerCase(), args: rest.join(' ') };
		}
		return { command: '', args: trimmed };
	}
}
