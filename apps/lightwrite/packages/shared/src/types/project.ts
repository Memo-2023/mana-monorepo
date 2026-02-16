export interface Project {
	id: string;
	userId: string;
	title: string;
	description?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateProjectDto {
	title: string;
	description?: string;
}

export interface UpdateProjectDto {
	title?: string;
	description?: string;
}
