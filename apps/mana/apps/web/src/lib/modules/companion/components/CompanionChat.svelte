<!--
  CompanionChat — Chat interface for the Mana Companion Brain.

  Displays conversation messages, handles user input, streams LLM
  responses, and shows tool execution results inline.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { PaperPlaneRight, Robot, User, Lightning, CircleNotch } from '@mana/shared-icons';
	import { chatStore } from '../stores/chat.svelte';
	import { runCompanionChat, isCompanionAvailable } from '../engine';
	import { useMessages } from '../queries';
	import { useDaySnapshot } from '$lib/data/projections/day-snapshot';
	import { useStreaks } from '$lib/data/projections/streaks';
	import type { LocalConversation, LocalMessage } from '../types';

	interface Props {
		conversation: LocalConversation;
	}

	let { conversation }: Props = $props();

	const messages = useMessages(conversation.id);
	const day = useDaySnapshot();
	const streaks = useStreaks();

	let inputText = $state('');
	let sending = $state(false);
	let streamingText = $state('');
	let messagesEndEl = $state<HTMLDivElement | null>(null);

	async function scrollToBottom() {
		await tick();
		messagesEndEl?.scrollIntoView({ behavior: 'smooth' });
	}

	$effect(() => {
		if (messages.value.length > 0) scrollToBottom();
	});

	async function handleSend() {
		const text = inputText.trim();
		if (!text || sending) return;

		inputText = '';
		sending = true;
		streamingText = '';

		// Add user message
		await chatStore.addMessage(conversation.id, 'user', text);
		await scrollToBottom();

		try {
			const result = await runCompanionChat(
				text,
				messages.value,
				day.value,
				streaks.value,
				(token) => {
					streamingText += token;
				}
			);

			// Add tool results as separate messages
			for (const tc of result.toolCalls) {
				await chatStore.addMessage(conversation.id, 'assistant', '', {
					toolCall: { name: tc.name, params: tc.params },
				});
				await chatStore.addMessage(conversation.id, 'tool_result', tc.result.message, {
					toolResult: tc.result,
				});
			}

			// Add final assistant message
			if (result.content) {
				await chatStore.addMessage(conversation.id, 'assistant', result.content);
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Fehler bei der Verarbeitung';
			await chatStore.addMessage(conversation.id, 'assistant', `Fehler: ${msg}`);
		} finally {
			sending = false;
			streamingText = '';
			await scrollToBottom();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<div class="companion-chat">
	<div class="messages">
		{#each messages.value as msg (msg.id)}
			<div
				class="message"
				class:user={msg.role === 'user'}
				class:assistant={msg.role === 'assistant'}
				class:tool={msg.role === 'tool_result'}
			>
				<div class="message-icon">
					{#if msg.role === 'user'}
						<User size={16} weight="bold" />
					{:else if msg.role === 'tool_result'}
						<Lightning size={16} weight="bold" />
					{:else}
						<Robot size={16} weight="bold" />
					{/if}
				</div>
				<div class="message-content">
					{#if msg.toolCall}
						<span class="tool-badge">{msg.toolCall.name}</span>
					{/if}
					{#if msg.toolResult}
						<span
							class="tool-result"
							class:success={msg.toolResult.success}
							class:error={!msg.toolResult.success}
						>
							{msg.content}
						</span>
					{:else}
						{msg.content}
					{/if}
				</div>
			</div>
		{/each}

		{#if sending && streamingText}
			<div class="message assistant">
				<div class="message-icon">
					<Robot size={16} weight="bold" />
				</div>
				<div class="message-content streaming">{streamingText}</div>
			</div>
		{/if}

		<div bind:this={messagesEndEl}></div>
	</div>

	<div class="input-area">
		<textarea
			class="chat-input"
			bind:value={inputText}
			onkeydown={handleKeydown}
			placeholder="Nachricht an Companion..."
			disabled={sending}
			rows={1}
		></textarea>
		<button class="send-btn" onclick={handleSend} disabled={sending || !inputText.trim()}>
			{#if sending}
				<CircleNotch size={18} weight="bold" />
			{:else}
				<PaperPlaneRight size={18} weight="bold" />
			{/if}
		</button>
	</div>
</div>

<style>
	.companion-chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-height: calc(100dvh - var(--bottom-chrome-height, 80px) - 6rem);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.message {
		display: flex;
		gap: 0.5rem;
		max-width: 85%;
	}

	.message.user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.message.assistant {
		align-self: flex-start;
	}

	.message.tool {
		align-self: flex-start;
		font-size: 0.8125rem;
	}

	.message-icon {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.3);
	}

	.message.user .message-icon {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}

	.message.tool .message-icon {
		background: hsl(var(--color-warning, 45 93% 47%) / 0.15);
		color: hsl(var(--color-warning, 45 93% 47%));
	}

	.message-content {
		padding: 0.625rem 0.875rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.message.user .message-content {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-bottom-right-radius: 0.25rem;
	}

	.message.assistant .message-content {
		background: hsl(var(--color-muted) / 0.3);
		color: hsl(var(--color-foreground));
		border-bottom-left-radius: 0.25rem;
	}

	.message.tool .message-content {
		background: hsl(var(--color-muted) / 0.15);
		color: hsl(var(--color-muted-foreground));
		border-radius: 0.5rem;
		padding: 0.375rem 0.625rem;
	}

	.streaming {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.tool-badge {
		display: inline-block;
		font-size: 0.6875rem;
		font-weight: 600;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		margin-bottom: 0.25rem;
	}

	.tool-result.success {
		color: hsl(var(--color-success, 142 71% 45%));
	}

	.tool-result.error {
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.input-area {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
	}

	.chat-input {
		flex: 1;
		padding: 0.625rem 0.875rem;
		border-radius: 1rem;
		border: 1.5px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		resize: none;
		outline: none;
		font-family: inherit;
		transition: border-color 0.15s;
	}

	.chat-input:focus {
		border-color: hsl(var(--color-primary));
	}

	.chat-input:disabled {
		opacity: 0.6;
	}

	.send-btn {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.send-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
