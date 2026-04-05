<script lang="ts">
	import type { LocalBoardView } from '../../types';
	import { Columns, GridFour, Target, Plus } from '@mana/shared-icons';

	interface Props {
		views: LocalBoardView[];
		activeViewId: string | null;
		onSelect: (viewId: string) => void;
		onCreateView: () => void;
	}

	let { views, activeViewId, onSelect, onCreateView }: Props = $props();

	function getIcon(layout: string) {
		switch (layout) {
			case 'grid':
				return GridFour;
			case 'fokus':
				return Target;
			default:
				return Columns;
		}
	}
</script>

<div class="flex items-center gap-1">
	{#each views as view (view.id)}
		{@const Icon = getIcon(view.layout)}
		<button
			onclick={() => onSelect(view.id)}
			class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors
				{activeViewId === view.id
				? 'bg-primary/10 text-primary'
				: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			<Icon size={14} />
			{view.name}
		</button>
	{/each}
	<button
		onclick={onCreateView}
		class="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		title="Neues Board"
	>
		<Plus size={12} />
	</button>
</div>
