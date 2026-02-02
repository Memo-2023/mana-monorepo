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
import {
	TranscriptionService,
	SessionService,
	CreditService,
	TodoApiService,
	Task as ApiTask,
	I18nService,
	Language,
	LANGUAGE_NAMES,
} from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

// Credit cost for task creation (micro-credits)
const TASK_CREATE_CREDITS = 0.02;

@Injectable()
export class MatrixService extends BaseMatrixService {
	private readonly keywordDetector = new KeywordCommandDetector(
		[
			...COMMON_KEYWORDS,
			{ keywords: ['was kannst du', 'hilfe', 'help'], command: 'help' },
			{
				keywords: [
					'zeige aufgaben',
					'meine aufgaben',
					'was muss ich',
					'show tasks',
					'list',
					'liste',
					'alle',
				],
				command: 'list',
			},
			{ keywords: ['heute', 'today', 'was steht an'], command: 'today' },
			{ keywords: ['inbox', 'eingang', 'ohne datum'], command: 'inbox' },
			{ keywords: ['projekte', 'projects'], command: 'projects' },
			{ keywords: ['verbindung', 'connection', 'status'], command: 'status' },
			{ keywords: ['neu', 'neue', 'add'], command: 'add' },
			{ keywords: ['erledigt', 'fertig', 'done'], command: 'done' },
			{ keywords: ['löschen', 'entfernen', 'delete'], command: 'delete' },
			{ keywords: ['projekt', 'project'], command: 'project' },
			{ keywords: ['pin'], command: 'pin' },
			{ keywords: ['login', 'anmelden'], command: 'login' },
			{ keywords: ['logout', 'abmelden'], command: 'logout' },
			{ keywords: ['sprache', 'language', 'lang'], command: 'language' },
		],
		{ partialMatch: true }
	);

	constructor(
		configService: ConfigService,
		private todoService: TodoService,
		private todoApiService: TodoApiService,
		private transcriptionService: TranscriptionService,
		private sessionService: SessionService,
		private creditService: CreditService,
		private i18nService: I18nService
	) {
		super(configService);
	}

	/**
	 * Check if user is logged in and has a valid token for API access
	 */
	private async getToken(userId: string): Promise<string | null> {
		return this.sessionService.getToken(userId);
	}

