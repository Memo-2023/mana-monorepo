<script lang="ts">
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import { TagSelector as SharedTagSelector } from '@manacore/shared-ui';
	import type { Tag } from '@manacore/shared-ui';

	interface Props {
		selectedIds: string[];
		onChange: (ids: string[]) => void;
	}

	let { selectedIds, onChange }: Props = $props();

	// Labels come from context (set in todo +layout.svelte via useAllLabels → shared useAllTags)
	const allLabels$: Observable<Array<{ id: string; name: string; color: string }>> =
		getContext('labels');
	let allLabels = $state<Array<{ id: string; name: string; color: string }>>([]);
	$effect(() => {
		const sub = allLabels$.subscribe((l) => (allLabels = l ?? []));
		return () => sub.unsubscribe();
	});

	const tags: Tag[] = $derived(allLabels.map((l) => ({ id: l.id, name: l.name, color: l.color })));
	const selectedTags: Tag[] = $derived(
		selectedIds.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => t != null)
	);

	function handleTagsChange(newTags: Tag[]) {
		onChange(newTags.map((t) => t.id));
	}
</script>

<SharedTagSelector
	{tags}
	{selectedTags}
	onTagsChange={handleTagsChange}
	addTagLabel="Label"
	placeholder="Label hinzufügen..."
	searchPlaceholder="Label suchen..."
/>
