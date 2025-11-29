<script lang="ts">
	import { viewMode, cycleViewMode, type ViewMode } from '$lib/stores/view';
	import { List, SquaresFour, Squares } from '@manacore/shared-icons';

	function getLabel(mode: ViewMode) {
		switch (mode) {
			case 'single':
				return 'Liste';
			case 'grid3':
				return 'Mittel';
			case 'grid5':
				return 'Klein';
		}
	}
</script>

<button
	onclick={cycleViewMode}
	class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
	title="Ansicht wechseln ({getLabel($viewMode)})"
>
	{#if $viewMode === 'single'}
		<List size={20} />
	{:else if $viewMode === 'grid3'}
		<SquaresFour size={20} />
	{:else}
		<Squares size={20} />
	{/if}
	<span class="hidden sm:inline">{getLabel($viewMode)}</span>
</button>
