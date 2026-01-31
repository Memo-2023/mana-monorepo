<script lang="ts">
	import type { Modality, ModelWithModality } from '$lib/types';

	let {
		models,
		selectedModality = $bindable('text'),
	}: {
		models: ModelWithModality[];
		selectedModality: Modality;
	} = $props();

	const modalities: { value: Modality; label: string; icon: string }[] = [
		{ value: 'text', label: 'Text', icon: 'T' },
		{ value: 'vision', label: 'Vision', icon: 'V' },
		{ value: 'code', label: 'Code', icon: 'C' },
	];

	const modelCounts = $derived(
		modalities.map((m) => ({
			...m,
			count: models.filter((model) => model.modality === m.value).length,
		}))
	);
</script>

<div class="mb-3 flex gap-2">
	{#each modelCounts as mod}
		<button
			onclick={() => (selectedModality = mod.value)}
			class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
			class:bg-blue-600={selectedModality === mod.value}
			class:text-white={selectedModality === mod.value}
			style={selectedModality !== mod.value
				? 'background-color: var(--color-bg); color: var(--color-text-muted);'
				: ''}
		>
			<span class="mr-1 font-bold">{mod.icon}</span>
			{mod.label}
			<span class="ml-1 opacity-70">({mod.count})</span>
		</button>
	{/each}
</div>
