<script lang="ts">
	import type { AIModel } from '@chat/types';

	interface Props {
		models: AIModel[];
		selectedModelId: string;
		onSelect: (modelId: string) => void;
		disabled?: boolean;
	}

	let { models, selectedModelId, onSelect, disabled = false }: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onSelect(target.value);
	}
</script>

<div class="relative">
	<select
		value={selectedModelId}
		onchange={handleChange}
		{disabled}
		class="appearance-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100
           text-sm rounded-lg px-3 py-2 pr-8 border border-gray-200 dark:border-gray-700
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
           disabled:opacity-50 disabled:cursor-not-allowed
           cursor-pointer min-w-[160px]"
	>
		{#if models.length === 0}
			<option value="">Laden...</option>
		{:else}
			{#each models as model (model.id)}
				<option value={model.id}>{model.name}</option>
			{/each}
		{/if}
	</select>
	<div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
		<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</div>
</div>
