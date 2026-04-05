/**
 * Tag entity from the central mana-auth service.
 * Used across all Manacore apps (Todo, Calendar, Contacts, etc.)
 */
export interface Tag {
	id: string;
	userId: string;
	name: string;
	color: string;
	icon?: string | null;
	groupId?: string | null;
	sortOrder?: number;
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
	groupId?: string | null;
	sortOrder?: number;
}

/**
 * Input for updating an existing tag
 */
export interface UpdateTagInput {
	name?: string;
	color?: string;
	icon?: string;
	groupId?: string | null;
	sortOrder?: number;
}

/**
 * API response type that might have date strings instead of Date objects
 */
export type TagResponse = Omit<Tag, 'createdAt' | 'updatedAt'> & {
	createdAt: string;
	updatedAt: string;
};

// ── Tag Groups ──────────────────────────────────────────────

/**
 * Tag group entity for organizing tags into categories
 */
export interface TagGroup {
	id: string;
	userId: string;
	name: string;
	color: string;
	icon?: string | null;
	sortOrder: number;
	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * Input for creating a new tag group
 */
export interface CreateTagGroupInput {
	name: string;
	color?: string;
	icon?: string;
	sortOrder?: number;
}

/**
 * Input for updating an existing tag group
 */
export interface UpdateTagGroupInput {
	name?: string;
	color?: string;
	icon?: string;
	sortOrder?: number;
}

/**
 * API response type for tag groups
 */
export type TagGroupResponse = Omit<TagGroup, 'createdAt' | 'updatedAt'> & {
	createdAt: string;
	updatedAt: string;
};

// ── Tag Links ───────────────────────────────────────────────

/**
 * Tag link entity that connects a tag to an entity in any app
 */
export interface TagLink {
	id: string;
	tagId: string;
	appId: string;
	entityId: string;
	entityType: string;
	userId: string;
	createdAt: Date | string;
}

/**
 * Input for creating a tag link
 */
export interface CreateTagLinkInput {
	tagId: string;
	appId: string;
	entityId: string;
	entityType: string;
}

/**
 * Input for syncing tag links on an entity (replaces all tags)
 */
export interface SyncTagLinksInput {
	appId: string;
	entityId: string;
	entityType: string;
	tagIds: string[];
}

/**
 * API response type for tag links
 */
export type TagLinkResponse = Omit<TagLink, 'createdAt'> & {
	createdAt: string;
};
