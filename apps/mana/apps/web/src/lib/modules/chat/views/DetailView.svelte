<!--
  Chat — Workbench Detail View (overlay)
  Conversation thread with streaming AI responses.
-->
<script lang="ts">
	import { useConversationMessages, useAllConversations } from '../queries';
	import { conversationsStore } from '../stores/conversations.svelte';
	import { sendAndStream } from '../services/completion';
	import { PaperPlaneRight } from '@mana/shared-icons';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	const conversationId = $derived((params.conversationId as string) ?? '');

	const allConversations = useAllConversations();
	const conversation = $derived(allConversations.value.find((c) => c.id === conversationId));

	const messagesQuery = $derived(useConversationMessages(conversationId));
	let messages = $derived(messagesQuery.value);

	let inputText = $state('');
	let isSending = $state(false);
	let streamingText = $state('');

	let messagesEl: HTMLDivElement;

	function scrollToBottom() {
		if (messagesEl) {
			requestAnimationFrame(() => {
				messagesEl.scrollTop = messagesEl.scrollHeight;
			});
		}
	}

	// Scroll when messages change or streaming updates
	$effect(() => {
		// Touch reactive dependencies
		void messages.length;
		void streamingText;
		scrollToBottom();
	});

	async function handleSend() {
		const text = inputText.trim();
		if (!text || isSending) return;

		isSending = true;
		streamingText = '';
		inputText = '';

		try {
			await sendAndStream(
				{
					conversationId,
					text,
					history: messages,
					currentTitle: conversation?.title,
					templateId: conversation?.templateId,
					model: conversation?.modelId || undefined,
				},
				(accumulated) => {
					streamingText = accumulated;
				}
			);
		} catch (e) {
			console.error('Chat send failed:', e);
		} finally {
			isSending = false;
			streamingText = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<div class="chat-detail">
	<!-- Messages -->
	<div class="messages" bind:this={messagesEl}>
		{#if messages.length === 0 && !isSending}
			<div class="empty">Schreibe eine Nachricht</div>
		{/if}

		{#each messages as msg (msg.id)}
			<div class="msg" class:user={msg.sender === 'user'}>
				<div class="bubble" class:user-bubble={msg.sender === 'user'}>
					<p class="msg-text">{msg.messageText}</p>
					<span class="msg-time">
						{new Date(msg.createdAt).toLocaleTimeString('de-DE', {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</span>
				</div>
			</div>
		{/each}

		{#if isSending && streamingText}
			<div class="msg">
				<div class="bubble">
					<p class="msg-text">{streamingText}</p>
					<span class="msg-time">...</span>
				</div>
			</div>
		{:else if isSending}
			<div class="msg">
				<div class="bubble">
					<span class="thinking-dots">●●●</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input -->
	<div class="input-bar">
		<textarea
			bind:value={inputText}
			onkeydown={handleKeydown}
			placeholder="Nachricht..."
			rows="1"
			class="input-area"
		></textarea>
		<button class="send-btn" onclick={handleSend} disabled={!inputText.trim() || isSending}>
			<PaperPlaneRight size={16} />
		</button>
	</div>
</div>

<style>
	.chat-detail {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	/* ── Messages ──────────────────────────────── */
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 0;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}

	.msg {
		display: flex;
		justify-content: flex-start;
	}
	.msg.user {
		justify-content: flex-end;
	}

	.bubble {
		max-width: 85%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		font-size: 0.8125rem;
		line-height: 1.4;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}
	.user-bubble {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.msg-text {
		white-space: pre-wrap;
		margin: 0;
		word-break: break-word;
	}

	.msg-time {
		display: block;
		margin-top: 0.125rem;
		font-size: 0.5625rem;
		opacity: 0.5;
	}

	.thinking-dots {
		font-size: 0.625rem;
		letter-spacing: 0.125rem;
		color: hsl(var(--color-muted-foreground));
		animation: dots-pulse 1.4s ease-in-out infinite;
	}

	/* ── Input ─────────────────────────────────── */
	.input-bar {
		display: flex;
		align-items: flex-end;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.input-area {
		flex: 1;
		resize: none;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		font-family: inherit;
		background: transparent;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.input-area:focus {
		border-color: hsl(var(--color-primary));
	}
	.input-area::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		cursor: pointer;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}
	.send-btn:hover:not(:disabled) {
		opacity: 0.85;
	}
	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@keyframes dots-pulse {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.messages {
			padding: 0.5rem;
		}
		.input-bar {
			padding: 0.5rem;
		}
	}
</style>
