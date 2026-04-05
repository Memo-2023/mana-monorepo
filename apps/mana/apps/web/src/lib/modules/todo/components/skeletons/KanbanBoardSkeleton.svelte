<script lang="ts">
	import KanbanColumnSkeleton from './KanbanColumnSkeleton.svelte';

	interface Props {
		columns?: number;
	}

	let { columns = 3 }: Props = $props();
</script>

<div class="flex gap-3 overflow-hidden pb-4">
	{#each Array(columns) as _}
		<KanbanColumnSkeleton />
	{/each}
</div>