	/**
	 * Normalize task from API or local format to common format
	 */
	private normalizeTask(task: Task | ApiTask): Task {
		return {
			id: task.id,
			title: task.title,
			completed: task.completed,
			priority: task.priority,
			dueDate: task.dueDate,
			project: task.project,
			labels: task.labels || [],
			createdAt: task.createdAt,
			completedAt: task.completedAt || null,
			userId: task.userId,
		};
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

	protected getIntroductionMessage(): string {
		return BOT_INTRODUCTION;
	}

	// Commands that can be used without ! prefix
	private readonly directCommands = [
		'help',
		'hilfe',
		'add',
		'neu',
		'neue',
		'list',
		'liste',
		'alle',
		'heute',
		'today',
		'inbox',
		'eingang',
		'done',
		'erledigt',
		'fertig',
		'delete',
		'löschen',
		'entfernen',
		'projects',
		'projekte',
		'project',
		'projekt',
		'status',
		'pin',
		'login',
		'logout',
		'language',
		'sprache',
		'lang',
	];

	protected async handleTextMessage(
		roomId: string,
		event: MatrixRoomEvent,
		body: string
	): Promise<void> {
		const userId = event.sender;

		try {
			// Check for ! commands first
			if (body.startsWith('!')) {
				const [command, ...args] = body.slice(1).split(' ');
				await this.executeCommand(roomId, event, userId, command.toLowerCase(), args.join(' '));
				return;
			}

			// Check for direct commands (without ! prefix)
			const trimmedBody = body.trim();
			const words = trimmedBody.split(/\s+/);
			const firstWord = words[0].toLowerCase();

			if (this.directCommands.includes(firstWord)) {
				const args = words.slice(1).join(' ');
				await this.executeCommand(roomId, event, userId, firstWord, args);
				return;
			}

			// Check for natural language keywords
			const keywordCommand = this.keywordDetector.detect(body);
			if (keywordCommand) {
				// For commands that need args, try to extract from the message
				const args = this.extractArgsAfterKeyword(body, keywordCommand);
				await this.executeCommand(roomId, event, userId, keywordCommand, args);
				return;
			}

			// Fallback: treat any message as a task
			await this.handleAddTask(roomId, event, userId, body);
		} catch (error) {
			this.logger.error(`Error handling message: ${error}`);
			await this.sendReply(roomId, event, 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
		}
	}

	/**
	 * Extract arguments after a keyword match
	 */
	private extractArgsAfterKeyword(body: string, command: string): string {
		// Map commands to their trigger keywords
		const commandKeywords: Record<string, string[]> = {
			add: ['neu', 'neue', 'add'],
			done: ['erledigt', 'fertig', 'done'],
			delete: ['löschen', 'entfernen', 'delete'],
			project: ['projekt', 'project'],
			login: ['login', 'anmelden'],
			language: ['sprache', 'language', 'lang'],
		};

		const keywords = commandKeywords[command];
		if (!keywords) return '';

		const lowerBody = body.toLowerCase();
		for (const keyword of keywords) {
			const index = lowerBody.indexOf(keyword);
			if (index !== -1) {
				return body.substring(index + keyword.length).trim();
			}
		}
		return '';
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

			// Check if user is logged in
			const token = await this.getToken(sender);

			// Check credits if user is logged in
			if (token) {
				const validation = await this.creditService.validateCredits(token, TASK_CREATE_CREDITS);
				if (!validation.hasCredits) {
					const errorMsg = this.creditService.formatInsufficientCreditsError(
						TASK_CREATE_CREDITS,
						validation.availableCredits,
						'Aufgabe erstellen'
					);
					await this.sendReply(
						roomId,
						event,
						`Transkription: "${transcription}"\n\n${errorMsg.text}`
					);
					return;
				}
			}

			let task: Task;

			if (token) {
				// Use API service (syncs with todo-web and mobile)
				const { title, priority, dueDate, project } =
					this.todoApiService.parseTaskInput(transcription);
				const apiTask = await this.todoApiService.createTask(token, { title, priority, dueDate });
				if (!apiTask) {
					await this.sendReply(
						roomId,
						event,
						`Transkription: "${transcription}"\n\nFehler beim Erstellen der Aufgabe.`
					);
					return;
				}
				task = this.normalizeTask(apiTask);
				task.project = project;
			} else {
				// Use local storage (offline mode)
				const { title, priority, dueDate, project } =
					this.todoService.parseTaskInput(transcription);
				task = await this.todoService.createTask(sender, title, {
					priority,
					dueDate,
					project,
				});
			}

			let responseText = `Transkription: "${transcription}"\n\nAufgabe erstellt: **${task.title}**`;

			const details: string[] = [];
			if (task.priority < 4) details.push(`Prioritat ${task.priority}`);
			if (task.dueDate) details.push(`Datum: ${this.formatDate(task.dueDate)}`);
			if (task.project) details.push(`Projekt: ${task.project}`);

			if (details.length > 0) {
				responseText += `\n${details.join(' | ')}`;
			}

			// Show credit deduction and sync status if logged in
			if (token) {
				const balance = await this.creditService.getBalance(token);
				responseText += `\n\n⚡ -${TASK_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)`;
				responseText += '\n🔄 Synchronisiert mit todo-backend';
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

			case 'language':
			case 'sprache':
			case 'lang':
				await this.handleLanguage(roomId, event, userId, args);
				break;

			default:
				// Unknown command - ignore silently or send help
				break;
		}
	}

	private async handleLanguage(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const lang = args.trim().toLowerCase();

		// Show current language if no argument
		if (!lang) {
			const currentLang = await this.i18nService.getLanguage(userId);
			const langName = LANGUAGE_NAMES[currentLang];
			const available = this.i18nService
				.getAvailableLanguages()
				.map((l) => `${l} (${LANGUAGE_NAMES[l]})`)
				.join(', ');
			await this.sendReply(
				roomId,
				event,
				`**Sprache / Language:** ${langName}\n\n**Verfügbar / Available:** ${available}\n\nÄndern / Change: \`sprache de\` oder / or \`sprache en\``
			);
			return;
		}

		// Validate and set language
		if (!this.i18nService.isValidLanguage(lang)) {
			const available = this.i18nService.getAvailableLanguages().join(', ');
			await this.sendReply(
				roomId,
				event,
				`Unbekannte Sprache / Unknown language: ${lang}\n\nVerfügbar / Available: ${available}`
			);
			return;
		}

		await this.i18nService.setLanguage(userId, lang as Language);
		const langName = LANGUAGE_NAMES[lang as Language];

		// Respond in the new language
		if (lang === 'de') {
			await this.sendReply(roomId, event, `Sprache geändert zu: **${langName}**`);
		} else {
			await this.sendReply(roomId, event, `Language changed to: **${langName}**`);
		}
	}

	private async handleAddTask(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		input: string
	) {
		if (!input.trim()) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib eine Aufgabe an.\n\nBeispiel: `neu Einkaufen gehen`'
			);
			return;
		}

		// Check if user is logged in
		const token = await this.getToken(userId);

		// Check credits if user is logged in
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

		let task: Task;

		if (token) {
			// Use API service (syncs with todo-web and mobile)
			const { title, priority, dueDate, project } = this.todoApiService.parseTaskInput(input);
			const apiTask = await this.todoApiService.createTask(token, { title, priority, dueDate });
			if (!apiTask) {
				await this.sendReply(
					roomId,
					event,
					'Fehler beim Erstellen der Aufgabe. Bitte versuche es erneut.'
				);
				return;
			}
			task = this.normalizeTask(apiTask);
			task.project = project; // Note: project handling via API needs project ID lookup
		} else {
			// Use local storage (offline mode)
			const { title, priority, dueDate, project } = this.todoService.parseTaskInput(input);
			task = await this.todoService.createTask(userId, title, {
				priority,
				dueDate,
				project,
			});
		}

		let response = `Aufgabe erstellt: **${task.title}**`;

		const details: string[] = [];
		if (task.priority < 4) details.push(`Prioritaet ${task.priority}`);
		if (task.dueDate) details.push(`Datum: ${this.formatDate(task.dueDate)}`);
		if (task.project) details.push(`Projekt: ${task.project}`);

		if (details.length > 0) {
			response += `\n${details.join(' | ')}`;
		}

		// Show credit deduction and sync status if logged in
		if (token) {
			const balance = await this.creditService.getBalance(token);
			response += `\n\n⚡ -${TASK_CREATE_CREDITS} Credits (${balance.balance.toFixed(2)} verbleibend)`;
			response += '\n🔄 Synchronisiert mit todo-backend';
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleListTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		let tasks: Task[];

		if (token) {
			// Use API service
			const apiTasks = await this.todoApiService.getTasks(token, { completed: false });
			tasks = apiTasks.map((t) => this.normalizeTask(t));
		} else {
			// Use local storage
			tasks = await this.todoService.getAllPendingTasks(userId);
		}

		if (tasks.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'Keine offenen Aufgaben.\n\nErstelle eine mit `neu [Aufgabe]`'
			);
			return;
		}

		let response = this.formatTaskList('**Alle offenen Aufgaben:**', tasks);
		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}
		await this.sendReply(roomId, event, response);
	}

	private async handleTodayTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		let todayTasks: Task[];
		let inboxTasks: Task[];

		if (token) {
			// Use API service
			const apiTodayTasks = await this.todoApiService.getTodayTasks(token);
			const apiInboxTasks = await this.todoApiService.getInboxTasks(token);
			todayTasks = apiTodayTasks.map((t) => this.normalizeTask(t));
			inboxTasks = apiInboxTasks.map((t) => this.normalizeTask(t));
		} else {
			// Use local storage
			todayTasks = await this.todoService.getTodayTasks(userId);
			inboxTasks = await this.todoService.getInboxTasks(userId);
		}

		const hasTodayTasks = todayTasks.length > 0;
		const hasInboxTasks = inboxTasks.length > 0;

		if (!hasTodayTasks && !hasInboxTasks) {
			await this.sendReply(
				roomId,
				event,
				'Keine Aufgaben.\n\nErstelle eine mit `neu Aufgabe` oder `neu Aufgabe @heute`'
			);
			return;
		}

		let response = '';

		if (hasTodayTasks) {
			response += this.formatTaskList('**Aufgaben fuer heute:**', todayTasks);
		}

		if (hasInboxTasks) {
			if (hasTodayTasks) {
				response += '\n\n';
			}
			response += this.formatTaskList('**Inbox (ohne Datum):**', inboxTasks);
		}

		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}
		await this.sendReply(roomId, event, response);
	}

	private async handleInboxTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		let tasks: Task[];

		if (token) {
			// Use API service
			const apiTasks = await this.todoApiService.getInboxTasks(token);
			tasks = apiTasks.map((t) => this.normalizeTask(t));
		} else {
			// Use local storage
			tasks = await this.todoService.getInboxTasks(userId);
		}

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, 'Inbox ist leer.\n\nAufgaben ohne Datum landen hier.');
			return;
		}

		let response = this.formatTaskList('**Inbox (ohne Datum):**', tasks);
		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}
		await this.sendReply(roomId, event, response);
	}

	private async handleCompleteTask(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib eine gueltige Aufgabennummer an.\n\nBeispiel: `erledigt 1`'
			);
			return;
		}

		const token = await this.getToken(userId);
		let task: Task | null = null;

		if (token) {
			// Use API service - need to get task list first to find task by index
			const apiTasks = await this.todoApiService.getTasks(token, { completed: false });
			if (taskNumber > 0 && taskNumber <= apiTasks.length) {
				const targetTask = apiTasks[taskNumber - 1];
				const completedTask = await this.todoApiService.completeTask(token, targetTask.id);
				if (completedTask) {
					task = this.normalizeTask(completedTask);
				}
			}
		} else {
			// Use local storage
			task = await this.todoService.completeTask(userId, taskNumber);
		}

		if (!task) {
			await this.sendReply(roomId, event, `Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		let response = `Erledigt: ~~${task.title}~~`;
		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}
		await this.sendReply(roomId, event, response);
	}

	private async handleDeleteTask(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib eine gueltige Aufgabennummer an.\n\nBeispiel: `löschen 1`'
			);
			return;
		}

		const token = await this.getToken(userId);
		let task: Task | null = null;

		if (token) {
			// Use API service - need to get task list first to find task by index
			const apiTasks = await this.todoApiService.getTasks(token, { completed: false });
			if (taskNumber > 0 && taskNumber <= apiTasks.length) {
				const targetTask = apiTasks[taskNumber - 1];
				const deleted = await this.todoApiService.deleteTask(token, targetTask.id);
				if (deleted) {
					task = this.normalizeTask(targetTask);
				}
			}
		} else {
			// Use local storage
			task = await this.todoService.deleteTask(userId, taskNumber);
		}

		if (!task) {
			await this.sendReply(roomId, event, `Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		let response = `Geloescht: ${task.title}`;
		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}
		await this.sendReply(roomId, event, response);
	}

	private async handleProjects(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		let projects: { name: string }[];

		if (token) {
			// Use API service
			const apiProjects = await this.todoApiService.getProjects(token);
			projects = apiProjects;
		} else {
			// Use local storage
			projects = await this.todoService.getProjects(userId);
		}

		if (projects.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'Keine Projekte.\n\nErstelle eine Aufgabe mit Projekt: `neu Aufgabe #projektname`'
			);
			return;
		}

		let response = '**Deine Projekte:**\n\n';
		for (const project of projects) {
			response += `- ${project.name}\n`;
		}
		response += '\nZeige Projektaufgaben mit `projekt [Name]`';
		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleProjectTasks(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string,
		args: string
	) {
		const projectName = args.trim();

		if (!projectName) {
			await this.sendReply(
				roomId,
				event,
				'Bitte gib einen Projektnamen an.\n\nBeispiel: `projekt Arbeit`'
			);
			return;
		}

		const token = await this.getToken(userId);
		let tasks: Task[];

		if (token) {
			// Use API service - need to find project ID first
			const projects = await this.todoApiService.getProjects(token);
			const project = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase());
			if (project) {
				const apiTasks = await this.todoApiService.getProjectTasks(token, project.id);
				tasks = apiTasks.map((t) => this.normalizeTask(t));
			} else {
				tasks = [];
			}
		} else {
			// Use local storage
			tasks = await this.todoService.getProjectTasks(userId, projectName);
		}

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, `Keine Aufgaben im Projekt "${projectName}".`);
			return;
		}

		let response = this.formatTaskList(`**Projekt: ${projectName}**`, tasks);
		if (token) {
			response += '\n\n🔄 Synchronisiert';
		}
		await this.sendReply(roomId, event, response);
	}

	private async handleStatus(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		const isLoggedIn = await this.sessionService.isLoggedIn(userId);
		const email = this.sessionService.getEmail(userId);

		let stats: { total: number; completed: number; pending: number; today: number };

		if (token) {
			// Use API service
			stats = await this.todoApiService.getStats(token);
		} else {
			// Use local storage
			stats = await this.todoService.getStats(userId);
		}

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

		const syncStatus = token ? '🔄 Synchronisiert mit todo-backend' : '💾 Lokaler Speicher';

		const response = `**Status**

👤 Angemeldet: ${isLoggedIn ? `Ja (${email})` : 'Nein'}${creditInfo}

- Offene Aufgaben: ${stats.pending}
- Heute faellig: ${stats.today}
- Erledigt: ${stats.completed}
- Gesamt: ${stats.total}

${syncStatus}
Bot: Online${!isLoggedIn ? '\n\nTipp: Mit `login email passwort` anmelden fuer Synchronisation mit todo-web' : ''}`;

		await this.sendReply(roomId, event, response);
	}

	private async handleLogin(roomId: string, event: MatrixRoomEvent, userId: string, args: string) {
		const parts = args.trim().split(/\s+/);
		if (parts.length < 2) {
			await this.sendReply(roomId, event, 'Verwendung: `login email passwort`');
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
			await this.sendReply(roomId, event, 'Konnte Hilfe nicht anpinnen (fehlende Berechtigung?)');
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

		response += `\nErledigen: \`erledigt [Nr]\` | Loeschen: \`löschen [Nr]\``;
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
