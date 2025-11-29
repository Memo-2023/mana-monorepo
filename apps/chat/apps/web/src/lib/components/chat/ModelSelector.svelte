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
		class="appearance-none bg-muted text-foreground
           text-sm rounded-lg px-3 py-2 pr-8 border border-border
           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
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
		<CaretDown size={16} weight="bold" class="text-muted-foreground" />
	</div>
</div>
