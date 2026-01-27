<script lang="ts">
	import { marked } from 'marked';
	import type { CompareModelResult } from '@chat/types';

	interface Props {
		result: CompareModelResult;
		isActive?: boolean;
	}

	let { result, isActive = false }: Props = $props();

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true,
	});

	const htmlContent = $derived(result.response ? marked.parse(result.response) : '');

	// Calculate tokens per second
	const tokensPerSecond = $derived(() => {
		if (!result.usage || !result.duration || result.duration === 0) return null;
		return (result.usage.completion_tokens / (result.duration / 1000)).toFixed(1);
	});

	// Status badge config
	const statusConfig = $derived(() => {
		switch (result.status) {
			case 'pending':
				return {
					label: 'Wartet',
					class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
				};
			case 'loading':
				return {
					label: 'Laden...',
					class: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
				};
			case 'complete':
				return {
					label: 'Fertig',
					class: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
				};
			case 'error':
				return {
					label: 'Fehler',
					class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
				};
			default:
				return { label: '', class: '' };
		}
	});

	// Format duration
	const formattedDuration = $derived(() => {
		if (!result.duration) return null;
		const seconds = result.duration / 1000;
		return seconds >= 1 ? `${seconds.toFixed(1)}s` : `${result.duration}ms`;
	});
</script>

<div
	class="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all
		   {isActive ? 'ring-2 ring-primary' : ''}
		   {result.status === 'error' ? 'border-red-200 dark:border-red-800/50' : 'border-border'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
		<h3 class="font-medium text-sm truncate">{result.modelName}</h3>
		<span class="px-2 py-0.5 rounded-full text-xs font-medium {statusConfig().class}">
			{#if result.status === 'loading'}
				<span class="inline-flex items-center gap-1">
					<span class="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
					{statusConfig().label}
				</span>
			{:else if result.status === 'complete' && formattedDuration()}
				{formattedDuration()}
			{:else}
				{statusConfig().label}
			{/if}
		</span>
	</div>

	<!-- Content -->
	<div class="p-4 min-h-[120px] max-h-[400px] overflow-y-auto">
		{#if result.status === 'pending'}
			<p class="text-muted-foreground text-sm">Wartet auf Verarbeitung...</p>
		{:else if result.status === 'loading'}
			<div class="flex items-center gap-2 text-muted-foreground text-sm">
				<span class="inline-block w-2 h-2 rounded-full bg-primary animate-bounce"></span>
				<span
					class="inline-block w-2 h-2 rounded-full bg-primary animate-bounce"
					style="animation-delay: 0.1s"
				></span>
				<span
					class="inline-block w-2 h-2 rounded-full bg-primary animate-bounce"
					style="animation-delay: 0.2s"
				></span>
			</div>
		{:else if result.status === 'error'}
			<p class="text-red-500 text-sm">{result.error || 'Ein Fehler ist aufgetreten'}</p>
		{:else if result.response}
			<div class="prose-chat text-sm">
				{@html htmlContent}
			</div>
		{/if}
	</div>

	<!-- Footer with metrics (only show when complete) -->
	{#if result.status === 'complete' && result.usage}
		<div
			class="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-3 text-xs text-muted-foreground"
		>
			<span>{result.usage.total_tokens} tokens</span>
			{#if tokensPerSecond()}
				<span class="text-muted-foreground/50">|</span>
				<span>{tokensPerSecond()} t/s</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Reuse prose-chat styles from MessageBubble */
	:global(.prose-chat) {
		font-size: 14px;
		line-height: 1.6;
	}

	:global(.prose-chat p) {
		margin: 0;
	}

	:global(.prose-chat p + p) {
		margin-top: 0.75em;
	}

	:global(.prose-chat strong) {
		font-weight: 600;
	}

	:global(.prose-chat em) {
		font-style: italic;
	}

	:global(.prose-chat ul),
	:global(.prose-chat ol) {
		margin: 0.5em 0;
		padding-left: 1.5em;
	}

	:global(.prose-chat li) {
		margin: 0.25em 0;
	}

	:global(.prose-chat code) {
		background: rgba(0, 0, 0, 0.08);
		padding: 0.15em 0.4em;
		border-radius: 4px;
		font-size: 0.9em;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	:global(.dark .prose-chat code) {
		background: rgba(255, 255, 255, 0.1);
	}

	:global(.prose-chat pre) {
		background: rgba(0, 0, 0, 0.05);
		padding: 1em;
		border-radius: 8px;
		overflow-x: auto;
		margin: 0.75em 0;
	}

	:global(.dark .prose-chat pre) {
		background: rgba(0, 0, 0, 0.3);
	}

	:global(.prose-chat pre code) {
		background: none;
		padding: 0;
		font-size: 0.85em;
	}
</style>
