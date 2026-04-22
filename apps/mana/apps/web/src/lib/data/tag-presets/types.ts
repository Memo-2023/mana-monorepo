/**
 * User-level tag presets.
 *
 * A preset is a named, snapshot-shaped tag bundle the user can apply
 * when creating a new Space. Presets live at the user level (cross-Space)
 * so the picker can show them from any Space context.
 *
 * The preset's `tags` field is a frozen snapshot — not live references
 * to existing globalTags rows. Applying a preset to a Space one-shot-
 * copies each entry as a fresh `globalTags` row with a new UUID.
 *
 * See docs/plans/space-scoped-data-model.md §5.
 */

export interface TagPresetEntry {
	name: string;
	color: string;
	icon?: string;
	/**
	 * Optional group-by label on the preset. When the preset is applied to
	 * a Space, we create a `tagGroups` row for each distinct groupName and
	 * link the resulting globalTags to it — so the user's familiar grouping
	 * shows up without them having to rebuild it per Space.
	 */
	groupName?: string;
}

export interface LocalUserTagPreset {
	id: string;
	userId: string;
	name: string;
	/** At most one preset per user may be the default. */
	isDefault: boolean;
	tags: TagPresetEntry[];
	createdAt: string;
	updatedAt: string;
	deletedAt?: string;
}

export type UserTagPreset = Omit<LocalUserTagPreset, 'deletedAt'>;

export function toUserTagPreset(local: LocalUserTagPreset): UserTagPreset {
	return {
		id: local.id,
		userId: local.userId,
		name: local.name,
		isDefault: local.isDefault,
		tags: local.tags ?? [],
		createdAt: local.createdAt,
		updatedAt: local.updatedAt,
	};
}

export interface CreatePresetInput {
	name: string;
	tags?: TagPresetEntry[];
	isDefault?: boolean;
}

export interface UpdatePresetInput {
	name?: string;
	tags?: TagPresetEntry[];
	isDefault?: boolean;
}
