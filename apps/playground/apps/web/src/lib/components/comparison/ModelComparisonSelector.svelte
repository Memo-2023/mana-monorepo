<script lang="ts">
	import type { ModelWithModality, Modality } from '$lib/types';
	import { comparisonStore } from '$lib/stores/comparison.svelte';
	import ModelModalityFilter from './ModelModalityFilter.svelte';

	let { models }: { models: ModelWithModality[] } = $props();

	let selectedModality = $state<Modality>('text');

	const filteredModels = $derived(models.filter((m) => m.modality === selectedModality));

	function getModelDisplayName(modelId: string): string {
		const parts = modelId.split('/');
		return parts.length > 1 ? parts.slice(1).join('/') : modelId;
	}
</script>

<div class="border-t p-4" style="border-color: var(--color-border);">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-sm font-semibold" style="color: var(--color-text);">Model Comparison</h3>
		<button
			onclick={() => comparisonStore.toggleComparisonMode()}
			class="rounded px-2 py-1 text-xs transition-colors"
			class:bg-blue-600={comparisonStore.comparisonMode}
			class:text-white={comparisonStore.comparisonMode}
			style={!comparisonStore.comparisonMode
				? 'background-color: var(--color-bg); color: var(--color-text-muted);'
				: ''}
		>
			{comparisonStore.comparisonMode ? 'Active' : 'Off'}
		</button>
	</div>

	{#if comparisonStore.comparisonMode}
		<ModelModalityFilter {models} bind:selectedModality />

		<div class="max-h-48 space-y-1 overflow-y-auto">
			{#each filteredModels as model}
				{@const isSelected = comparisonStore.isModelSelected(model.id)}
				{@const isDisabled = !isSelected && !comparisonStore.canAddModel()}
				<label
					class="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-zinc-800"
					class:opacity-50={isDisabled}
					class:cursor-not-allowed={isDisabled}
					title={model.description || ''}
				>
					<input
						type="checkbox"
						checked={isSelected}
						onchange={() => comparisonStore.toggleModel(model.id)}
						disabled={isDisabled}
						class="rounded"
					/>
					<div class="min-w-0 flex-1">
						<span class="block truncate text-sm" style="color: var(--color-text);">
							{getModelDisplayName(model.id)}
						</span>
						{#if model.description}
							<span class="block truncate text-xs" style="color: var(--color-text-muted);">
								{model.description}
							</span>
						{/if}
					</div>
				</label>
			{/each}
		</div>

		<p class="mt-2 text-xs" style="color: var(--color-text-muted);">
			{comparisonStore.selectedModels.length}/{comparisonStore.maxModels} models selected
		</p>

		{#if comparisonStore.selectedModels.length > 0}
			<button
				onclick={() => comparisonStore.clearSelection()}
				class="mt-2 w-full rounded px-2 py-1 text-xs transition-colors"
				style="background-color: var(--color-bg); color: var(--color-text-muted);"
			>
				Clear Selection
			</button>
		{/if}
	{/if}
</div>
