<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { conversationService } from '$lib/services/conversation';
	import { chatService } from '$lib/services/chat';
	import { documentService } from '$lib/services/document';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ModelSelector from '$lib/components/chat/ModelSelector.svelte';
	import type { Conversation, Message, AIModel, Document } from '@chat/types';

	let conversation = $state<Conversation | null>(null);
	let messages = $state<Message[]>([]);
	let models = $state<AIModel[]>([]);
	let selectedModelId = $state('');
	let isLoading = $state(true);
	let isSending = $state(false);
	let error = $state<string | null>(null);

	// Document mode state
	let document = $state<Document | null>(null);
	let documentContent = $state('');
	let documentVersions = $state<Document[]>([]);
	let isSavingDocument = $state(false);
	let showVersionsModal = $state(false);
	let showDocumentPanel = $state(true);

	const conversationId = $derived($page.params.id ?? '');
	const isDocumentMode = $derived(conversation?.document_mode ?? false);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		isLoading = true;
		error = null;

		try {
			// Load models
			models = await chatService.getModels();

			// Load conversation
			conversation = await conversationService.getConversation(conversationId);

			if (!conversation) {
				error = 'Konversation nicht gefunden';
				return;
			}

			// Set model from conversation
			selectedModelId = conversation.model_id;

			// Load messages
			messages = await conversationService.getMessages(conversationId);

			// Load document if in document mode
			if (conversation.document_mode) {
				document = await documentService.getLatestDocument(conversationId);
				documentContent = document?.content ?? '';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
		} finally {
			isLoading = false;
		}
	}

	async function saveDocument() {
		if (!documentContent.trim()) return;

		isSavingDocument = true;
		try {
			if (document) {
				// Create new version
				document = await documentService.createDocumentVersion(conversationId, documentContent);
			} else {
				// Create first document
				document = await documentService.createDocument(conversationId, documentContent);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Speichern';
		} finally {
			isSavingDocument = false;
		}
	}

	async function loadVersions() {
		documentVersions = await documentService.getAllDocumentVersions(conversationId);
		showVersionsModal = true;
	}

	function restoreVersion(version: Document) {
		documentContent = version.content;
		showVersionsModal = false;
	}

	function toggleDocumentPanel() {
		showDocumentPanel = !showDocumentPanel;
	}

	async function handleSend(text: string) {
		if (!conversation || !selectedModelId) return;

		isSending = true;
		error = null;

		// Optimistic update - add user message
		const tempUserMessage: Message = {
			id: `temp-user-${Date.now()}`,
			conversation_id: conversationId,
			sender: 'user',
			message_text: text,
			created_at: new Date().toISOString(),
		};
		messages = [...messages, tempUserMessage];

		try {
			const result = await conversationService.sendMessageAndGetResponse(
				conversationId,
				text,
				selectedModelId
			);

			// Update messages with real data
			messages = await conversationService.getMessages(conversationId);

			// Update conversation title if generated
			if (result.title && conversation) {
				conversation = { ...conversation, title: result.title };
				conversationsStore.updateConversation(conversationId, { title: result.title });
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Senden';
			// Remove optimistic message on error
			messages = messages.filter((m) => m.id !== tempUserMessage.id);
		} finally {
			isSending = false;
		}
	}

	function handleModelSelect(modelId: string) {
		selectedModelId = modelId;
	}

	async function handleArchive() {
		if (!conversation) return;

		const success = await conversationsStore.archiveConversation(conversationId);
		if (success) {
			goto('/chat');
		}
	}

	async function handleDelete() {
		if (!conversation) return;

		if (confirm('Möchtest du diese Konversation wirklich löschen?')) {
			const success = await conversationsStore.deleteConversation(conversationId);
			if (success) {
				goto('/chat');
			}
		}
	}

	function toggleTheme() {
		theme.toggleMode();
	}
</script>

<svelte:head>
	<title>{conversation?.title || 'Chat'} | ManaChat</title>
</svelte:head>

{#if isLoading}
	<div class="flex items-center justify-center h-full">
		<div
			class="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full"
		></div>
	</div>
{:else if error && !conversation}
	<div class="flex flex-col items-center justify-center h-full text-center p-4">
		<p class="text-destructive mb-4">{error}</p>
		<a href="/chat" class="text-primary hover:underline">Zurück zum Chat</a>
	</div>
{:else}
	<div class="flex flex-col h-full">
		<!-- Chat Header -->
		<header
			class="flex-shrink-0 border-b border-border bg-surface px-4 py-3"
		>
			<div class="flex items-center justify-between max-w-4xl mx-auto">
				<div class="flex items-center gap-4">
					<h2 class="text-lg font-semibold text-foreground truncate max-w-xs">
						{conversation?.title || 'Chat'}
					</h2>
					<ModelSelector
						{models}
						{selectedModelId}
						onSelect={handleModelSelect}
						disabled={isSending}
					/>
				</div>
				<div class="flex items-center gap-2">
					{#if isDocumentMode}
						<button
							onclick={toggleDocumentPanel}
							class="p-2 transition-colors rounded-lg
                     {showDocumentPanel
								? 'text-primary bg-primary/10'
								: 'text-foreground bg-muted hover:bg-muted/80'}"
							aria-label="Dokument-Panel"
							title="Dokument-Panel ein/ausblenden"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</button>
					{/if}
					<button
						onclick={handleArchive}
						class="p-2 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
						aria-label="Archivieren"
						title="Archivieren"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
							/>
						</svg>
					</button>
					<button
						onclick={handleDelete}
						class="p-2 text-destructive bg-muted rounded-lg hover:bg-destructive/10 transition-colors"
						aria-label="Löschen"
						title="Löschen"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
					<button
						onclick={toggleTheme}
						class="p-2 text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
						aria-label="Theme wechseln"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</header>

		<!-- Main Content Area -->
		<div class="flex-1 flex overflow-hidden">
			<!-- Chat Area -->
			<div
				class="flex-1 flex flex-col overflow-hidden {isDocumentMode && showDocumentPanel
					? 'lg:w-1/2'
					: 'w-full'}"
			>
				<!-- Messages Area -->
				<main class="flex-1 overflow-hidden bg-surface">
					<div class="h-full max-w-4xl mx-auto flex flex-col">
						<MessageList {messages} isTyping={isSending} />
					</div>
				</main>

				<!-- Input Area -->
				<ChatInput onSend={handleSend} disabled={isSending} />
			</div>

			<!-- Document Panel -->
			{#if isDocumentMode && showDocumentPanel}
				<div
					class="hidden lg:flex lg:w-1/2 flex-col border-l border-border bg-surface"
				>
					<!-- Document Header -->
					<div
						class="flex items-center justify-between px-4 py-3 border-b border-border"
					>
						<div class="flex items-center gap-2">
							<svg
								class="w-5 h-5 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<span class="font-medium text-foreground">Dokument</span>
							{#if document}
								<span
									class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
								>
									v{document.version}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={loadVersions}
								class="p-1.5 text-muted-foreground hover:text-foreground
                       hover:bg-muted rounded transition-colors"
								title="Versionen anzeigen"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</button>
							<button
								onclick={saveDocument}
								disabled={isSavingDocument || !documentContent.trim()}
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-foreground
                       bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground
                       rounded-lg transition-colors"
							>
								{#if isSavingDocument}
									<div
										class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
									></div>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
										/>
									</svg>
								{/if}
								Speichern
							</button>
						</div>
					</div>

					<!-- Document Editor -->
					<div class="flex-1 p-4 overflow-auto">
						<textarea
							bind:value={documentContent}
							placeholder="Beginne hier mit dem Schreiben deines Dokuments...

Du kannst Markdown verwenden:
# Überschrift
## Unterüberschrift
- Aufzählung
**Fett** und *Kursiv*"
							class="w-full h-full min-h-[300px] p-4 text-sm font-mono
                     bg-muted text-foreground
                     border border-border rounded-lg
                     focus:ring-2 focus:ring-primary focus:border-transparent
                     resize-none"
						></textarea>
					</div>
				</div>
			{/if}
		</div>

		<!-- Error Message -->
		{#if error}
			<div
				class="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg"
			>
				{error}
			</div>
		{/if}
	</div>

	<!-- Versions Modal -->
	{#if showVersionsModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div
				class="bg-surface rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
			>
				<div
					class="flex items-center justify-between p-4 border-b border-border"
				>
					<h3 class="text-lg font-semibold text-foreground">Dokumentversionen</h3>
					<button
						onclick={() => (showVersionsModal = false)}
						class="p-1 text-muted-foreground hover:text-foreground"
						aria-label="Schließen"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div class="flex-1 overflow-auto p-4">
					{#if documentVersions.length === 0}
						<p class="text-center text-muted-foreground py-8">
							Keine Versionen vorhanden
						</p>
					{:else}
						<div class="space-y-2">
							{#each documentVersions as version (version.id)}
								<button
									onclick={() => restoreVersion(version)}
									class="w-full p-3 text-left rounded-lg border border-border
                         hover:bg-muted transition-colors
                         {version.id === document?.id ? 'ring-2 ring-primary' : ''}"
								>
									<div class="flex items-center justify-between mb-1">
										<span class="font-medium text-foreground">
											Version {version.version}
											{version.id === document?.id ? ' (aktuell)' : ''}
										</span>
										<span class="text-xs text-muted-foreground">
											{new Date(version.created_at).toLocaleDateString('de-DE', {
												day: '2-digit',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									</div>
									<p class="text-sm text-muted-foreground line-clamp-2">
										{version.content.substring(0, 100)}...
									</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}
