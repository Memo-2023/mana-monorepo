<script lang="ts">
	import TaskItemSkeleton from './TaskItemSkeleton.svelte';

	interface Props {
		count?: number;
	}

	let { count = 5 }: Props = $props();
</script>

<div class="space-y-1">
	{#each Array(count) as _, i}
		<TaskItemSkeleton />
	{/each}
</div>
