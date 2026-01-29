import { Injectable, Logger } from '@nestjs/common';
import { TodoService, Task } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';

@Injectable()
export class TodoHandler {
	private readonly logger = new Logger(TodoHandler.name);

	constructor(private todoService: TodoService) {}

	async create(ctx: CommandContext, input: string): Promise<string> {
		if (!input.trim()) {
			return '❌ Bitte gib eine Aufgabe an.\n\nBeispiel: `!todo Einkaufen gehen`';
		}

		const parsed = this.todoService.parseTaskInput(input);
		const task = await this.todoService.createTask(ctx.userId, parsed);

		let response = `✅ Aufgabe erstellt: **${task.title}**`;

		const details: string[] = [];
		if (parsed.priority < 4) details.push(`Priorität ${parsed.priority}`);
		if (parsed.dueDate) details.push(`Datum: ${this.formatDate(parsed.dueDate)}`);
		if (parsed.project) details.push(`Projekt: ${parsed.project}`);

		if (details.length > 0) {
			response += `\n📋 ${details.join(' | ')}`;
		}

		this.logger.log(`Created task "${task.title}" for ${ctx.userId}`);
		return response;
	}

	async list(ctx: CommandContext): Promise<string> {
		const tasks = await this.todoService.getAllPendingTasks(ctx.userId);

		if (tasks.length === 0) {
			return '📭 Keine offenen Aufgaben.\n\nErstelle eine mit `!todo [Aufgabe]`';
		}

		return this.formatTaskList('📋 **Alle offenen Aufgaben:**', tasks);
	}

	async today(ctx: CommandContext): Promise<string> {
		const tasks = await this.todoService.getTodayTasks(ctx.userId);

		if (tasks.length === 0) {
			return '📭 Keine Aufgaben für heute.\n\nErstelle eine mit `!todo Aufgabe @heute`';
		}

		return this.formatTaskList('📅 **Aufgaben für heute:**', tasks);
	}

	async inbox(ctx: CommandContext): Promise<string> {
		const tasks = await this.todoService.getInboxTasks(ctx.userId);

		if (tasks.length === 0) {
			return '📭 Inbox ist leer.\n\nAufgaben ohne Datum landen hier.';
		}

		return this.formatTaskList('📥 **Inbox (ohne Datum):**', tasks);
	}

	async complete(ctx: CommandContext, args: string): Promise<string> {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			return '❌ Bitte gib eine gültige Aufgabennummer an.\n\nBeispiel: `!done 1`';
		}

		const task = await this.todoService.completeTask(ctx.userId, taskNumber);

		if (!task) {
			return `❌ Aufgabe #${taskNumber} nicht gefunden.`;
		}

		this.logger.log(`Completed task "${task.title}" for ${ctx.userId}`);
		return `✅ Erledigt: ~~${task.title}~~`;
	}

	async delete(ctx: CommandContext, args: string): Promise<string> {
		const taskNumber = parseInt(args.trim());

		if (isNaN(taskNumber) || taskNumber < 1) {
			return '❌ Bitte gib eine gültige Aufgabennummer an.\n\nBeispiel: `!delete 1`';
		}

		const task = await this.todoService.deleteTask(ctx.userId, taskNumber);

		if (!task) {
			return `❌ Aufgabe #${taskNumber} nicht gefunden.`;
		}

		this.logger.log(`Deleted task "${task.title}" for ${ctx.userId}`);
		return `🗑️ Gelöscht: ${task.title}`;
	}

	async projects(ctx: CommandContext): Promise<string> {
		const projectList = await this.todoService.getProjects(ctx.userId);

		if (projectList.length === 0) {
			return '📭 Keine Projekte.\n\nErstelle eine Aufgabe mit Projekt: `!todo Aufgabe #projektname`';
		}

		let response = '📁 **Deine Projekte:**\n\n';
		for (const project of projectList) {
			response += `• ${project.name}\n`;
		}
		response += '\nZeige Projektaufgaben mit `!project [Name]`';

		return response;
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
}
