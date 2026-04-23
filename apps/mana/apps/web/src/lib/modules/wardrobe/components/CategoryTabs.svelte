<!--
  Horizontal pill-tabs for the garment grid. "Alle" is the first tab;
  the selected category drives both the filter and the default category
  for new uploads on the current tab (drops land in the active tab's
  category, so "Oberteile aktiv → Datei droppen → landet als top").
-->
<script lang="ts">
	import { CATEGORY_LABELS, CATEGORY_ORDER } from '../constants';
	import type { GarmentCategory } from '../types';

	interface Props {
		active: GarmentCategory | 'all';
		/** Count badge per category; omitted -> no badge. */
		counts?: Partial<Record<GarmentCategory | 'all', number>>;
		onChange: (next: GarmentCategory | 'all') => void;
	}

	let { active, counts, onChange }: Props = $props();
</script>

<div class="flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
	<button
		type="button"
		onclick={() => onChange('all')}
		class="shrink-0 rounded-full border px-3 py-1 text-sm transition-colors {active === 'all'
			? 'border-primary bg-primary text-primary-foreground'
			: 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'}"
	>
		Alle
		{#if counts?.all !== undefined}
			<span class="ml-1 text-xs opacity-70">{counts.all}</span>
		{/if}
	</button>
	{#each CATEGORY_ORDER as category}
		<button
			type="button"
			onclick={() => onChange(category)}
			class="shrink-0 rounded-full border px-3 py-1 text-sm transition-colors {active === category
				? 'border-primary bg-primary text-primary-foreground'
				: 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'}"
		>
			{CATEGORY_LABELS[category]}
			{#if counts?.[category] !== undefined && counts[category]! > 0}
				<span class="ml-1 text-xs opacity-70">{counts[category]}</span>
			{/if}
		</button>
	{/each}
</div>
