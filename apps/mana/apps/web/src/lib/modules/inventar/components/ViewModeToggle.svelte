<script lang="ts">
	import type { ViewMode } from '../queries';

	interface Props {
		current: ViewMode;
		onchange: (mode: ViewMode) => void;
	}

	let { current, onchange }: Props = $props();

	const modes: { value: ViewMode; icon: string; label: string }[] = [
		{ value: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Liste' },
		{
			value: 'grid',
			icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
			label: 'Raster',
		},
		{
			value: 'table',
			icon: 'M3 10h18M3 14h18M3 18h18M3 6h18M3 6v12M21 6v12M9 6v12M15 6v12',
			label: 'Tabelle',
		},
	];
</script>

<div class="flex rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
	{#each modes as mode}
		<button
			type="button"
			onclick={() => onchange(mode.value)}
			class="p-2 transition-colors {current === mode.value
				? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
				: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'} {mode.value ===
			'list'
				? 'rounded-l-lg'
				: mode.value === 'table'
					? 'rounded-r-lg'
					: ''}"
			title={mode.label}
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={mode.icon} />
			</svg>
		</button>
	{/each}
</div>
