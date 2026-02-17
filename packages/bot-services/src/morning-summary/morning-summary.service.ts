import { Injectable, Logger, Optional } from '@nestjs/common';
import { CalendarApiService } from '../calendar/calendar-api.service.js';
import { TodoApiService } from '../todo/todo-api.service.js';
import { ContactsApiService } from '../contacts/contacts-api.service.js';
import { PlantaApiService } from '../planta/planta-api.service.js';
import { WeatherService } from '../weather/weather.service.js';
import { MorningPreferencesService } from './preferences.service.js';
import { MorningSummaryData, DAY_NAMES_DE, MONTH_NAMES_DE } from './types.js';
import { Task } from '../todo/types.js';

/**
 * Morning Summary Service
 *
 * Aggregates data from all sources to generate a comprehensive morning summary.
 *
 * @example
 * ```typescript
 * // Generate summary for a user
 * const summary = await morningSummaryService.generateSummary(matrixUserId, token);
 * const formatted = morningSummaryService.formatSummary(summary, 'detailed');
 * ```
 */
@Injectable()
export class MorningSummaryService {
	private readonly logger = new Logger(MorningSummaryService.name);

	constructor(
		@Optional() private calendarService: CalendarApiService,
		@Optional() private todoService: TodoApiService,
		@Optional() private contactsService: ContactsApiService,
		@Optional() private plantaService: PlantaApiService,
		@Optional() private weatherService: WeatherService,
		private preferencesService: MorningPreferencesService
	) {
		this.logger.log('Morning Summary Service initialized');
	}

	/**
	 * Generate a complete morning summary for a user
	 */
	async generateSummary(matrixUserId: string, token: string): Promise<MorningSummaryData> {
		const prefs = await this.preferencesService.getPreferences(matrixUserId);

		// Fetch all data in parallel
		const [events, tasks, birthdays, plants, weather] = await Promise.all([
			this.fetchEvents(token),
			this.fetchTasks(token),
			prefs.includeBirthdays ? this.fetchBirthdays(token) : Promise.resolve([]),
			prefs.includePlants ? this.fetchPlants(token) : Promise.resolve([]),
			prefs.includeWeather && prefs.location
				? this.fetchWeather(prefs.location)
				: Promise.resolve(null),
		]);

		// Separate today's tasks from overdue tasks
		const today = new Date().toISOString().split('T')[0];
		const todayTasks = tasks.filter((t) => !t.completed && (t.dueDate === today || !t.dueDate));
		const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today);

