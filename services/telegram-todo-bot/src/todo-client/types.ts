export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
	order: number;
}

export interface Task {
	id: string;
	projectId: string | null;
	userId: string;
	title: string;
	description: string | null;
	dueDate: string | null;
	dueTime: string | null;
	priority: TaskPriority;
	status: TaskStatus;
	isCompleted: boolean;
	completedAt: string | null;
	order: number;
	subtasks: Subtask[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface Project {
	id: string;
	userId: string;
	name: string;
	color: string | null;
	icon: string | null;
	order: number;
	isArchived: boolean;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTaskDto {
	title: string;
	description?: string;
	projectId?: string;
	dueDate?: string;
	priority?: TaskPriority;
}

export interface TasksResponse {
	tasks: Task[];
}

export interface TaskResponse {
	task: Task;
}

export interface ProjectsResponse {
	projects: Project[];
}
