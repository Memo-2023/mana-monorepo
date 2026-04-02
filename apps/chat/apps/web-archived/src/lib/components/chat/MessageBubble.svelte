<script lang="ts">
	import { marked } from 'marked';
	import type { Message } from '@chat/types';
	import { Robot, User } from '@manacore/shared-icons';

	interface Props {
		message: Message;
	}

	let { message }: Props = $props();

	const isUser = $derived(message.sender === 'user');

	// Configure marked for safe rendering
	marked.setOptions({
		breaks: true,
		gfm: true,
	});

	const htmlContent = $derived(
		isUser ? message.messageText : marked.parse(message.messageText || '')
	);

	const formattedTime = $derived(
		new Date(message.createdAt).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		})
	);
</script>

<div class="group flex gap-3 {isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 animate-fade-in">
	<!-- Avatar -->
	<div
		class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md
			   {isUser
			? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
			: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'}"
	>
		{#if isUser}
			<User size={18} weight="bold" />
		{:else}
			<Robot size={18} weight="bold" />
		{/if}
	</div>

	<!-- Message Content -->
	<div class="flex flex-col {isUser ? 'items-end' : 'items-start'} max-w-[75%]">
		<!-- Bubble -->
		<div
			class="relative px-4 py-3 shadow-md
				   {isUser
				? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-md'
				: 'bg-white dark:bg-white/10 text-foreground border border-black/5 dark:border-white/10 rounded-2xl rounded-tl-md'}"
		>
			{#if isUser}
				<p class="whitespace-pre-wrap text-[15px] leading-relaxed">{message.messageText}</p>
			{:else}
				<div class="prose-chat">
					{@html htmlContent}
				</div>
			{/if}
		</div>

		<!-- Time -->
		<div
			class="flex items-center gap-2 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
		>
			<span class="text-xs text-muted-foreground">
				{formattedTime}
			</span>
		</div>
	</div>
</div>

<style>
	/* Fade-in animation */
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	/* Markdown/Prose styling for assistant messages */
	:global(.prose-chat) {
		font-size: 15px;
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

	:global(.prose-chat blockquote) {
		border-left: 3px solid var(--color-primary, #3b82f6);
		padding-left: 1em;
		margin: 0.75em 0;
		color: var(--color-muted-foreground);
		font-style: italic;
	}

	:global(.prose-chat h1),
	:global(.prose-chat h2),
	:global(.prose-chat h3),
	:global(.prose-chat h4) {
		margin-top: 1em;
		margin-bottom: 0.5em;
		font-weight: 600;
		line-height: 1.3;
	}

	:global(.prose-chat h1) {
		font-size: 1.25em;
	}

	:global(.prose-chat h2) {
		font-size: 1.15em;
	}

	:global(.prose-chat h3) {
		font-size: 1.05em;
	}

	:global(.prose-chat a) {
		color: var(--color-primary, #3b82f6);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.prose-chat a:hover) {
		text-decoration: none;
	}

	:global(.prose-chat hr) {
		border: none;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		margin: 1em 0;
	}

	:global(.dark .prose-chat hr) {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	:global(.prose-chat table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.75em 0;
		font-size: 0.9em;
	}

	:global(.prose-chat th),
	:global(.prose-chat td) {
		padding: 0.5em 0.75em;
		border: 1px solid rgba(0, 0, 0, 0.1);
		text-align: left;
	}

	:global(.dark .prose-chat th),
	:global(.dark .prose-chat td) {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.prose-chat th) {
		background: rgba(0, 0, 0, 0.03);
		font-weight: 600;
	}

	:global(.dark .prose-chat th) {
		background: rgba(255, 255, 255, 0.05);
	}
</style>
