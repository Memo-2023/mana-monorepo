<script lang="ts">
	/**
	 * WidgetSkeleton - Loading state for widgets
	 *
	 * Displays animated skeleton placeholders while widget data is loading.
	 */

	interface Props {
		/** Number of skeleton lines to show */
		lines?: number;
		/** Show a header skeleton */
		showHeader?: boolean;
	}

	let { lines = 3, showHeader = false }: Props = $props();
</script>

<div class="animate-pulse space-y-3">
	{#if showHeader}
		<div class="flex items-center gap-3">
			<div class="h-8 w-8 rounded-lg bg-muted"></div>
			<div class="h-5 w-32 rounded bg-muted"></div>
		</div>
	{/if}

	{#each Array(lines) as _, i}
		<div class="flex items-center gap-3">
			{#if i === 0}
				<div class="h-4 w-3/4 rounded bg-muted"></div>
			{:else if i === lines - 1}
				<div class="h-4 w-1/2 rounded bg-muted"></div>
			{:else}
				<div class="h-4 w-full rounded bg-muted"></div>
			{/if}
		</div>
	{/each}
</div>
