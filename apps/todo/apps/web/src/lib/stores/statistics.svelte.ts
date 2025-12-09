/**
 * Statistics Store - Calculates task statistics using Svelte 5 runes
 */

import type { Task, TaskPriority, Project } from '@todo/shared';
import {
	startOfDay,
	startOfWeek,
	endOfWeek,
	subDays,
	subWeeks,
	format,
	differenceInDays,
	isToday,
	isSameDay,
	parseISO,
	eachDayOfInterval,
} from 'date-fns';
import { de } from 'date-fns/locale';

// Types
export interface DailyCompletion {
	date: string;
	count: number;
	dayOfWeek: number;
}

export interface WeeklyData {
	week: string;
	weekStart: Date;
	completedCount: number;
	storyPoints: number;
}

export interface PriorityBreakdown {
	priority: TaskPriority;
	count: number;
	percentage: number;
	color: string;
}

export interface ProjectProgress {
	projectId: string | null;
	projectName: string;
	projectColor: string;
	total: number;
	completed: number;
	inProgress: number;
	percentage: number;
}

export interface DayProductivity {
	day: string;
	dayIndex: number;
	avgCompletions: number;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	low: '#10B981',
	medium: '#F59E0B',
	high: '#F97316',
	urgent: '#EF4444',
};

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// State
let tasks = $state<Task[]>([]);
let projects = $state<Project[]>([]);

