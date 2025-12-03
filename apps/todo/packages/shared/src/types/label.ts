export interface Label {
	id: string;
	userId: string;
	name: string;
	color: string;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface CreateLabelInput {
	name: string;
	color?: string;
}

export interface UpdateLabelInput {
	name?: string;
	color?: string;
}
