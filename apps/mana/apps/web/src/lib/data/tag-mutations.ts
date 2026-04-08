/**
 * Tag mutation helpers — shared add/remove logic for entity.tagIds fields.
 *
 * Every module that supports tagging on its records (calendar events,
 * contacts, places, todo tasks, …) reimplemented the same two operations:
 *
 *   - "append a tag if not already present" (drag-drop from tag strip)
 *   - "remove a tag, with undo toast" (click on a tag pill in the detail view)
 *
 * These helpers stay store-agnostic — the caller passes the current
 * `tagIds` array and an `update` function that knows which store/field to
 * write to. That keeps them usable for tasks (which write `metadata.labelIds`
 * via `tasksStore.updateLabels`) as well as the standard `tagIds` modules.
 */

import { toastStore } from '@mana/shared-ui/toast';

type UpdateFn = (next: string[]) => Promise<void> | void;

/**
 * Append `tagId` to `current` and call `update` with the result.
 * No-op if the tag is already present.
 *
 * @example
 * ```svelte
 * use:dropTarget={{
 *   accepts: ['tag'],
 *   onDrop: (p) => addTagId(
 *     contact.tagIds ?? [],
 *     (p.data as TagDragData).id,
 *     (next) => contactsStore.updateTagIds(contact.id, next),
 *   ),
 * }}
 * ```
 */
export async function addTagId(current: string[], tagId: string, update: UpdateFn): Promise<void> {
	if (current.includes(tagId)) return;
	await update([...current, tagId]);
}

/**
 * Remove `tagId` from `current`, call `update` with the filtered list,
 * and show a toast with an undo action that reinstates the original list.
 *
 * @example
 * ```ts
 * async function removeTag(tagId: string) {
 *   await removeTagIdWithUndo(
 *     contact.tagIds ?? [],
 *     tagId,
 *     (next) => contactsStore.updateTagIds(contactId, next),
 *   );
 * }
 * ```
 */
export async function removeTagIdWithUndo(
	current: string[],
	tagId: string,
	update: UpdateFn,
	undoLabel = 'Tag entfernt'
): Promise<void> {
	const removed = current.filter((id) => id !== tagId);
	await update(removed);
	toastStore.undo(undoLabel, () => {
		void update(current);
	});
}