		return {
			events,
			tasks: todayTasks,
			overdueTasks,
			birthdays,
			plants,
			weather,
			generatedAt: new Date(),
		};
	}

	/**
	 * Format summary for display
	 */
	formatSummary(data: MorningSummaryData, format: 'compact' | 'detailed' = 'detailed'): string {
		const today = new Date();
		const dayName = DAY_NAMES_DE[today.getDay()];
		const day = today.getDate();
		const month = MONTH_NAMES_DE[today.getMonth()];
		const year = today.getFullYear();

		if (format === 'compact') {
			return this.formatCompact(data, dayName, day, month);
		}

		return this.formatDetailed(data, dayName, day, month, year);
	}

	/**
	 * Format as compact summary
	 */
	private formatCompact(
		data: MorningSummaryData,
		dayName: string,
		day: number,
		month: string
	): string {
		const parts: string[] = [
			`**Guten Morgen!** (${dayName.slice(0, 2)}, ${day}. ${month.slice(0, 3)}.)`,
		];

		const summaryParts: string[] = [];

		// Weather
		if (data.weather) {
			summaryParts.push(
				`${Math.round(data.weather.temperature)}°C ${data.weather.weatherDescription.toLowerCase()}`
			);
		}

		// Events
		if (data.events.length > 0) {
			summaryParts.push(`${data.events.length} Termine`);
		}

		// Tasks
		if (data.tasks.length > 0) {
			summaryParts.push(`${data.tasks.length} Aufgaben`);
		}

		// Overdue
		if (data.overdueTasks.length > 0) {
			summaryParts.push(`${data.overdueTasks.length} ueberfaellig`);
		}

		if (summaryParts.length > 0) {
			parts.push(summaryParts.join(' | '));
		}

		// Birthdays & Plants
		const extraParts: string[] = [];
		if (data.birthdays.length > 0) {
			const names = data.birthdays.map((b) => {
				const name = b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim();
				const shortName =
					name.split(' ')[0] + (name.split(' ')[1] ? ` ${name.split(' ')[1][0]}.` : '');
				return `${shortName}${b.age ? ` (${b.age})` : ''}`;
			});
			extraParts.push(`Geburtstag: ${names.join(', ')}`);
		}

		if (data.plants.length > 0) {
			extraParts.push(`${data.plants.length} Pflanzen giessen`);
		}

		if (extraParts.length > 0) {
			parts.push(extraParts.join(' | '));
		}

		return parts.join('\n');
	}

	/**
	 * Format as detailed summary
	 */
	private formatDetailed(
		data: MorningSummaryData,
		dayName: string,
		day: number,
		month: string,
		year: number
	): string {
		const sections: string[] = [`**Guten Morgen!** (${dayName}, ${day}. ${month} ${year})`, ''];

		// Weather
		if (data.weather && this.weatherService) {
			sections.push(this.weatherService.formatWeather(data.weather, 'detailed'));
			sections.push('');
		}

		// Events
		if (data.events.length > 0) {
			sections.push(`**Termine heute (${data.events.length})**`);
			for (const event of data.events.slice(0, 5)) {
				const time = event.isAllDay
					? 'Ganztaegig'
					: new Date(event.startTime).toLocaleTimeString('de-DE', {
							hour: '2-digit',
							minute: '2-digit',
						});
				sections.push(`• ${time} ${event.title}`);
			}
			if (data.events.length > 5) {
				sections.push(`  _... und ${data.events.length - 5} weitere_`);
			}
			sections.push('');
		}

		// Tasks
		if (data.tasks.length > 0) {
			sections.push(`**Aufgaben heute (${data.tasks.length})**`);
			for (const task of data.tasks.slice(0, 5)) {
				const priority = task.priority < 4 ? ' ❗'.repeat(4 - task.priority) : '';
				sections.push(`• ${task.title}${priority}`);
			}
			if (data.tasks.length > 5) {
				sections.push(`  _... und ${data.tasks.length - 5} weitere_`);
			}
			sections.push('');
		}

		// Overdue
		if (data.overdueTasks.length > 0) {
			sections.push(`**Ueberfaellig (${data.overdueTasks.length})**`);
			for (const task of data.overdueTasks.slice(0, 3)) {
				const daysOverdue = this.getDaysOverdue(task.dueDate!);
				const overdueText = daysOverdue === 1 ? 'seit gestern' : `seit ${daysOverdue} Tagen`;
				sections.push(`• ${task.title} (${overdueText})`);
			}
			if (data.overdueTasks.length > 3) {
				sections.push(`  _... und ${data.overdueTasks.length - 3} weitere_`);
			}
			sections.push('');
		}

		// Birthdays
		if (data.birthdays.length > 0) {
			sections.push('**Geburtstage** 🎂');
			for (const birthday of data.birthdays) {
				const name =
					birthday.displayName || `${birthday.firstName || ''} ${birthday.lastName || ''}`.trim();
				const ageText = birthday.age ? ` wird ${birthday.age}` : '';
				sections.push(`• ${name}${ageText}`);
			}
			sections.push('');
		}

		// Plants
		if (data.plants.length > 0) {
			sections.push('**Pflanzen giessen** 🌱');
			const overdue = data.plants.filter((p) => p.isOverdue);
			const today = data.plants.filter((p) => !p.isOverdue);

			for (const plant of overdue) {
				sections.push(`• ${plant.plantName} (ueberfaellig!)`);
			}
			for (const plant of today) {
				sections.push(`• ${plant.plantName}`);
			}
			sections.push('');
		}

		// Footer
		sections.push('---');
		sections.push('Einstellungen: `!morning-settings`');

		return sections.join('\n');
	}

	// ===== Data Fetching =====

	private async fetchEvents(token: string) {
		if (!this.calendarService) return [];
		try {
			return await this.calendarService.getTodayEvents(token);
		} catch (error) {
			this.logger.error('Failed to fetch events:', error);
			return [];
		}
	}

	private async fetchTasks(token: string): Promise<Task[]> {
		if (!this.todoService) return [];
		try {
			// Get all pending tasks
			return await this.todoService.getTasks(token, { completed: false });
		} catch (error) {
			this.logger.error('Failed to fetch tasks:', error);
			return [];
		}
	}

	private async fetchBirthdays(token: string) {
		if (!this.contactsService) return [];
		try {
			return await this.contactsService.getBirthdaysToday(token);
		} catch (error) {
			this.logger.error('Failed to fetch birthdays:', error);
			return [];
		}
	}

	private async fetchPlants(token: string) {
		if (!this.plantaService) return [];
		try {
			return await this.plantaService.getPlantsNeedingWater(token);
		} catch (error) {
			this.logger.error('Failed to fetch plants:', error);
			return [];
		}
	}

	private async fetchWeather(location: string) {
		if (!this.weatherService) return null;
		try {
			return await this.weatherService.getWeather(location);
		} catch (error) {
			this.logger.error('Failed to fetch weather:', error);
			return null;
		}
	}

	// ===== Helpers =====

	private getDaysOverdue(dueDate: string): number {
		const due = new Date(dueDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		due.setHours(0, 0, 0, 0);
		return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
	}
}
