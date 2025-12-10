/**
 * Tag entity from the central mana-core-auth service.
 * Used across all Manacore apps (Todo, Calendar, Contacts, etc.)
 */
export interface Tag {
	id: string;
	userId: string;
	name: string;
	color: string;
	icon?: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * Input for creating a new tag
 */
export interface CreateTagInput {
	name: string;
	color?: string;
	icon?: string;
}

/**
 * Input for updating an existing tag
 */
export interface UpdateTagInput {
	name?: string;
	color?: string;
	icon?: string;
}

/**
 * API response type that might have date strings instead of Date objects
 */
export type TagResponse = Omit<Tag, 'createdAt' | 'updatedAt'> & {
	createdAt: string;
	updatedAt: string;
};
