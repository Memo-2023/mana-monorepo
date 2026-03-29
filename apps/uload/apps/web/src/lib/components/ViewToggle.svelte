<script lang="ts">
	interface Props {
		currentView: 'cards' | 'list' | 'stats';
		onViewChange: (view: 'cards' | 'list' | 'stats') => void;
		showStats?: boolean;
	}

	let { currentView, onViewChange, showStats = false }: Props = $props();
</script>

<div class="flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface p-1">
	<button
		onclick={() => onViewChange('cards')}
		class="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors {currentView ===
		'cards'
			? 'bg-theme-primary text-white'
			: 'text-theme-text hover:bg-theme-surface-hover'}"
		title="Card View"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<rect x="3" y="3" width="7" height="7" stroke-width="2" rx="1" />
			<rect x="14" y="3" width="7" height="7" stroke-width="2" rx="1" />
			<rect x="3" y="14" width="7" height="7" stroke-width="2" rx="1" />
			<rect x="14" y="14" width="7" height="7" stroke-width="2" rx="1" />
		</svg>
		<span class="hidden sm:inline">Cards</span>
	</button>
	<button
		onclick={() => onViewChange('list')}
		class="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors {currentView ===
		'list'
			? 'bg-theme-primary text-white'
			: 'text-theme-text hover:bg-theme-surface-hover'}"
		title="List View"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<line x1="3" y1="6" x2="21" y2="6" stroke-width="2" />
			<line x1="3" y1="12" x2="21" y2="12" stroke-width="2" />
			<line x1="3" y1="18" x2="21" y2="18" stroke-width="2" />
		</svg>
		<span class="hidden sm:inline">List</span>
	</button>
	{#if showStats}
		<button
			onclick={() => onViewChange('stats')}
			class="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors {currentView ===
			'stats'
				? 'bg-theme-primary text-white'
				: 'text-theme-text hover:bg-theme-surface-hover'}"
			title="Stats View"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<rect x="3" y="13" width="18" height="8" stroke-width="2" rx="1" />
				<line x1="7" y1="17" x2="7" y2="13" stroke-width="2" />
				<line x1="11" y1="17" x2="11" y2="10" stroke-width="2" />
				<line x1="15" y1="17" x2="15" y2="7" stroke-width="2" />
				<line x1="19" y1="17" x2="19" y2="4" stroke-width="2" />
			</svg>
			<span class="hidden sm:inline">Stats</span>
		</button>
	{/if}
</div>
