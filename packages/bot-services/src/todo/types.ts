import { UserEntity, Priority } from '../shared/types';

/**
 * Task entity
 */
export interface Task extends UserEntity {
	title: string;
	completed: boolean;
	priority: number; // 1-4, 1 is highest (for backward compatibility)
	dueDate: string | null; // ISO date string
	project: string | null;
	labels: string[];
	completedAt: string | null;
}

/**
 * Project entity
 */
export interface Project {
	id: string;
	name: string;
	color: string;
	userId: string;
}

/**
 * Todo data storage structure
 */
export interface TodoData {
	tasks: Task[];
	projects: Project[];
}

/**
 * Create task input
 */
export interface CreateTaskInput {
	title: string;
	priority?: number;
	dueDate?: string | null;
	project?: string | null;
	labels?: string[];
}

/**
 * Update task input
 */
export interface UpdateTaskInput {
	title?: string;
	priority?: number;
	dueDate?: string | null;
	project?: string | null;
	labels?: string[];
}

/**
 * Task filter options
 */
export interface TaskFilter {
	completed?: boolean;
	project?: string;
	dueDate?: string;
	dueBefore?: string;
	dueAfter?: string;
	priority?: number;
	labels?: string[];
}

/**
 * Todo statistics
 */
export interface TodoStats {
	total: number;
	completed: number;
	pending: number;
	today: number;
	overdue: number;
}

/**
 * Parsed task input (from natural language)
 */
export interface ParsedTaskInput {
	title: string;
	priority: number;
	dueDate: string | null;
	project: string | null;
}
