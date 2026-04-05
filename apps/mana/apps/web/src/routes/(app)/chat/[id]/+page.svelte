<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { conversationsStore } from '$lib/modules/chat/stores/conversations.svelte';
	import { messagesStore } from '$lib/modules/chat/stores/messages.svelte';
	import { useConversationMessages } from '$lib/modules/chat/queries';
	import type { Conversation, Message } from '$lib/modules/chat/types';
	import {
		PaperPlaneRight,
		ArrowLeft,
		Trash,
		PushPin,
		PencilSimple,
		Check,
		X,
		ShareNetwork,
	} from '@mana/shared-icons';
	import { ShareModal } from '@mana/shared-uload';

	const conversationsCtx: { readonly value: Conversation[] } = getContext('conversations');

	const conversationId = $derived($page.params.id ?? '');
	const conversation = $derived(conversationsCtx.value.find((c) => c.id === conversationId));

	// Live query for messages of this conversation
	const messagesQuery = $derived(useConversationMessages(conversationId));
	let messages = $derived((messagesQuery as { value: Message[] })?.value ?? []);

	let inputText = $state('');
	let isSending = $state(false);
	let isEditingTitle = $state(false);
	let editTitle = $state('');
	let showShare = $state(false);
	let shareUrl = $derived(
		`${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${conversationId}`
	);

	async function handleSend() {
		const text = inputText.trim();
		if (!text || isSending) return;

		isSending = true;
		inputText = '';

		try {
			// Add user message to IndexedDB
			await messagesStore.addUserMessage(conversationId, text);

			// Auto-set title if first message and no title
			if (messages.length <= 1 && !conversation?.title) {
				const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
				await conversationsStore.updateTitle(conversationId, title);
			}

			// NOTE: In the standalone chat app, this would call the chat backend for AI response.
			// In the unified app, the chat compute server handles streaming completions.
			// For now, messages are stored locally. AI integration will be added via
			// the chat compute server at /api/v1/chat/completions.
		} catch (e) {
			console.error('Failed to send message:', e);
		} finally {
			isSending = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function startEditTitle() {
		editTitle = conversation?.title ?? '';
		isEditingTitle = true;
	}

	async function saveTitle() {
		if (editTitle.trim()) {
			await conversationsStore.updateTitle(conversationId, editTitle.trim());
		}
		isEditingTitle = false;
	}

	function cancelEditTitle() {
		isEditingTitle = false;
	}

	async function handleDelete() {
		if (confirm('Konversation wirklich loschen?')) {
			await conversationsStore.delete(conversationId);
			goto('/chat');
		}
	}

	async function togglePin() {
		if (!conversation) return;
		if (conversation.isPinned) {
			await conversationsStore.unpin(conversationId);
		} else {
			await conversationsStore.pin(conversationId);
		}
	}
</script>

<svelte:head>
	<title>{conversation?.title || 'Chat'} - Mana</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div
		class="flex items-center gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
	>
		<a
			href="/chat"
			class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
		>
			<ArrowLeft size={20} />
		</a>

		<div class="min-w-0 flex-1">
			{#if isEditingTitle}
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={editTitle}
						onkeydown={(e) => e.key === 'Enter' && saveTitle()}
						class="flex-1 rounded border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
					/>
					<button onclick={saveTitle} class="text-[hsl(var(--primary))]">
						<Check size={18} />
					</button>
					<button onclick={cancelEditTitle} class="text-[hsl(var(--muted-foreground))]">
						<X size={18} />
					</button>
				</div>
			{:else}
				<button onclick={startEditTitle} class="group flex items-center gap-1.5 text-left">
					<h1 class="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
						{conversation?.title || 'Neue Konversation'}
					</h1>
					<PencilSimple
						size={14}
						class="shrink-0 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100"
					/>
				</button>
			{/if}
		</div>

		<div class="flex items-center gap-1">
			<button
				onclick={togglePin}
				class="rounded-lg p-1.5 transition-colors {conversation?.isPinned
					? 'text-[hsl(var(--primary))]'
					: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}"
				title={conversation?.isPinned ? 'Loslösen' : 'Anpinnen'}
			>
				<PushPin size={18} weight={conversation?.isPinned ? 'fill' : 'regular'} />
			</button>
			<button
				onclick={() => (showShare = true)}
				class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
				title="Kurzlink teilen"
			>
				<ShareNetwork size={18} />
			</button>
			<button
				onclick={handleDelete}
				class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500"
				title="Loschen"
			>
				<Trash size={18} />
			</button>
		</div>
	</div>

	<!-- Messages -->
	<div class="flex-1 overflow-y-auto px-4 py-6">
		{#if messages.length === 0}
			<div class="flex h-full items-center justify-center">
				<p class="text-sm text-[hsl(var(--muted-foreground))]">
					Schreibe eine Nachricht, um die Unterhaltung zu starten.
				</p>
			</div>
		{:else}
			<div class="mx-auto max-w-3xl space-y-4">
				{#each messages as msg (msg.id)}
					<div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm {msg.sender === 'user'
								? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
								: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'}"
						>
							<p class="whitespace-pre-wrap">{msg.messageText}</p>
							<p class="mt-1 text-[10px] opacity-60">
								{new Date(msg.createdAt).toLocaleTimeString('de-DE', {
									hour: '2-digit',
									minute: '2-digit',
								})}
							</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Input -->
	<div class="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
		<div class="mx-auto flex max-w-3xl items-end gap-3">
			<textarea
				bind:value={inputText}
				onkeydown={handleKeydown}
				placeholder="Nachricht schreiben..."
				rows="1"
				class="flex-1 resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
			></textarea>
			<button
				onclick={handleSend}
				disabled={!inputText.trim() || isSending}
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90 disabled:opacity-50"
			>
				<PaperPlaneRight size={20} />
			</button>
		</div>
	</div>
</div>

<!-- Share Modal (uLoad integration) -->
<ShareModal
	visible={showShare}
	onClose={() => (showShare = false)}
	url={shareUrl}
	title={conversation?.title ?? 'Chat'}
	source="chat"
/>
