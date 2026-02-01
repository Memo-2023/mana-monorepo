import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
} from '@manacore/matrix-bot-common';
import { TodoService, Task } from '../todo/todo.service';
import { TranscriptionService, SessionService, CreditService } from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

// Credit cost for task creation (micro-credits)
const TASK_CREATE_CREDITS = 0.02;

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly keywordDetector = new KeywordCommandDetector(
		[
			...COMMON_KEYWORDS,
			{ keywords: ['was kannst du'], command: 'help' },
			{ keywords: ['zeige aufgaben', 'meine aufgaben', 'was muss ich', 'show tasks', 'list'], command: 'list' },
			{ keywords: ['heute', 'today', 'was steht an'], command: 'today' },
			{ keywords: ['inbox', 'eingang', 'ohne datum'], command: 'inbox' },
			{ keywords: ['projekte', 'projects'], command: 'projects' },
			{ keywords: ['verbindung', 'connection'], command: 'status' },
		],
		{ partialMatch: true }
	);

	constructor(
		configService: ConfigService,
		private todoService: TodoService,
		private transcriptionService: TranscriptionService,
		private sessionService: SessionService,
		private creditService: CreditService
	) {
		super(configService);
	}

	protected getConfig(): MatrixBotConfig {
		return {
			homeserverUrl: this.configService.get<string>('matrix.homeserverUrl') || 'http://localhost:8008',
			accessToken: this.configService.get<string>('matrix.accessToken') || '',
			storagePath: this.configService.get<string>('matrix.storagePath') || './data/bot-storage.json',
			allowedRooms: this.configService.get<string[]>('matrix.allowedRooms') || [],
		};
	}

	protected getIntroductionMessage(): string {
		return BOT_INTRODUCTION;
	}

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		body: string
	): Promise<void> {
		const userId = event.sender;

		try {
			// Check for natural language keywords first
			const keywordCommand = this.keywordDetector.detect(body);
			if (keywordCommand) {
				await this.executeCommand(roomId, event, userId, keywordCommand, '');
				return;
			}

			// Check for ! commands
			if (body.startsWith('!')) {
				const [command, ...args] = body.slice(1).split(' ');
				await this.executeCommand(roomId, event, userId, command.toLowerCase(), args.join(' '));
			}
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendReply(
				roomId,
				event,
				'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
			);
		}
	}

	protected async handleAudioMessage(
		roomId: string,
		event: MatrixRoomEvent,
		sender: string
	): Promise<void> {
		const content = event.content;
		if (!content?.url) return;

		try {
			await this.sendReply(roomId, event, 'Verarbeite Sprachnotiz...');

			// Download audio from Matrix
			const mxcUrl = content.url;
			const httpUrl = this.client.mxcToHttp(mxcUrl);
			this.logger.log(`Downloading audio from ${httpUrl}`);

			const response = await fetch(httpUrl);
			if (!response.ok) {
				throw new Error(`Failed to download audio: ${response.status}`);
			}

			const buffer = Buffer.from(await response.arrayBuffer());

			// Transcribe audio
			const transcription = await this.transcriptionService.transcribe(buffer);
			this.logger.log(`Transcription: ${transcription.substring(0, 50)}...`);

			if (!transcription.trim()) {
				await this.sendReply(
					roomId,
					event,
					'Konnte keine Sprache erkennen. Bitte versuche es erneut.'
				);
				return;
			}

			// Check credits if user is logged in
			const token = this.sessionService.getToken(sender);
			if (token) {
				const validation = await this.creditService.validateCredits(token, TASK_CREATE_CREDITS);
				if (!validation.hasCredits) {
					const errorMsg = this.creditService.formatInsufficientCreditsError(
						TASK_CREATE_CREDITS,
						validation.availableCredits,
						'Aufgabe erstellen'
					);
					await this.sendReply(roomId, event, `Transkription: "${transcription}"\n\n${errorMsg.text}`);
					return;
				}
			}

			// Parse the transcription as a task input
			const { title, priority, dueDate, project } = this.todoService.parseTaskInput(transcription);

			// Create the task
			const task = await this.todoService.createTask(sender, title, {
				priority,
				dueDate,
				project,
			});

			let responseText = `Transkription: "${transcription}"\n\nAufgabe erstellt: **${task.title}**`;

			const details: string[] = [];
			if (priority < 4) details.push(`Prioritat ${priority}`);
			if (dueDate) details.push(`Datum: ${this.formatDate(dueDate)}`);
			if (project) details.push(`Projekt: ${project}`);

			if (details.length > 0) {
				responseText += `\n${details.join(' | ')}`;
			}

			// Show credit deduction if logged in
			if (token) {
				const balance = await this.creditService.getBalance(token);
				responseText += `\n\n⚡ -${TASK_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)`;
			}

			await this.sendReply(roomId, event, responseText);
		} catch (error) {
			this.logger.error('Audio processing failed:', error);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler bei der Verarbeitung: ${errorMsg}`);
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

			case 'add':
			case 'neu':
			case 'neue':
				await this.handleAddTask(roomId, event, userId, args);
				break;

			case 'list':
			case 'liste':
			case 'alle':
				await this.handleListTasks(roomId, event, userId);
				break;

			case 'today':
			case 'heute':
				await this.handleTodayTasks(roomId, event, userId);
				break;

			case 'inbox':
			case 'eingang':
				await this.handleInboxTasks(roomId, event, userId);
				break;

			case 'done':
			case 'erledigt':
			case 'fertig':
				await this.handleCompleteTask(roomId, event, userId, args);
				break;

			case 'delete':
			case 'löschen':
			case 'entfernen':
				await this.handleDeleteTask(roomId, event, userId, args);
				break;

			case 'projects':
			case 'projekte':
				await this.handleProjects(roomId, event, userId);
				break;

			case 'project':
			case 'projekt':
				await this.handleProjectTasks(roomId, event, userId, args);
				break;

			case 'status':
				await this.handleStatus(roomId, event, userId);
				break;

			case 'pin':
				await this.handlePinHelp(roomId, event);
				break;

			default:
				// Unknown command - ignore silently or send help
				break;
		}
	}

	private async handleAddTask(roomId: string, event: MatrixRoomEvent, userId: string, input: string) {
		if (!input.trim()) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib eine Aufgabe an.\n\nBeispiel: `!add Einkaufen gehen`'
			);
			return;
		}

		// Check credits if user is logged in
		const token = this.sessionService.getToken(userId);
		if (token) {
			const validation = await this.creditService.validateCredits(token, TASK_CREATE_CREDITS);
			if (!validation.hasCredits) {
				const errorMsg = this.creditService.formatInsufficientCreditsError(
					TASK_CREATE_CREDITS,
					validation.availableCredits,
					'Aufgabe erstellen'
				);
				await this.sendReply(roomId, event, errorMsg.text);
				return;
			}
		}

		const { title, priority, dueDate, project } = this.todoService.parseTaskInput(input);

		const task = await this.todoService.createTask(userId, title, {
			priority,
			dueDate,
			project,
		});

		let response = `Aufgabe erstellt: **${task.title}**`;

		const details: string[] = [];
		if (priority < 4) details.push(`Prioritaet ${priority}`);
		if (dueDate) details.push(`Datum: ${this.formatDate(dueDate)}`);
		if (project) details.push(`Projekt: ${project}`);

		if (details.length > 0) {
			response += `\n${details.join(' | ')}`;
		}

		// Show credit deduction if logged in
		if (token) {
			const balance = await this.creditService.getBalance(token);
			response += `\n\n⚡ -${TASK_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleListTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		const tasks = await this.todoService.getAllPendingTasks(userId);

		if (tasks.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'Keine offenen Aufgaben.\n\nErstelle eine mit `!add [Aufgabe]`'
			);
			return;
		}

		const response = this.formatTaskList('**Alle offenen Aufgaben:**', tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleTodayTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		const tasks = await this.todoService.getTodayTasks(userId);

		if (tasks.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'Keine Aufgaben fuer heute.\n\nErstelle eine mit `!add Aufgabe @heute`'
			);
			return;
		}

		const response = this.formatTaskList('**Aufgaben fuer heute:**', tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleInboxTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		const tasks = await this.todoService.getInboxTasks(userId);

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, 'Inbox ist leer.\n\nAufgaben ohne Datum landen hier.');
			return;
		}

		const response = this.formatTaskList('**Inbox (ohne Datum):**', tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleCompleteTask(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib eine gueltige Aufgabennummer an.\n\nBeispiel: `!done 1`'
			);
			return;
		}

		const task = await this.todoService.completeTask(userId, taskNumber);

		if (!task) {
			await this.sendReply(roomId, event, `Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		await this.sendReply(roomId, event, `Erledigt: ~~${task.title}~~`);
	}

	private async handleDeleteTask(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib eine gueltige Aufgabennummer an.\n\nBeispiel: `!delete 1`'
			);
			return;
		}

		const task = await this.todoService.deleteTask(userId, taskNumber);

		if (!task) {
			await this.sendReply(roomId, event, `Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		await this.sendReply(roomId, event, `Geloescht: ${task.title}`);
	}

	private async handleProjects(roomId: string, event: MatrixRoomEvent, userId: string) {
		const projects = await this.todoService.getProjects(userId);

		if (projects.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'Keine Projekte.\n\nErstelle eine Aufgabe mit Projekt: `!add Aufgabe #projektname`'
			);
			return;
		}

		let response = '**Deine Projekte:**\n\n';
		for (const project of projects) {
			response += `- ${project.name}\n`;
		}
		response += '\nZeige Projektaufgaben mit `!project [Name]`';

		await this.sendReply(roomId, event, response);
	}

	private async handleProjectTasks(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const projectName = args.trim();

		if (!projectName) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib einen Projektnamen an.\n\nBeispiel: `!project Arbeit`'
			);
			return;
		}

		const tasks = await this.todoService.getProjectTasks(userId, projectName);

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, `Keine Aufgaben im Projekt "${projectName}".`);
			return;
		}

		const response = this.formatTaskList(`**Projekt: ${projectName}**`, tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleStatus(roomId: string, event: MatrixRoomEvent, userId: string) {
		const stats = await this.todoService.getStats(userId);
		const isLoggedIn = this.sessionService.isLoggedIn(userId);
		const email = this.sessionService.getEmail(userId);
		const token = this.sessionService.getToken(userId);

		// Get credit balance if logged in
		let creditInfo = '';
		if (token) {
			const balance = await this.creditService.getBalance(token);
			const creditIcon = balance.hasCredits ? '⚡' : '⚠️';
			creditInfo = `\n${creditIcon} Credits: ${balance.balance.toFixed(2)}`;
			if (balance.balance < 10 && balance.balance > 0) {
				creditInfo += '\n⚠️ Nur noch wenig Credits!';
			}
			if (!balance.hasCredits) {
				creditInfo += '\n👉 Credits kaufen: https://mana.how/credits';
			}
		}

		const response = `**Status**

👤 Angemeldet: ${isLoggedIn ? `Ja (${email})` : 'Nein'}${creditInfo}

- Offene Aufgaben: ${stats.pending}
- Heute faellig: ${stats.today}
- Erledigt: ${stats.completed}
- Gesamt: ${stats.total}

Bot: Online${!isLoggedIn ? '\n\nTipp: Mit `!login email passwort` anmelden fuer Credit-Tracking' : ''}`;

		await this.sendReply(roomId, event, response);
	}

	private async handleLogin(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const parts = args.trim().split(/\s+/);
		if (parts.length < 2) {
			await this.sendReply(roomId, event, 'Verwendung: `!login email passwort`');
			return;
		}

		const [email, password] = parts;
		const result = await this.sessionService.login(userId, email, password);

		if (result.success) {
			await this.sendReply(roomId, event, `Erfolgreich angemeldet als **${email}**`);
		} else {
			await this.sendReply(roomId, event, `Anmeldung fehlgeschlagen: ${result.error}`);
		}
	}

	private async handleLogout(roomId: string, event: MatrixRoomEvent, userId: string) {
		this.sessionService.logout(userId);
		await this.sendReply(roomId, event, 'Erfolgreich abgemeldet.');
	}

	private async handlePinHelp(roomId: string, event: MatrixRoomEvent) {
		try {
			// Send help message
			const helpEventId = await this.sendMessage(roomId, HELP_TEXT);

			// Pin it
			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});

			await this.sendReply(roomId, event, 'Hilfe wurde angepinnt!');
		} catch (error) {
			this.logger.error('Failed to pin help:', error);
			await this.sendReply(
				roomId,
				event,
				'Konnte Hilfe nicht anpinnen (fehlende Berechtigung?)'
			);
		}
	}

	private formatTaskList(header: string, tasks: Task[]): string {
		let response = `${header}\n\n`;

		tasks.forEach((task, index) => {
			const num = index + 1;
			const priority = task.priority < 4 ? `!`.repeat(4 - task.priority) : '';
			const date = task.dueDate ? ` ${this.formatDate(task.dueDate)}` : '';
			const project = task.project ? ` ${task.project}` : '';

			response += `**${num}.** ${task.title}${priority}${date}${project}\n`;
		});

		response += `\nErledigen: \`!done [Nr]\` | Loeschen: \`!delete [Nr]\``;
		return response;
	}

	private formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (dateStr === today.toISOString().split('T')[0]) {
			return 'Heute';
		} else if (dateStr === tomorrow.toISOString().split('T')[0]) {
			return 'Morgen';
		}

		return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
	}
}
