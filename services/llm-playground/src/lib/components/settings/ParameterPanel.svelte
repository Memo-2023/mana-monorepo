<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
</script>

<div class="space-y-4">
	<div>
		<div class="mb-2 flex items-center justify-between">
			<label for="temperature-slider" class="text-sm font-medium">Temperature</label>
			<span class="text-sm" style="color: var(--color-text-muted);"
				>{settingsStore.temperature.toFixed(2)}</span
			>
		</div>
		<input
			id="temperature-slider"
			type="range"
			min="0"
			max="2"
			step="0.01"
			bind:value={settingsStore.temperature}
			class="h-2 w-full cursor-pointer appearance-none rounded-lg"
			style="background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) {(settingsStore.temperature /
				2) *
				100}%, var(--color-bg) {(settingsStore.temperature / 2) * 100}%, var(--color-bg) 100%);"
		/>
		<div
			class="mt-1 flex justify-between text-xs"
			style="color: var(--color-text-muted);"
		>
			<span>Precise</span>
			<span>Creative</span>
		</div>
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<label for="max-tokens-slider" class="text-sm font-medium">Max Tokens</label>
			<span class="text-sm" style="color: var(--color-text-muted);">{settingsStore.maxTokens}</span>
		</div>
		<input
			id="max-tokens-slider"
			type="range"
			min="256"
			max="8192"
			step="256"
			bind:value={settingsStore.maxTokens}
			class="h-2 w-full cursor-pointer appearance-none rounded-lg"
			style="background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) {((settingsStore.maxTokens -
				256) /
				(8192 - 256)) *
				100}%, var(--color-bg) {((settingsStore.maxTokens - 256) / (8192 - 256)) * 100}%, var(--color-bg) 100%);"
		/>
		<div
			class="mt-1 flex justify-between text-xs"
			style="color: var(--color-text-muted);"
		>
			<span>256</span>
			<span>8192</span>
		</div>
	</div>

	<div>
		<div class="mb-2 flex items-center justify-between">
			<label for="top-p-slider" class="text-sm font-medium">Top P</label>
			<span class="text-sm" style="color: var(--color-text-muted);"
				>{settingsStore.topP.toFixed(2)}</span
			>
		</div>
		<input
			id="top-p-slider"
			type="range"
			min="0"
			max="1"
			step="0.01"
			bind:value={settingsStore.topP}
			class="h-2 w-full cursor-pointer appearance-none rounded-lg"
			style="background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) {settingsStore.topP *
				100}%, var(--color-bg) {settingsStore.topP * 100}%, var(--color-bg) 100%);"
		/>
		<div
			class="mt-1 flex justify-between text-xs"
			style="color: var(--color-text-muted);"
		>
			<span>Focused</span>
			<span>Diverse</span>
		</div>
	</div>
</div>
