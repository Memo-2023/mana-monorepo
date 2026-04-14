<!--
  CompanionChat — Chat interface for the Mana Companion Brain.

  Displays conversation messages, handles user input, streams LLM
  responses, and shows tool execution results inline.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { marked } from 'marked';
	import { PaperPlaneRight, Robot, User, Lightning, CircleNotch } from '@mana/shared-icons';
	import { getLocalLlmStatus } from '@mana/local-llm';
	import {
		llmSettingsState,
		updateLlmSettings,
		ALL_TIERS,
		tierLabel,
		type LlmTier,
	} from '@mana/shared-llm';
	import { chatStore } from '../stores/chat.svelte';
	import { runCompanionChat } from '../engine';
	import { useMessages } from '../queries';
	import { useDaySnapshot } from '$lib/data/projections/day-snapshot';
	import { useStreaks } from '$lib/data/projections/streaks';
	import type { LocalConversation } from '../types';

	interface Props {
		conversation: LocalConversation;
	}

	let { conversation }: Props = $props();

	// svelte-ignore state_referenced_locally
	const messages = useMessages(conversation.id);
	const day = useDaySnapshot();
	const streaks = useStreaks();
	const llmStatus = getLocalLlmStatus();

	let inputText = $state('');
	let sending = $state(false);
	let streamingText = $state('');
	let messagesEndEl = $state<HTMLDivElement | null>(null);

	marked.setOptions({ gfm: true, breaks: true });

	function renderMarkdown(text: string): string {
		try {
			return marked.parse(text, { async: false }) as string;
		} catch {
			return text;
		}
	}

	let statusLabel = $derived.by(() => {
		const s = llmStatus.current;
		if (s.state === 'downloading')
			return `Modell wird geladen... ${(s.progress * 100).toFixed(0)}%`;
		if (s.state === 'loading') return s.text || 'Modell wird vorbereitet...';
		if (s.state === 'checking') return 'WebGPU pruefen...';
		if (s.state === 'error') return `Fehler: ${s.error}`;
		return null;
	});

	// ── AI Tier selector ────────────────────────────
	// The orchestrator picks the first enabled tier from allowedTiers.
	// Showing a dropdown that sets taskOverrides['companion.chat']
	// gives the user fine-grained control per-task without changing
	// global settings.
	const llmSettings = $derived(llmSettingsState.current);
	let currentTier = $derived<LlmTier | 'auto'>(
		llmSettings.taskOverrides['companion.chat'] ?? 'auto'
	);

	function onTierChange(tier: LlmTier | 'auto') {
		const overrides = { ...llmSettings.taskOverrides };
		if (tier === 'auto') {
			delete overrides['companion.chat'];
		} else {
			overrides['companion.chat'] = tier;
		}
		updateLlmSettings({ taskOverrides: overrides });
	}

	function tierDisplay(tier: LlmTier | 'auto'): string {
		if (tier === 'auto') return 'Auto';
		return tierLabel(tier);
	}

	async function scrollToBottom() {
		await tick();
		messagesEndEl?.scrollIntoView({ behavior: 'smooth' });
	}

	$effect(() => {
		if (messages.value.length > 0) scrollToBottom();
	});

	$effect(() => {
		if (streamingText) scrollToBottom();
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
	<div class="chat-toolbar">
		<span class="toolbar-label">KI-Modus:</span>
		<select
			class="tier-select"
			value={currentTier}
			onchange={(e) => onTierChange((e.target as HTMLSelectElement).value as LlmTier | 'auto')}
			title="Waehle wo der Companion laeuft (Browser/Server/Cloud)"
		>
			<option value="auto"
				>Auto ({llmSettings.allowedTiers[0]
					? tierLabel(llmSettings.allowedTiers[0])
					: 'keine'})</option
			>
			{#each ALL_TIERS as tier}
				<option value={tier}>{tierDisplay(tier)}</option>
			{/each}
		</select>
	</div>

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
					{:else if msg.role === 'assistant'}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<div class="markdown">{@html renderMarkdown(msg.content)}</div>
					{:else}
						{msg.content}
					{/if}
				</div>
			</div>
		{/each}

		{#if sending}
			<div class="message assistant">
				<div class="message-icon">
					<Robot size={16} weight="bold" />
				</div>
				<div class="message-content">
					{#if streamingText}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<div class="markdown streaming">{@html renderMarkdown(streamingText)}</div>
					{:else if statusLabel}
						<div class="status-row">
							<CircleNotch size={14} weight="bold" />
							<span>{statusLabel}</span>
						</div>
					{:else}
						<div class="status-row">
							<CircleNotch size={14} weight="bold" />
							<span>Denkt nach...</span>
						</div>
					{/if}
				</div>
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

	.chat-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		flex-shrink: 0;
	}

	.toolbar-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.tier-select {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		cursor: pointer;
		outline: none;
	}
	.tier-select:focus {
		border-color: hsl(var(--color-primary));
	}
	.tier-select:hover {
		background: hsl(var(--color-surface-hover));
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

	/* Markdown content reset & styling */
	.markdown {
		white-space: normal;
	}
	.markdown :global(p) {
		margin: 0 0 0.5rem 0;
	}
	.markdown :global(p:last-child) {
		margin-bottom: 0;
	}
	.markdown :global(strong) {
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.markdown :global(em) {
		font-style: italic;
	}
	.markdown :global(code) {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
		background: hsl(var(--color-muted) / 0.5);
		padding: 0.0625rem 0.25rem;
		border-radius: 0.25rem;
	}
	.markdown :global(pre) {
		background: hsl(var(--color-muted) / 0.5);
		padding: 0.5rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		margin: 0.375rem 0;
	}
	.markdown :global(pre code) {
		background: transparent;
		padding: 0;
	}
	.markdown :global(ul),
	.markdown :global(ol) {
		margin: 0.25rem 0 0.5rem 0;
		padding-left: 1.25rem;
	}
	.markdown :global(li) {
		margin: 0.125rem 0;
	}
	.markdown :global(a) {
		color: hsl(var(--color-primary));
		text-decoration: underline;
	}
	.markdown :global(h1),
	.markdown :global(h2),
	.markdown :global(h3) {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0.5rem 0 0.25rem 0;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.status-row :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
