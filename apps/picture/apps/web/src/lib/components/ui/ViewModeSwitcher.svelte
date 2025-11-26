<script lang="ts">
	import { viewMode, cycleViewMode, type ViewMode } from '$lib/stores/view';

	function getIcon(mode: ViewMode) {
		switch (mode) {
			case 'single':
				return 'M4 6h16M4 12h16M4 18h16'; // List icon
			case 'grid3':
				return 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'; // 2x2 grid
			case 'grid5':
				return 'M4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM10 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM16 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM4 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM10 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zM16 11a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z'; // 3x2 grid
		}
	}

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
	<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
		<path d={getIcon($viewMode)} />
	</svg>
	<span class="hidden sm:inline">{getLabel($viewMode)}</span>
</button>
