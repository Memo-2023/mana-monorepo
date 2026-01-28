import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Message, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { TodoClientService } from '../todo-client/todo-client.service';
import { UserService } from '../user/user.service';
import { Task } from '../todo-client/types';

// State for users currently in the login flow
interface LoginState {
	step: 'email' | 'password';
	email?: string;
}

@Update()
export class BotUpdate {
	private readonly logger = new Logger(BotUpdate.name);

	// Track last shown tasks per user for /done command
	private lastTaskList: Map<number, Task[]> = new Map();

	// Track users in login flow
	private loginFlow: Map<number, LoginState> = new Map();

	constructor(
		private readonly todoClient: TodoClientService,
		private readonly userService: UserService
	) {}

	private formatHelp(): string {
		return `<b>Todo Bot</b>

Verwalte deine Aufgaben direkt in Telegram.

<b>Aufgaben:</b>
/add [Text] - Neue Aufgabe erstellen
/inbox - Inbox-Aufgaben anzeigen
/today - Heutige Aufgaben
/list - Alle offenen Aufgaben
/done [Nr] - Aufgabe als erledigt markieren

<b>Projekte:</b>
/projects - Projekte anzeigen

<b>Einstellungen:</b>
/remind - Taegliche Erinnerung an/aus
/login - Account verknuepfen
/logout - Account trennen

<b>Tipp:</b> Starte mit /today fuer deine heutigen Aufgaben!`;
	}

	@Start()
	async start(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		const username = ctx.from?.username;

		if (!userId) return;

		// Ensure user exists in database
		await this.userService.ensureUser(userId, username);
		const linkedUser = await this.userService.getLinkedUser(userId);

		this.logger.log(`/start from user ${userId} (@${username})`);

		if (linkedUser) {
			await ctx.replyWithHTML(
				`<b>Willkommen zurueck!</b>\n\n` +
					`Dein Account ist verknuepft. Du kannst sofort loslegen.\n\n` +
					this.formatHelp()
			);
		} else {
			await ctx.replyWithHTML(
				`<b>Willkommen beim Todo Bot!</b>\n\n` +
					`Um Aufgaben zu verwalten, verknuepfe deinen Account:\n` +
					`/login - Mit Email/Passwort anmelden\n\n` +
					`Oder sieh dir die Hilfe an:\n` +
					`/help - Alle Befehle anzeigen`
			);
		}
	}

	@Help()
	async help(@Ctx() ctx: Context) {
		await ctx.replyWithHTML(this.formatHelp());
	}

	@Command('login')
	async login(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		await this.userService.ensureUser(userId, ctx.from?.username);

		// Check if already linked
		const linkedUser = await this.userService.getLinkedUser(userId);
		if (linkedUser) {
			await ctx.reply(
				'Dein Account ist bereits verknuepft.\n\n' +
					'Mit /logout kannst du die Verknuepfung aufheben.'
			);
			return;
		}

		// Start login flow
		this.loginFlow.set(userId, { step: 'email' });
		await ctx.reply('Bitte gib deine E-Mail-Adresse ein:');
	}

	@Command('logout')
	async logout(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const linkedUser = await this.userService.getLinkedUser(userId);
		if (!linkedUser) {
			await ctx.reply('Kein Account verknuepft.');
			return;
		}

		await this.userService.unlinkAccount(userId);
		await ctx.reply(
			'Account-Verknuepfung wurde aufgehoben.\n\nMit /login kannst du dich erneut anmelden.'
		);
	}

	@On('text')
	async onText(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId) return;

		// Check if user is in login flow
		const loginState = this.loginFlow.get(userId);
		if (!loginState) return; // Not in login flow, ignore

		// Ignore commands
		if (text.startsWith('/')) return;

