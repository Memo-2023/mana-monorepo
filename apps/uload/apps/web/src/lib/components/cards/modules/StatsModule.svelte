<script lang="ts">
	import type { StatsModuleProps } from '../types';

	let { stats = [], layout = 'grid' }: StatsModuleProps = $props();

	let layoutClass = $derived(() => {
		const classes = {
			grid: 'grid grid-cols-2 gap-4',
			list: 'space-y-3',
			compact: 'flex flex-wrap gap-4',
		};
		return classes[layout] || classes.grid;
	});
</script>

<div class="stats-module {layoutClass()}">
	{#each stats as stat}
		<div class="stat-item {layout === 'compact' ? 'flex items-center gap-2' : ''}">
			{#if stat.icon}
				<span class="text-2xl" style="color: {stat.color || 'inherit'}">
					{stat.icon}
				</span>
			{/if}

			<div class={layout === 'compact' ? '' : 'mt-1'}>
				<div class="text-2xl font-bold text-theme-text" style="color: {stat.color || 'inherit'}">
					{stat.value}
					{#if stat.change}
						<span class="ml-1 text-sm {stat.change > 0 ? 'text-green-500' : 'text-red-500'}">
							{stat.change > 0 ? '↑' : '↓'}
							{Math.abs(stat.change)}%
						</span>
					{/if}
				</div>
				<div class="text-xs text-theme-text-muted">{stat.label}</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.stat-item {
		transition: transform 0.2s;
	}

	.stat-item:hover {
		transform: translateY(-2px);
	}
</style>
