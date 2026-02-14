import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	BaseMatrixService,
	MatrixBotConfig,
	MatrixRoomEvent,
	KeywordCommandDetector,
	COMMON_KEYWORDS,
	handleCreditCommand,
	handleGiftCommand,
	type CreditCommandsHost,
	type GiftCommandsHost,
} from '@manacore/matrix-bot-common';
import {
	TranscriptionService,
	SessionService,
	CreditService,
	GiftService,
	TodoApiService,
	Task as ApiTask,
	I18nService,
	Language,
	LANGUAGE_NAMES,
} from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

// Credit cost for task creation (micro-credits)
const TASK_CREATE_CREDITS = 0.02;

// Alias for consistency
type Task = ApiTask;

@Injectable()
export class MatrixService
	extends BaseMatrixService
	implements CreditCommandsHost, GiftCommandsHost
{
	// Expose services for credit and gift commands mixins
	public creditService: CreditService;
	public giftService: GiftService;
	public i18nService: I18nService;
	public sessionService: SessionService;
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
			{ keywords: ['credits', 'guthaben', 'kontostand'], command: 'credits' },
			{ keywords: ['packages', 'pakete', 'preise'], command: 'packages' },
			{ keywords: ['kaufen', 'buy'], command: 'buy' },
		],
		{ partialMatch: true }
	);

	constructor(
		configService: ConfigService,
		private todoApiService: TodoApiService,
		private transcriptionService: TranscriptionService,
		sessionService: SessionService,
		creditService: CreditService,
		giftService: GiftService,
		i18nService: I18nService
	) {
		super(configService);
		// Assign to public properties for credit and gift commands mixins
		this.sessionService = sessionService;
		this.creditService = creditService;
		this.giftService = giftService;
		this.i18nService = i18nService;
	}

	// ============================================================================
	// CreditCommandsHost interface implementation
	// ============================================================================

	/**
	 * Send a credit message (delegates to protected sendMessage)
	 */
	async sendCreditMessage(roomId: string, message: string): Promise<void> {
		await this.sendMessage(roomId, message);
	}

	/**
	 * Send a credit reply (delegates to protected sendReply)
	 */
	async sendCreditReply(roomId: string, event: MatrixRoomEvent, message: string): Promise<void> {
		await this.sendReply(roomId, event, message);
	}

	// ============================================================================
	// GiftCommandsHost interface implementation
	// ============================================================================

	/**
	 * Send a gift message (delegates to protected sendMessage)
	 */
	async sendGiftMessage(roomId: string, message: string): Promise<void> {
		await this.sendMessage(roomId, message);
	}

	/**
	 * Send a gift reply (delegates to protected sendReply)
	 */
	async sendGiftReply(roomId: string, event: MatrixRoomEvent, message: string): Promise<void> {
		await this.sendReply(roomId, event, message);
	}

	// ============================================================================
	// Private helpers
	// ============================================================================

	/**
	 * Check if user is logged in and has a valid token for API access
	 */
	private async getToken(userId: string): Promise<string | null> {
		return this.sessionService.getToken(userId);
	}

	/**
	 * Require login - returns token or sends login prompt and returns null
	 */
	private async requireLogin(
		roomId: string,
		event: MatrixRoomEvent,
		userId: string
	): Promise<string | null> {
		const token = await this.getToken(userId);
		if (!token) {
			await this.sendReply(
				roomId,
				event,
				'🔐 **Login erforderlich**\n\n' +
					'Um Aufgaben zu verwalten, melde dich bitte an:\n\n' +
					'`login deine@email.de deinpasswort`\n\n' +
					'Deine Aufgaben werden dann mit der Todo-App synchronisiert.'
			);
			return null;
		}
		return token;
	}

	/**
	 * Normalize task from API format
	 */
	private normalizeTask(task: ApiTask): Task {
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
		// Credit commands
		'credits',
		'guthaben',
		'packages',
		'pakete',
		'buy',
		'kaufen',
		// Gift commands
		'geschenk',
		'gift',
		'einloesen',
		'redeem',
		'meine-geschenke',
		'my-gifts',
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
			// Require login for audio messages
			const token = await this.requireLogin(roomId, event, sender);
			if (!token) return;

			await this.sendReply(roomId, event, 'Verarbeite Sprachnotiz...');

			// Download audio from Matrix using authenticated API
			const mxcUrl = content.url;
			this.logger.log(`Downloading audio from ${mxcUrl}`);

			const buffer = await this.downloadMedia(mxcUrl);

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

			// Check credits
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
			const task = this.normalizeTask(apiTask);
			task.project = project;

			let responseText = `Aufgabe erstellt: **${task.title}**`;

			const details: string[] = [];
			if (task.priority < 4) details.push(`Priorität ${task.priority}`);
			if (task.dueDate) details.push(`${this.formatDate(task.dueDate)}`);
			if (task.project) details.push(`#${task.project}`);

			if (details.length > 0) {
				responseText += ` · ${details.join(' · ')}`;
			}

			await this.sendMessage(roomId, responseText);
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
		// Handle credit commands first (credits, packages, buy)
		if (await handleCreditCommand(this, roomId, event, userId, command, args)) {
			return;
		}

		// Handle gift commands (geschenk, einloesen, meine-geschenke)
		if (await handleGiftCommand(this, roomId, event, userId, command, args)) {
			return;
		}

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

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		// Check credits
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
		const task = this.normalizeTask(apiTask);
		task.project = project; // Note: project handling via API needs project ID lookup

		let response = `Aufgabe erstellt: **${task.title}**`;

		const details: string[] = [];
		if (task.priority < 4) details.push(`Priorität ${task.priority}`);
		if (task.dueDate) details.push(`${this.formatDate(task.dueDate)}`);
		if (task.project) details.push(`#${task.project}`);

		if (details.length > 0) {
			response += ` · ${details.join(' · ')}`;
		}

		await this.sendMessage(roomId, response);
	}

	private async handleListTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const apiTasks = await this.todoApiService.getTasks(token, { completed: false });
		const tasks = apiTasks.map((t) => this.normalizeTask(t));

		if (tasks.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'Keine offenen Aufgaben.\n\nErstelle eine mit `neu [Aufgabe]`'
			);
			return;
		}

		const response = this.formatTaskList('**Alle offenen Aufgaben:**', tasks);
		await this.sendMessage(roomId, response);
	}

	private async handleTodayTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const apiTodayTasks = await this.todoApiService.getTodayTasks(token);
		const apiInboxTasks = await this.todoApiService.getInboxTasks(token);
		const todayTasks = apiTodayTasks.map((t) => this.normalizeTask(t));
		const inboxTasks = apiInboxTasks.map((t) => this.normalizeTask(t));

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

		await this.sendMessage(roomId, response);
	}

	private async handleInboxTasks(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const apiTasks = await this.todoApiService.getInboxTasks(token);
		const tasks = apiTasks.map((t) => this.normalizeTask(t));

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, 'Inbox ist leer.\n\nAufgaben ohne Datum landen hier.');
			return;
		}

		const response = this.formatTaskList('**Inbox (ohne Datum):**', tasks);
		await this.sendMessage(roomId, response);
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

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		let task: Task | null = null;

		// Use API service - need to get task list first to find task by index
		const apiTasks = await this.todoApiService.getTasks(token, { completed: false });
		if (taskNumber > 0 && taskNumber <= apiTasks.length) {
			const targetTask = apiTasks[taskNumber - 1];
			const completedTask = await this.todoApiService.completeTask(token, targetTask.id);
			if (completedTask) {
				task = this.normalizeTask(completedTask);
			}
		}

		if (!task) {
			await this.sendReply(roomId, event, `Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		await this.sendMessage(roomId, `✓ ~~${task.title}~~`);
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

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		let task: Task | null = null;

		// Use API service - need to get task list first to find task by index
		const apiTasks = await this.todoApiService.getTasks(token, { completed: false });
		if (taskNumber > 0 && taskNumber <= apiTasks.length) {
			const targetTask = apiTasks[taskNumber - 1];
			const deleted = await this.todoApiService.deleteTask(token, targetTask.id);
			if (deleted) {
				task = this.normalizeTask(targetTask);
			}
		}

		if (!task) {
			await this.sendReply(roomId, event, `Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		await this.sendMessage(roomId, `🗑️ ${task.title}`);
	}

	private async handleProjects(roomId: string, event: MatrixRoomEvent, userId: string) {
		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		const projects = await this.todoApiService.getProjects(token);

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

		await this.sendMessage(roomId, response);
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

		// Require login
		const token = await this.requireLogin(roomId, event, userId);
		if (!token) return;

		let tasks: Task[] = [];

		// Use API service - need to find project ID first
		const projects = await this.todoApiService.getProjects(token);
		const project = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase());
		if (project) {
			const apiTasks = await this.todoApiService.getProjectTasks(token, project.id);
			tasks = apiTasks.map((t) => this.normalizeTask(t));
		}

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, `Keine Aufgaben im Projekt "${projectName}".`);
			return;
		}

		const response = this.formatTaskList(`**Projekt: ${projectName}**`, tasks);
		await this.sendMessage(roomId, response);
	}

	private async handleStatus(roomId: string, event: MatrixRoomEvent, userId: string) {
		const token = await this.getToken(userId);
		const isLoggedIn = await this.sessionService.isLoggedIn(userId);
		const email = this.sessionService.getEmail(userId);

		if (token) {
			const stats = await this.todoApiService.getStats(token);
			const response = `**Status**

👤 ${email}

- Offen: ${stats.pending}
- Heute: ${stats.today}
- Erledigt: ${stats.completed}`;

			await this.sendMessage(roomId, response);
		} else {
			const response = `**Status**

🔐 Nicht angemeldet

\`login email passwort\``;

			await this.sendMessage(roomId, response);
		}
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
