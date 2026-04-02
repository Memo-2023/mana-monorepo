<script lang="ts">
	import type { AIModel } from '@chat/types';
	import { CaretDown } from '@manacore/shared-icons';

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
		class="appearance-none bg-white/80 dark:bg-white/10 backdrop-blur-xl text-foreground
           text-sm font-medium rounded-xl px-4 py-2.5 pr-9 border border-black/10 dark:border-white/20
           focus:outline-none focus:ring-2 focus:ring-primary/50
           disabled:opacity-50 disabled:cursor-not-allowed
           cursor-pointer min-w-[160px] shadow-md hover:shadow-lg transition-all"
	>
		{#if models.length === 0}
			<option value="">Laden...</option>
		{:else}
			{#each models as model (model.id)}
				<option value={model.id}>{model.name}</option>
			{/each}
		{/if}
	</select>
	<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
		<CaretDown size={14} weight="bold" class="text-muted-foreground" />
	</div>
</div>