export const statisticsStore = {
	// Setters
	setTasks(newTasks: Task[]) {
		tasks = newTasks;
	},

	setProjects(newProjects: Project[]) {
		projects = newProjects;
	},

	// Quick Stats
	get totalTasks() {
		return tasks.length;
	},

	get completedTasks() {
		return tasks.filter((t) => t.isCompleted).length;
	},

	get activeTasks() {
		return tasks.filter((t) => !t.isCompleted).length;
	},

	get overdueTasks() {
		const today = startOfDay(new Date());
		return tasks.filter((t) => {
			if (t.isCompleted || !t.dueDate) return false;
			const dueDate = startOfDay(new Date(t.dueDate));
			return dueDate < today;
		}).length;
	},

	get completedToday() {
		return tasks.filter((t) => {
			if (!t.isCompleted || !t.completedAt) return false;
			return isToday(new Date(t.completedAt));
		}).length;
	},

	get completedThisWeek() {
		const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
		const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
		return tasks.filter((t) => {
			if (!t.isCompleted || !t.completedAt) return false;
			const completedDate = new Date(t.completedAt);
			return completedDate >= weekStart && completedDate <= weekEnd;
		}).length;
	},

	get storyPointsThisWeek() {
		const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
		const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
		return tasks
			.filter((t) => {
				if (!t.isCompleted || !t.completedAt) return false;
				const completedDate = new Date(t.completedAt);
				return completedDate >= weekStart && completedDate <= weekEnd;
			})
			.reduce((sum, t) => sum + (t.metadata?.storyPoints || 0), 0);
	},

	get completionRate() {
		if (tasks.length === 0) return 0;
		return Math.round((this.completedTasks / tasks.length) * 100);
	},

	// Activity Heatmap (last 6 months)
	get activityHeatmap(): DailyCompletion[] {
		const endDate = new Date();
		const startDate = subDays(endDate, 180); // ~6 months

		// Count completions per day
		const completionMap = new Map<string, number>();

		tasks.forEach((t) => {
			if (t.isCompleted && t.completedAt) {
				const dateKey = format(new Date(t.completedAt), 'yyyy-MM-dd');
				completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
			}
		});

		// Generate all days
		const days = eachDayOfInterval({ start: startDate, end: endDate });

		return days.map((day) => {
			const dateKey = format(day, 'yyyy-MM-dd');
			return {
				date: dateKey,
				count: completionMap.get(dateKey) || 0,
				dayOfWeek: day.getDay(),
			};
		});
	},

	// Weekly Trend (last 4 weeks)
	get weeklyTrend(): { date: string; count: number; dayName: string }[] {
		const endDate = new Date();
		const startDate = subDays(endDate, 27); // Last 4 weeks

		const completionMap = new Map<string, number>();

		tasks.forEach((t) => {
			if (t.isCompleted && t.completedAt) {
				const completedDate = new Date(t.completedAt);
				if (completedDate >= startDate && completedDate <= endDate) {
					const dateKey = format(completedDate, 'yyyy-MM-dd');
					completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
				}
			}
		});

		const days = eachDayOfInterval({ start: startDate, end: endDate });

		return days.map((day) => {
			const dateKey = format(day, 'yyyy-MM-dd');
			return {
				date: dateKey,
				count: completionMap.get(dateKey) || 0,
				dayName: DAY_NAMES[day.getDay()],
			};
		});
	},

	// Priority Breakdown
	get priorityBreakdown(): PriorityBreakdown[] {
		const activeTasks = tasks.filter((t) => !t.isCompleted);
		const total = activeTasks.length;

		const counts: Record<TaskPriority, number> = {
			low: 0,
			medium: 0,
			high: 0,
			urgent: 0,
		};

		activeTasks.forEach((t) => {
			const priority = (t.priority as TaskPriority) || 'medium';
			counts[priority]++;
		});

		return (['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((priority) => ({
			priority,
			count: counts[priority],
			percentage: total > 0 ? Math.round((counts[priority] / total) * 100) : 0,
			color: PRIORITY_COLORS[priority],
		}));
	},

	// Project Progress
	get projectProgress(): ProjectProgress[] {
		const projectMap = new Map<
			string | null,
			{ total: number; completed: number; inProgress: number }
		>();

		// Initialize with inbox (null projectId)
		projectMap.set(null, { total: 0, completed: 0, inProgress: 0 });

		// Initialize all projects
		projects.forEach((p) => {
			projectMap.set(p.id, { total: 0, completed: 0, inProgress: 0 });
		});

		// Count tasks
		tasks.forEach((t) => {
			const projectId = t.projectId || null;
			const data = projectMap.get(projectId) || { total: 0, completed: 0, inProgress: 0 };

			data.total++;
			if (t.isCompleted) {
				data.completed++;
			} else if (t.status === 'in_progress') {
				data.inProgress++;
			}

			projectMap.set(projectId, data);
		});

		// Convert to array
		const result: ProjectProgress[] = [];

		projectMap.forEach((data, projectId) => {
			if (data.total === 0) return; // Skip empty projects

			const project = projectId ? projects.find((p) => p.id === projectId) : null;

			result.push({
				projectId,
				projectName: project?.name || 'Inbox',
				projectColor: project?.color || '#6B7280',
				total: data.total,
				completed: data.completed,
				inProgress: data.inProgress,
				percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
			});
		});

		// Sort by total tasks descending
		return result.sort((a, b) => b.total - a.total);
	},

	// Weekly Velocity (Story Points per week)
	get weeklyVelocity(): WeeklyData[] {
		const weeks: WeeklyData[] = [];

		for (let i = 11; i >= 0; i--) {
			const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
			const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

			const weekTasks = tasks.filter((t) => {
				if (!t.isCompleted || !t.completedAt) return false;
				const completedDate = new Date(t.completedAt);
				return completedDate >= weekStart && completedDate <= weekEnd;
			});

			weeks.push({
				week: format(weekStart, 'd. MMM', { locale: de }),
				weekStart,
				completedCount: weekTasks.length,
				storyPoints: weekTasks.reduce((sum, t) => sum + (t.metadata?.storyPoints || 0), 0),
			});
		}

		return weeks;
	},

	// Most Productive Days
	get productiveDays(): DayProductivity[] {
		const dayStats = new Map<number, { total: number; weeks: Set<string> }>();

		// Initialize all days
		for (let i = 0; i < 7; i++) {
			dayStats.set(i, { total: 0, weeks: new Set() });
		}

		// Count completions per day of week
		tasks.forEach((t) => {
			if (t.isCompleted && t.completedAt) {
				const completedDate = new Date(t.completedAt);
				const dayOfWeek = completedDate.getDay();
				const weekKey = format(completedDate, 'yyyy-ww');

				const stats = dayStats.get(dayOfWeek)!;
				stats.total++;
				stats.weeks.add(weekKey);
			}
		});

		// Calculate averages
		return Array.from(dayStats.entries()).map(([dayIndex, stats]) => ({
			day: DAY_NAMES[dayIndex],
			dayIndex,
			avgCompletions:
				stats.weeks.size > 0 ? Math.round((stats.total / stats.weeks.size) * 10) / 10 : 0,
		}));
	},

	// Subtask Stats
	get subtaskStats() {
		let totalSubtasks = 0;
		let completedSubtasks = 0;

		tasks.forEach((t) => {
			if (t.subtasks && Array.isArray(t.subtasks)) {
				totalSubtasks += t.subtasks.length;
				completedSubtasks += t.subtasks.filter((s) => s.isCompleted).length;
			}
		});

		return {
			total: totalSubtasks,
			completed: completedSubtasks,
			percentage: totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0,
		};
	},

	// Average completion time (in days)
	get averageCompletionTime() {
		const completedWithDates = tasks.filter((t) => t.isCompleted && t.completedAt && t.createdAt);

		if (completedWithDates.length === 0) return 0;

		const totalDays = completedWithDates.reduce((sum, t) => {
			const created = new Date(t.createdAt);
			const completed = new Date(t.completedAt!);
			return sum + differenceInDays(completed, created);
		}, 0);

		return Math.round((totalDays / completedWithDates.length) * 10) / 10;
	},
};
