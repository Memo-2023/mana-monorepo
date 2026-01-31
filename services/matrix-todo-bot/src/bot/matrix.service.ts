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
import { TodoService, Task } from '../todo/todo.service';
import { TranscriptionService } from '@manacore/bot-services';
import { HELP_TEXT, WELCOME_TEXT, BOT_INTRODUCTION } from '../config/configuration';

// Natural language keywords that trigger commands (German + English)
const KEYWORD_COMMANDS: { keywords: string[]; command: string }[] = [
	{ keywords: ['hilfe', 'help', 'was kannst du', 'befehle', 'commands'], command: 'help' },
	{
		keywords: ['zeige aufgaben', 'meine aufgaben', 'was muss ich', 'show tasks', 'list'],
		command: 'list',
	},
	{ keywords: ['heute', 'today', 'was steht an'], command: 'today' },
	{ keywords: ['inbox', 'eingang', 'ohne datum'], command: 'inbox' },
	{ keywords: ['projekte', 'projects'], command: 'projects' },
	{ keywords: ['status', 'verbindung', 'connection'], command: 'status' },
];

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MatrixService.name);
	private client: MatrixClient;
	private readonly homeserverUrl: string;
	private readonly accessToken: string;
	private readonly allowedRooms: string[];
	private readonly storagePath: string;

	constructor(
		private configService: ConfigService,
		private todoService: TodoService,
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
			// Ensure storage directory exists
			const storageDir = path.dirname(this.storagePath);
			if (!fs.existsSync(storageDir)) {
				fs.mkdirSync(storageDir, { recursive: true });
			}

			const storage = new SimpleFsStorageProvider(this.storagePath);
			this.client = new MatrixClient(this.homeserverUrl, this.accessToken, storage);

			// Auto-join rooms when invited
			AutojoinRoomsMixin.setupOnClient(this.client);

			// Handle room invites with introduction
			this.client.on('room.invite', async (roomId: string) => {
				this.logger.log(`Invited to room ${roomId}, joining...`);
				await this.client.joinRoom(roomId);

				// Send introduction after a short delay
				setTimeout(async () => {
					try {
						await this.sendBotIntroduction(roomId);
					} catch (error) {
						this.logger.error(`Failed to send introduction to ${roomId}:`, error);
					}
				}, 2000);
			});

			// Handle member joins for welcome message
			this.client.on('room.event', async (roomId: string, event: any) => {
				if (event.type === 'm.room.member' && event.content?.membership === 'join') {
					const userId = event.state_key;
					const botUserId = await this.client.getUserId();

					// Don't welcome the bot itself
					if (userId === botUserId) return;

					// Check if this is a new join (not just profile update)
					if (event.unsigned?.prev_content?.membership !== 'join') {
						await this.sendWelcomeMessage(roomId, userId);
					}
				}
			});

			// Set up message handler
			this.client.on('room.message', async (roomId: string, event: any) => {
				await this.handleMessage(roomId, event);
			});

			await this.client.start();
			this.logger.log(`Matrix Todo Bot connected to ${this.homeserverUrl}`);

			const userId = await this.client.getUserId();
			this.logger.log(`Bot user ID: ${userId}`);

			if (this.allowedRooms.length > 0) {
				this.logger.log(`Allowed rooms: ${this.allowedRooms.join(', ')}`);
			} else {
				this.logger.log('No room restrictions - bot will respond in all rooms');
			}
		} catch (error) {
			this.logger.error('Failed to initialize Matrix client:', error);
		}
	}

	private async handleMessage(roomId: string, event: any) {
		// Ignore messages from the bot itself
		const botUserId = await this.client.getUserId();
		if (event.sender === botUserId) return;

		// Check if room is allowed
		if (this.allowedRooms.length > 0 && !this.allowedRooms.includes(roomId)) {
			this.logger.debug(`Ignoring message from non-allowed room: ${roomId}`);
			return;
		}

		const userId = event.sender;
		const msgtype = event.content?.msgtype;

		// Handle audio/voice messages
		if (msgtype === 'm.audio' && event.content?.url) {
			await this.handleAudioMessage(roomId, event, userId);
			return;
		}

		// Only handle text messages
		if (msgtype !== 'm.text') return;

		const body = event.content.body?.trim();
		if (!body) return;

		try {
			// Check for natural language keywords first
			const keywordCommand = this.detectKeywordCommand(body);
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
				'❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
			);
		}
	}

	private detectKeywordCommand(message: string): string | null {
		const lowerMessage = message.toLowerCase().trim();

		// Only check short messages for keywords
		if (lowerMessage.length > 50) return null;

		for (const { keywords, command } of KEYWORD_COMMANDS) {
			for (const keyword of keywords) {
				if (
					lowerMessage === keyword ||
					lowerMessage.startsWith(keyword + ' ') ||
					lowerMessage.includes(keyword)
				) {
					this.logger.log(`Detected keyword "${keyword}" -> command "${command}"`);
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

	private async handleAddTask(roomId: string, event: any, userId: string, input: string) {
		if (!input.trim()) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine Aufgabe an.\n\nBeispiel: `!add Einkaufen gehen`'
			);
			return;
		}

		const { title, priority, dueDate, project } = this.todoService.parseTaskInput(input);

		const task = await this.todoService.createTask(userId, title, {
			priority,
			dueDate,
			project,
		});

		let response = `✅ Aufgabe erstellt: **${task.title}**`;

		const details: string[] = [];
		if (priority < 4) details.push(`Priorität ${priority}`);
		if (dueDate) details.push(`Datum: ${this.formatDate(dueDate)}`);
		if (project) details.push(`Projekt: ${project}`);

		if (details.length > 0) {
			response += `\n📋 ${details.join(' | ')}`;
		}

		await this.sendReply(roomId, event, response);
	}

	private async handleListTasks(roomId: string, event: any, userId: string) {
		const tasks = await this.todoService.getAllPendingTasks(userId);

		if (tasks.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine offenen Aufgaben.\n\nErstelle eine mit `!add [Aufgabe]`'
			);
			return;
		}

		const response = this.formatTaskList('📋 **Alle offenen Aufgaben:**', tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleTodayTasks(roomId: string, event: any, userId: string) {
		const tasks = await this.todoService.getTodayTasks(userId);

		if (tasks.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Aufgaben für heute.\n\nErstelle eine mit `!add Aufgabe @heute`'
			);
			return;
		}

		const response = this.formatTaskList('📅 **Aufgaben für heute:**', tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleInboxTasks(roomId: string, event: any, userId: string) {
		const tasks = await this.todoService.getInboxTasks(userId);

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, '📭 Inbox ist leer.\n\nAufgaben ohne Datum landen hier.');
			return;
		}

		const response = this.formatTaskList('📥 **Inbox (ohne Datum):**', tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleCompleteTask(roomId: string, event: any, userId: string, args: string) {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine gültige Aufgabennummer an.\n\nBeispiel: `!done 1`'
			);
			return;
		}

		const task = await this.todoService.completeTask(userId, taskNumber);

		if (!task) {
			await this.sendReply(roomId, event, `❌ Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		await this.sendReply(roomId, event, `✅ Erledigt: ~~${task.title}~~`);
	}

	private async handleDeleteTask(roomId: string, event: any, userId: string, args: string) {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib eine gültige Aufgabennummer an.\n\nBeispiel: `!delete 1`'
			);
			return;
		}

		const task = await this.todoService.deleteTask(userId, taskNumber);

		if (!task) {
			await this.sendReply(roomId, event, `❌ Aufgabe #${taskNumber} nicht gefunden.`);
			return;
		}

		await this.sendReply(roomId, event, `🗑️ Gelöscht: ${task.title}`);
	}

	private async handleProjects(roomId: string, event: any, userId: string) {
		const projects = await this.todoService.getProjects(userId);

		if (projects.length === 0) {
			await this.sendReply(
				roomId,
				event,
				'📭 Keine Projekte.\n\nErstelle eine Aufgabe mit Projekt: `!add Aufgabe #projektname`'
			);
			return;
		}

		let response = '📁 **Deine Projekte:**\n\n';
		for (const project of projects) {
			response += `• ${project.name}\n`;
		}
		response += '\nZeige Projektaufgaben mit `!project [Name]`';

		await this.sendReply(roomId, event, response);
	}

	private async handleProjectTasks(roomId: string, event: any, userId: string, args: string) {
		const projectName = args.trim();

		if (!projectName) {
			await this.sendReply(
				roomId,
				event,
				'❌ Bitte gib einen Projektnamen an.\n\nBeispiel: `!project Arbeit`'
			);
			return;
		}

		const tasks = await this.todoService.getProjectTasks(userId, projectName);

		if (tasks.length === 0) {
			await this.sendReply(roomId, event, `📭 Keine Aufgaben im Projekt "${projectName}".`);
			return;
		}

		const response = this.formatTaskList(`📁 **Projekt: ${projectName}**`, tasks);
		await this.sendReply(roomId, event, response);
	}

	private async handleStatus(roomId: string, event: any, userId: string) {
		const stats = await this.todoService.getStats(userId);

		const response = `📊 **Status**

• Offene Aufgaben: ${stats.pending}
• Heute fällig: ${stats.today}
• Erledigt: ${stats.completed}
• Gesamt: ${stats.total}

Bot: ✅ Online`;

		await this.sendReply(roomId, event, response);
	}

	private async handlePinHelp(roomId: string, event: any) {
		try {
			// Send help message
			const helpEventId = await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: HELP_TEXT,
				format: 'org.matrix.custom.html',
				formatted_body: this.markdownToHtml(HELP_TEXT),
			});

			// Pin it
			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});

			await this.sendReply(roomId, event, '📌 Hilfe wurde angepinnt!');
		} catch (error) {
			this.logger.error('Failed to pin help:', error);
			await this.sendReply(
				roomId,
				event,
				'❌ Konnte Hilfe nicht anpinnen (fehlende Berechtigung?)'
			);
		}
	}

	private formatTaskList(header: string, tasks: Task[]): string {
		let response = `${header}\n\n`;

		tasks.forEach((task, index) => {
			const num = index + 1;
			const priority = task.priority < 4 ? `❗`.repeat(4 - task.priority) : '';
			const date = task.dueDate ? ` 📅 ${this.formatDate(task.dueDate)}` : '';
			const project = task.project ? ` 📁 ${task.project}` : '';

			response += `**${num}.** ${task.title}${priority}${date}${project}\n`;
		});

		response += `\n✅ Erledigen: \`!done [Nr]\` | 🗑️ Löschen: \`!delete [Nr]\``;
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

	private async sendReply(roomId: string, event: any, message: string) {
		const reply = RichReply.createFor(roomId, event, message, this.markdownToHtml(message));
		reply.msgtype = 'm.text';
		await this.client.sendMessage(roomId, reply);
	}

	private async sendWelcomeMessage(roomId: string, userId: string) {
		try {
			await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: WELCOME_TEXT,
				format: 'org.matrix.custom.html',
				formatted_body: this.markdownToHtml(WELCOME_TEXT),
			});
			this.logger.log(`Sent welcome message to ${userId} in ${roomId}`);
		} catch (error) {
			this.logger.error(`Failed to send welcome message: ${error}`);
		}
	}

	private async sendBotIntroduction(roomId: string) {
		await this.client.sendMessage(roomId, {
			msgtype: 'm.text',
			body: BOT_INTRODUCTION,
			format: 'org.matrix.custom.html',
			formatted_body: this.markdownToHtml(BOT_INTRODUCTION),
		});

		// Try to pin the help message
		try {
			const helpEventId = await this.client.sendMessage(roomId, {
				msgtype: 'm.text',
				body: HELP_TEXT,
				format: 'org.matrix.custom.html',
				formatted_body: this.markdownToHtml(HELP_TEXT),
			});

			await this.client.sendStateEvent(roomId, 'm.room.pinned_events', '', {
				pinned: [helpEventId],
			});
			this.logger.log(`Pinned help message in ${roomId}`);
		} catch (error) {
			this.logger.debug(`Could not pin help (might lack permissions): ${error}`);
		}
	}

	private async handleAudioMessage(roomId: string, event: any, userId: string) {
		try {
			await this.sendReply(roomId, event, 'Verarbeite Sprachnotiz...');

			// Download audio from Matrix
			const mxcUrl = event.content.url;
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

			// Parse the transcription as a task input
			const { title, priority, dueDate, project } = this.todoService.parseTaskInput(transcription);

			// Create the task
			const task = await this.todoService.createTask(userId, title, {
				priority,
				dueDate,
				project,
			});

			let responseText = `Transkription: "${transcription}"\n\n✅ Aufgabe erstellt: **${task.title}**`;

			const details: string[] = [];
			if (priority < 4) details.push(`Prioritat ${priority}`);
			if (dueDate) details.push(`Datum: ${this.formatDate(dueDate)}`);
			if (project) details.push(`Projekt: ${project}`);

			if (details.length > 0) {
				responseText += `\n${details.join(' | ')}`;
			}

			await this.sendReply(roomId, event, responseText);
		} catch (error) {
			this.logger.error('Audio processing failed:', error);
			const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
			await this.sendReply(roomId, event, `Fehler bei der Verarbeitung: ${errorMsg}`);
		}
	}

	private markdownToHtml(text: string): string {
		return text
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/~~(.+?)~~/g, '<del>$1</del>')
			.replace(/`(.+?)`/g, '<code>$1</code>')
			.replace(/\n/g, '<br>');
	}
}
