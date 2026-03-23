<script lang="ts">
	import type { ChatMessage } from '$lib/types';
	import { marked } from 'marked';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	const renderedContent = $derived(
		message.role === 'assistant' ? marked.parse(message.content, { async: false }) : message.content
	);

	function formatTime(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
	<div
		class="max-w-[80%] rounded-2xl px-4 py-3 {message.role === 'user'
			? 'rounded-br-md'
			: 'rounded-bl-md'}"
		style="background-color: {message.role === 'user'
			? 'var(--color-primary)'
			: 'var(--color-surface)'};"
	>
		{#if message.role === 'assistant'}
			<div class="prose prose-invert text-sm">
				{#if message.isStreaming && message.content === ''}
					<div class="flex items-center gap-1">
						<span class="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"
						></span>
						<span class="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"
						></span>
						<span class="h-2 w-2 animate-bounce rounded-full bg-current"></span>
					</div>
				{:else}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html renderedContent}
					{#if message.isStreaming}
						<span class="inline-block h-4 w-1 animate-pulse bg-current"></span>
					{/if}
				{/if}
			</div>
		{:else}
			<p class="text-sm whitespace-pre-wrap">{message.content}</p>
		{/if}

		<div
			class="mt-2 flex items-center gap-2 text-xs"
			style="color: {message.role === 'user'
				? 'rgba(255,255,255,0.7)'
				: 'var(--color-text-muted)'};"
		>
			<span>{formatTime(message.timestamp)}</span>
			{#if message.model}
				<span>·</span>
				<span>{message.model.split('/').pop()}</span>
			{/if}
		</div>
	</div>
</div>
