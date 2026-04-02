<script lang="ts">
	import type { CompareModelResult } from '@chat/types';
	import ModelResponseCard from './ModelResponseCard.svelte';

	interface Props {
		results: CompareModelResult[];
		currentIndex?: number;
	}

	let { results, currentIndex = 0 }: Props = $props();
</script>

{#if results.length === 0}
	<div class="text-center py-12 text-muted-foreground">
		<p>Keine Ergebnisse vorhanden.</p>
		<p class="text-sm mt-1">Gib einen Prompt ein und starte den Vergleich.</p>
	</div>
{:else}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each results as result, index (result.modelId)}
			<ModelResponseCard
				{result}
				isActive={index === currentIndex && result.status === 'loading'}
			/>
		{/each}
	</div>
{/if}
