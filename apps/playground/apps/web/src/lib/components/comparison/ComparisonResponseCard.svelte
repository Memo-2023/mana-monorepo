<script lang="ts">
	import type { ComparisonResponse } from '$lib/types';

	let { response }: { response: ComparisonResponse } = $props();

	const modelName = $derived(response.modelId.split('/').pop() || response.modelId);

	function formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}
</script>

<div
	class="flex min-w-[280px] flex-1 flex-col rounded-lg border p-4"
	style="background-color: var(--color-surface); border-color: var(--color-border);"
>
	<!-- Header -->
	<div
		class="mb-3 flex items-center justify-between border-b pb-2"
		style="border-color: var(--color-border);"
	>
		<span class="truncate text-sm font-medium" style="color: var(--color-text);">
			{modelName}
		</span>
		{#if response.isStreaming}
			<span class="animate-pulse rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
				Streaming...
			</span>
		{:else if response.error}
			<span class="rounded bg-red-600 px-2 py-0.5 text-xs text-white"> Error </span>
		{:else}
			<span class="rounded bg-green-600 px-2 py-0.5 text-xs text-white"> Done </span>
		{/if}
	</div>

	<!-- Content -->
	<div class="mb-3 min-h-[100px] flex-1 overflow-y-auto text-sm" style="color: var(--color-text);">
		{#if response.error}
			<p class="text-red-400">{response.error}</p>
		{:else}
			<pre class="whitespace-pre-wrap font-sans">{response.content}</pre>
			{#if response.isStreaming}
				<span class="ml-1 inline-block h-4 w-2 animate-pulse bg-blue-500"></span>
			{/if}
		{/if}
	</div>

	<!-- Metrics -->
	{#if response.metrics && !response.isStreaming}
		<div
			class="flex gap-4 border-t pt-2 text-xs"
			style="border-color: var(--color-border); color: var(--color-text-muted);"
		>
			<span>{formatDuration(response.metrics.durationMs)}</span>
			<span>~{response.metrics.completionTokens} tokens</span>
			{#if response.metrics.tokensPerSecond > 0}
				<span>{response.metrics.tokensPerSecond.toFixed(1)} t/s</span>
			{/if}
		</div>
	{/if}
</div>
