<script lang="ts">
	import type { ComparisonMessage } from '$lib/types';
	import ComparisonResponseCard from '../comparison/ComparisonResponseCard.svelte';

	let { message }: { message: ComparisonMessage } = $props();
</script>

<div class="space-y-4">
	<!-- User Message -->
	<div class="flex justify-end">
		<div class="max-w-[80%] rounded-lg p-3" style="background-color: var(--color-primary);">
			<p class="whitespace-pre-wrap text-white">{message.userContent}</p>
		</div>
	</div>

	<!-- Comparison Label -->
	<div class="flex items-center gap-2">
		<div class="h-px flex-1" style="background-color: var(--color-border);"></div>
		<span class="text-xs font-medium" style="color: var(--color-text-muted);">
			Comparing {message.responses.length} models
		</span>
		<div class="h-px flex-1" style="background-color: var(--color-border);"></div>
	</div>

	<!-- Comparison Responses Grid -->
	<div class="flex gap-4 overflow-x-auto pb-2">
		{#each message.responses as response (response.modelId)}
			<ComparisonResponseCard {response} />
		{/each}
	</div>
</div>
