<script lang="ts">
	import { minimizedPagesStore } from '../stores/minimized-pages.svelte';
	import { X, ArrowsOut } from '@manacore/shared-icons';

	let pages = $derived(minimizedPagesStore.pages);
</script>

{#if pages.length > 0}
	<div
		class="fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
	>
		{#each pages as page (page.id)}
			<div
				class="group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors
					{minimizedPagesStore.activePageId === page.id
					? 'bg-primary/10 text-primary'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				<button
					onclick={() => minimizedPagesStore.maximize(page.id)}
					class="truncate max-w-[120px]"
				>
					{page.title}
				</button>
				<button
					onclick={() => minimizedPagesStore.remove(page.id)}
					class="opacity-0 transition-opacity group-hover:opacity-100"
				>
					<X size={12} />
				</button>
			</div>
		{/each}
	</div>
{/if}
