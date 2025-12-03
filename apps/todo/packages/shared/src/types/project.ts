export interface ProjectSettings {
	defaultView?: 'list' | 'board';
	showCompletedTasks?: boolean;
	sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'order';
	sortOrder?: 'asc' | 'desc';
}

export interface Project {
	id: string;
	userId: string;
	name: string;
	description?: string | null;
	color: string;
	icon?: string | null;
	order: number;
	isArchived: boolean;
	isDefault: boolean;
	settings?: ProjectSettings | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface CreateProjectInput {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
	settings?: ProjectSettings;
}

export interface UpdateProjectInput {
	name?: string;
	description?: string | null;
	color?: string;
	icon?: string | null;
	isArchived?: boolean;
	isDefault?: boolean;
	settings?: ProjectSettings | null;
}

export interface ReorderProjectsInput {
	projectIds: string[];
}