		if (loginState.step === 'email') {
			// Validate email format
			if (!text.includes('@')) {
				await ctx.reply('Bitte gib eine gueltige E-Mail-Adresse ein:');
				return;
			}

			this.loginFlow.set(userId, { step: 'password', email: text.trim() });
			await ctx.reply('Bitte gib dein Passwort ein:');
		} else if (loginState.step === 'password') {
			const email = loginState.email!;
			const password = text.trim();

			// Clear login flow
			this.loginFlow.delete(userId);

			// Attempt login
			const result = await this.userService.linkAccount(userId, email, password);

			if (result.success) {
				await ctx.replyWithHTML(
					'<b>Account erfolgreich verknuepft!</b>\n\n' +
						'Du kannst jetzt Aufgaben verwalten.\n\n' +
						'Probiere /today fuer deine heutigen Aufgaben.'
				);
			} else {
				await ctx.reply(result.error || 'Anmeldung fehlgeschlagen.');
			}
		}
	}

	@Command('add')
	async addTask(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const user = await this.userService.getLinkedUser(userId);
		if (!user) {
			await ctx.reply('Bitte verknuepfe erst deinen Account mit /login');
			return;
		}

		const title = text.replace('/add', '').trim();
		if (!title) {
			await ctx.reply('Verwendung: /add Aufgabentext\n\nBeispiel: /add Einkaufen gehen');
			return;
		}

		try {
			const task = await this.todoClient.createTask(user.accessToken!, title);
			await ctx.reply(`Aufgabe erstellt: "${task.title}"`);
		} catch (error) {
			this.logger.error(`Failed to create task: ${error}`);
			await ctx.reply('Fehler beim Erstellen der Aufgabe. Bitte versuche es erneut.');
		}
	}

	@Command('inbox')
	async inboxTasks(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const user = await this.userService.getLinkedUser(userId);
		if (!user) {
			await ctx.reply('Bitte verknuepfe erst deinen Account mit /login');
			return;
		}

		try {
			const tasks = await this.todoClient.getInboxTasks(user.accessToken!);
			this.lastTaskList.set(userId, tasks);

			if (tasks.length === 0) {
				await ctx.reply('Keine Aufgaben in der Inbox.\n\nErstelle eine mit /add [Text]');
				return;
			}

			let response = `<b>Inbox (${tasks.length}):</b>\n\n`;
			tasks.slice(0, 20).forEach((task, i) => {
				const status = task.isCompleted ? '' : '';
				const priority = this.formatPriority(task.priority);
				response += `${i + 1}. ${status} ${task.title}${priority}\n`;
			});

			if (tasks.length > 20) {
				response += `\n... und ${tasks.length - 20} weitere`;
			}

			response += '\n\nAbhaken mit /done [Nr]';
			await ctx.replyWithHTML(response);
		} catch (error) {
			this.logger.error(`Failed to get inbox: ${error}`);
			await ctx.reply('Fehler beim Laden der Inbox.');
		}
	}

	@Command('today')
	async todayTasks(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const user = await this.userService.getLinkedUser(userId);
		if (!user) {
			await ctx.reply('Bitte verknuepfe erst deinen Account mit /login');
			return;
		}

		try {
			const tasks = await this.todoClient.getTodayTasks(user.accessToken!);
			this.lastTaskList.set(userId, tasks);

			if (tasks.length === 0) {
				await ctx.reply('Keine Aufgaben fuer heute!\n\nErstelle eine mit /add [Text]');
				return;
			}

			let response = `<b>Heute (${tasks.length}):</b>\n\n`;
			tasks.slice(0, 20).forEach((task, i) => {
				const status = task.isCompleted ? '' : '';
				const priority = this.formatPriority(task.priority);
				const overdue = this.isOverdue(task.dueDate) ? ' (ueberfaellig)' : '';
				response += `${i + 1}. ${status} ${task.title}${priority}${overdue}\n`;
			});

			if (tasks.length > 20) {
				response += `\n... und ${tasks.length - 20} weitere`;
			}

			response += '\n\nAbhaken mit /done [Nr]';
			await ctx.replyWithHTML(response);
		} catch (error) {
			this.logger.error(`Failed to get today tasks: ${error}`);
			await ctx.reply('Fehler beim Laden der heutigen Aufgaben.');
		}
	}

	@Command('list')
	async listTasks(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const user = await this.userService.getLinkedUser(userId);
		if (!user) {
			await ctx.reply('Bitte verknuepfe erst deinen Account mit /login');
			return;
		}

		try {
			const tasks = await this.todoClient.getAllTasks(user.accessToken!, false);
			this.lastTaskList.set(userId, tasks);

			if (tasks.length === 0) {
				await ctx.reply('Keine offenen Aufgaben.\n\nErstelle eine mit /add [Text]');
				return;
			}

			let response = `<b>Alle Aufgaben (${tasks.length}):</b>\n\n`;
			tasks.slice(0, 20).forEach((task, i) => {
				const priority = this.formatPriority(task.priority);
				const dueInfo = this.formatDueDate(task.dueDate);
				response += `${i + 1}.  ${task.title}${priority}${dueInfo}\n`;
			});

			if (tasks.length > 20) {
				response += `\n... und ${tasks.length - 20} weitere`;
			}

			response += '\n\nAbhaken mit /done [Nr]';
			await ctx.replyWithHTML(response);
		} catch (error) {
			this.logger.error(`Failed to get tasks: ${error}`);
			await ctx.reply('Fehler beim Laden der Aufgaben.');
		}
	}

	@Command('done')
	async completeTask(@Ctx() ctx: Context, @Message('text') text: string) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const user = await this.userService.getLinkedUser(userId);
		if (!user) {
			await ctx.reply('Bitte verknuepfe erst deinen Account mit /login');
			return;
		}

		const nrStr = text.replace('/done', '').trim();
		const nr = parseInt(nrStr, 10);

		if (!nrStr || isNaN(nr) || nr < 1) {
			await ctx.reply(
				'Verwendung: /done [Nr]\n\n' +
					'Zeige erst deine Aufgaben mit /today, /inbox oder /list um die Nummer zu sehen.'
			);
			return;
		}

		const tasks = this.lastTaskList.get(userId);
		if (!tasks || tasks.length === 0) {
			await ctx.reply(
				'Keine Aufgabenliste im Cache. Bitte erst /today, /inbox oder /list ausfuehren.'
			);
			return;
		}

		if (nr > tasks.length) {
			await ctx.reply(`Ungueltige Nummer. Du hast ${tasks.length} Aufgaben in der Liste.`);
			return;
		}

		const task = tasks[nr - 1];

		try {
			await this.todoClient.completeTask(user.accessToken!, task.id);
			await ctx.reply(`"${task.title}" erledigt!`);

			// Remove from cache
			tasks.splice(nr - 1, 1);
			this.lastTaskList.set(userId, tasks);
		} catch (error) {
			this.logger.error(`Failed to complete task: ${error}`);
			await ctx.reply('Fehler beim Abschliessen der Aufgabe.');
		}
	}

	@Command('projects')
	async showProjects(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		const user = await this.userService.getLinkedUser(userId);
		if (!user) {
			await ctx.reply('Bitte verknuepfe erst deinen Account mit /login');
			return;
		}

		try {
			const projects = await this.todoClient.getProjects(user.accessToken!);

			if (projects.length === 0) {
				await ctx.reply('Keine Projekte vorhanden.');
				return;
			}

			let response = `<b>Projekte (${projects.length}):</b>\n\n`;
			projects.forEach((project, i) => {
				const icon = project.icon || '';
				const archived = project.isArchived ? ' (archiviert)' : '';
				const isDefault = project.isDefault ? ' (Inbox)' : '';
				response += `${i + 1}. ${icon} ${project.name}${isDefault}${archived}\n`;
			});

			await ctx.replyWithHTML(response);
		} catch (error) {
			this.logger.error(`Failed to get projects: ${error}`);
			await ctx.reply('Fehler beim Laden der Projekte.');
		}
	}

	@Command('remind')
	async toggleReminder(@Ctx() ctx: Context) {
		const userId = ctx.from?.id;
		if (!userId) return;

		await this.userService.ensureUser(userId, ctx.from?.username);

		const newState = await this.userService.toggleDailyReminder(userId);
		const settings = await this.userService.getDailyReminderSettings(userId);

		if (newState) {
			await ctx.replyWithHTML(
				`<b>Taegliche Erinnerung aktiviert!</b>\n\n` +
					`Du erhaeltst jeden Tag um ${settings?.time || '08:00'} Uhr eine Uebersicht deiner Aufgaben.\n\n` +
					`Mit /remind wieder deaktivieren.`
			);
		} else {
			await ctx.reply('Taegliche Erinnerung deaktiviert.');
		}
	}

	private formatPriority(priority: string): string {
		switch (priority) {
			case 'urgent':
				return ' !!!';
			case 'high':
				return ' !!';
			case 'low':
				return '';
			default:
				return '';
		}
	}

	private formatDueDate(dueDate: string | null): string {
		if (!dueDate) return '';

		const date = new Date(dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date < today) {
			return ' (ueberfaellig)';
		} else if (date < tomorrow) {
			return ' (heute)';
		} else {
			const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
			return ` (${date.toLocaleDateString('de-DE', options)})`;
		}
	}

	private isOverdue(dueDate: string | null): boolean {
		if (!dueDate) return false;

		const date = new Date(dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return date < today;
	}
}
