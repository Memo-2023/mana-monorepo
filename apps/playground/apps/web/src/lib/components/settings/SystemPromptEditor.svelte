<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
</script>

<div>
	<div class="mb-2 flex items-center justify-between">
		<label for="system-prompt" class="text-sm font-medium">System Prompt</label>
		<button
			onclick={() => (settingsStore.systemPrompt = 'You are a helpful AI assistant.')}
			class="text-xs transition-colors"
			style="color: var(--color-text-muted);"
		>
			Reset
		</button>
	</div>
	<textarea
		id="system-prompt"
		bind:value={settingsStore.systemPrompt}
		placeholder="Enter system prompt..."
		rows="4"
		class="w-full resize-none rounded-lg border p-3 text-sm"
		style="background-color: var(--color-bg); border-color: var(--color-border);"
	></textarea>
	<p class="mt-1.5 text-xs" style="color: var(--color-text-muted);">
		{settingsStore.systemPrompt.length} characters
	</p>
</div>
