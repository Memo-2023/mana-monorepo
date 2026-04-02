<script lang="ts">
	import { visualizerStore } from './registry.svelte';
	import FrequencyBars from './FrequencyBars.svelte';
	import ButterchurnViz from './ButterchurnViz.svelte';
	import ParticleViz from './ParticleViz.svelte';

	interface Props {
		height?: number;
		/** Show the visualizer type switcher */
		showSwitcher?: boolean;
		/** Compact mode for MiniPlayer */
		compact?: boolean;
	}

	let { height = 200, showSwitcher = true, compact = false }: Props = $props();
</script>

<div class="relative w-full">
	{#if visualizerStore.active === 'bars'}
		<FrequencyBars
			barCount={compact ? 64 : 48}
			height={compact ? height : height}
			mirror={!compact}
			barGap={compact ? 1 : 2}
			barRadius={compact ? 1 : 2}
		/>
	{:else if visualizerStore.active === 'butterchurn'}
		<ButterchurnViz {height} />
	{:else if visualizerStore.active === 'particles'}
		<ParticleViz {height} particleCount={compact ? 100 : 200} />
	{/if}

	{#if showSwitcher}
		<div class="absolute top-2 right-2 flex gap-1">
			{#each visualizerStore.all as viz}
				<button
					onclick={() => visualizerStore.setActive(viz.id)}
					class="px-2 py-1 text-xs rounded-md transition-colors {visualizerStore.active === viz.id
						? 'bg-primary text-white'
						: 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'}"
					title={viz.description}
				>
					{viz.name}
				</button>
			{/each}
		</div>
	{/if}
</div>
