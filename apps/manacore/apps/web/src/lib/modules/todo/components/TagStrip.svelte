<script lang="ts">
	import type { LocalLabel } from '../types';
	import { viewStore } from '../stores/view.svelte';
	import { X } from '@manacore/shared-icons';

	interface Props {
		labels: LocalLabel[];
		collapsed?: boolean;
		onToggleCollapse?: () => void;
	}

	let { labels, collapsed = false, onToggleCollapse }: Props = $props();

	function handleSelect(id: string) {
		if (viewStore.currentView === 'label' && viewStore.currentLabelId === id) {
			viewStore.setInbox();
		} else {
			viewStore.setLabel(id);
		}
	}
</script>

{#if labels.length > 0 && !collapsed}
	<div class="flex items-center gap-1.5 overflow-x-auto pb-1">
		{#if viewStore.currentView === 'label'}
			<button
				onclick={() => viewStore.setInbox()}
				class="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs text-primary"
			>
				<X size={10} />
				Filter
			</button>
		{/if}
		{#each labels as label (label.id)}
			<button
				onclick={() => handleSelect(label.id)}
				class="flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors
					{viewStore.currentView === 'label' && viewStore.currentLabelId === label.id
					? 'border-primary bg-primary/10 text-primary'
					: 'border-border text-muted-foreground hover:border-primary/50'}"
			>
				<span class="mr-1 inline-block h-2 w-2 rounded-full" style="background-color: {label.color}"
				></span>
				{label.name}
			</button>
		{/each}
	</div>
{/if}
