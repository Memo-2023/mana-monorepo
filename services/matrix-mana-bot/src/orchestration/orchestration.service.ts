import { Injectable, Logger } from '@nestjs/common';
import { AiService, TodoService, CalendarService } from '@manacore/bot-services';
import { CommandContext } from '../bot/command-router.service';

@Injectable()
export class OrchestrationService {
	private readonly logger = new Logger(OrchestrationService.name);

	constructor(
		private aiService: AiService,
		private todoService: TodoService,
		private calendarService: CalendarService
	) {}

	/**
	 * !summary - AI-powered daily summary combining todos, calendar, etc.
	 */
	async dailySummary(ctx: CommandContext): Promise<string> {
		this.logger.log(`Generating daily summary for ${ctx.userId}`);

		// Gather data from all services in parallel
		const [todoStats, todayTodos, todayEvents] = await Promise.all([
			this.todoService.getStats(ctx.userId),
			this.todoService.getTodayTasks(ctx.userId),
			this.calendarService.getTodayEvents(ctx.userId),
		]);

		// Build context for AI
		const todoList = todayTodos.map((t) => t.title).join(', ') || 'keine';
		const eventList = todayEvents.map((e) => e.title).join(', ') || 'keine';

		const prompt = `Du bist ein freundlicher Assistent. Erstelle eine kurze, motivierende Tages-Zusammenfassung auf Deutsch (max 5 Sätze).

Daten für heute:
- Offene Todos: ${todoStats.pending} (davon heute fällig: ${todoStats.today})
- Erledigte Todos: ${todoStats.completed}
- Heutige Todos: ${todoList}
- Heutige Termine: ${eventList}

Fasse das freundlich und motivierend zusammen. Gib konkrete Tipps falls viele Aufgaben offen sind.`;

		try {
			const summary = await this.aiService.chatSimple(ctx.userId, prompt);

			return `**📊 Deine Tages-Zusammenfassung**

${summary}

---
*Generiert mit AI*`;
		} catch (error) {
			// Fallback without AI
			return `**📊 Deine Tages-Übersicht**

**Todos:**
• Offen: ${todoStats.pending}
• Heute fällig: ${todoStats.today}
• Erledigt: ${todoStats.completed}

**Termine heute:** ${eventList}

---
*AI-Zusammenfassung nicht verfügbar*`;
		}
	}

	/**
	 * !ai-todo - AI extracts todos from text (meeting notes, etc.)
	 */
	async aiToTodos(ctx: CommandContext, text: string): Promise<string> {
		if (!text.trim()) {
			return `**Verwendung:** \`!ai-todo [Text]\`

**Beispiel:**
\`!ai-todo Im Meeting haben wir besprochen: Website redesign bis Freitag, API Dokumentation aktualisieren, und Peter soll das Budget prüfen.\`

Die AI extrahiert automatisch Aufgaben und erstellt Todos.`;
		}

		this.logger.log(`Extracting todos from text for ${ctx.userId}`);

		const prompt = `Extrahiere alle Aufgaben aus folgendem Text.
Antworte NUR mit einem JSON-Array im Format:
[{"text": "Aufgabentext", "priority": 1-4}]

Prioritäten:
1 = Dringend/Wichtig
2 = Wichtig
3 = Normal
4 = Niedrig

Text: ${text}`;

		try {
			const response = await this.aiService.chatSimple(ctx.userId, prompt);

			// Parse JSON from response
			const jsonMatch = response.match(/\[[\s\S]*?\]/);
			if (!jsonMatch) {
				return '❌ Konnte keine Aufgaben extrahieren. Versuche es mit klarerem Text.';
			}

			const todos = JSON.parse(jsonMatch[0]) as { text: string; priority?: number }[];

			if (todos.length === 0) {
				return '❌ Keine Aufgaben im Text gefunden.';
			}

			// Create todos
			const created: string[] = [];
			for (const todo of todos) {
				const task = await this.todoService.createTask(ctx.userId, {
					title: todo.text,
					priority: todo.priority || 4,
				});
				created.push(task.title);
			}

			this.logger.log(`Created ${created.length} todos from AI extraction for ${ctx.userId}`);

			const lines = created.map((t, i) => `${i + 1}. ${t}`).join('\n');
			return `✅ **${created.length} Todos erstellt:**

${lines}

Zeige alle mit \`!list\``;
		} catch (error) {
			this.logger.error(`AI todo extraction failed:`, error);
			return `❌ Fehler bei der Extraktion: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
		}
	}

	/**
	 * Create a todo with a calendar reminder
	 */
	async todoWithReminder(ctx: CommandContext, input: string): Promise<string> {
		// Parse: "Aufgabe @morgen 14:00"
		const parsed = this.todoService.parseTaskInput(input);

		// Create todo
		const task = await this.todoService.createTask(ctx.userId, parsed);

		// If date was specified, create calendar event as reminder
		if (parsed.dueDate) {
			await this.calendarService.createEvent(ctx.userId, {
				title: `📋 Todo: ${task.title}`,
				startTime: new Date(parsed.dueDate),
				isAllDay: true,
			});
		}

		let response = `✅ Todo erstellt: **${task.title}**`;
		if (parsed.dueDate) {
			response += `\n📅 Erinnerung im Kalender eingetragen`;
		}

		return response;
	}
}
