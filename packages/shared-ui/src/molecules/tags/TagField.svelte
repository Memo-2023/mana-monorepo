<script lang="ts">
	import TagSelector from './TagSelector.svelte';
	import type { Tag } from './constants';

	/**
	 * Form field wrapper for TagSelector.
	 * Works with tag IDs (string[]) — the common pattern across all modules.
	 * Pass all available tags and the currently selected IDs.
	 */

	interface Props {
		/** All available tags */
		tags: Array<{ id: string; name: string; color?: string | null }>;
		/** Currently selected tag IDs */
		selectedIds: string[];
		/** Called when selection changes */
		onChange: (ids: string[]) => void;
		/** Max number of tags (optional) */
		maxTags?: number;
		/** Label for the add button */
		addLabel?: string;
		/** Placeholder text */
		placeholder?: string;
	}

	let {
		tags,
		selectedIds,
		onChange,
		maxTags,
		addLabel = 'Tag hinzufügen',
		placeholder = 'Tag suchen...',
	}: Props = $props();

	const tagObjects: Tag[] = $derived(
		tags.map((t) => ({ id: t.id, name: t.name, color: t.color ?? undefined }))
	);

	const selectedTags: Tag[] = $derived(
		selectedIds.map((id) => tagObjects.find((t) => t.id === id)).filter((t): t is Tag => t != null)
	);

	function handleChange(newTags: Tag[]) {
		onChange(newTags.map((t) => t.id));
	}
</script>

<TagSelector
	tags={tagObjects}
	{selectedTags}
	onTagsChange={handleChange}
	addTagLabel={addLabel}
	searchPlaceholder={placeholder}
	{maxTags}
/>
