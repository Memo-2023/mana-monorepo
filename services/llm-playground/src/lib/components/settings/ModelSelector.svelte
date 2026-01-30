<script lang="ts">
	import { modelsStore } from '$lib/stores/models.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		modelsStore.loadModels();
	});
</script>

<div>
	<label for="model-select" class="mb-2 block text-sm font-medium">Model</label>
	{#if modelsStore.loading}
		<div
			class="flex h-10 items-center justify-center rounded-lg"
			style="background-color: var(--color-bg);"
		>
			<span class="text-sm" style="color: var(--color-text-muted);">Loading models...</span>
		</div>
	{:else if modelsStore.error}
		<div class="space-y-2">
			<div
				class="rounded-lg p-3 text-sm"
				style="background-color: rgba(239, 68, 68, 0.1); color: var(--color-error);"
			>
				{modelsStore.error}
			</div>
			<button
				onclick={() => modelsStore.loadModels()}
				class="w-full rounded-lg py-2 text-sm font-medium transition-colors"
				style="background-color: var(--color-bg);"
			>
				Retry
			</button>
		</div>
	{:else}
		<select
			id="model-select"
			bind:value={settingsStore.model}
			class="w-full rounded-lg border px-3 py-2 text-sm"
			style="background-color: var(--color-bg); border-color: var(--color-border);"
		>
			{#each modelsStore.groupedModels as group}
				<optgroup label={group.label}>
					{#each group.models as model}
						<option value={model.id}>{model.id.split('/').slice(1).join('/')}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
		<p class="mt-1.5 text-xs" style="color: var(--color-text-muted);">
			{modelsStore.models.length} models available
		</p>
	{/if}
</div>
