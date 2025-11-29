<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { conversationService } from '$lib/services/conversation';
	import { chatService } from '$lib/services/chat';
	import { documentService } from '$lib/services/document';
	import { authStore } from '$lib/stores/auth.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatLayout from '$lib/components/chat/ChatLayout.svelte';
	import type { Conversation, Message, AIModel, Document } from '@chat/types';
	import {
		FileText,
		ClockCounterClockwise,
		X,
		FloppyDisk,
	} from '@manacore/shared-icons';

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
	const isDocumentMode = $derived(conversation?.documentMode ?? false);

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
			selectedModelId = conversation.modelId;

			// Load messages
			messages = await conversationService.getMessages(conversationId);

			// Load document if in document mode
			if (conversation.documentMode) {
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
			conversationId: conversationId,
			sender: 'user',
			messageText: text,
			createdAt: new Date().toISOString(),
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
</script>

<svelte:head>
	<title>{conversation?.title || 'Chat'} | ManaChat</title>
</svelte:head>

<ChatLayout>
	{#snippet children()}
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
				<!-- Main Content Area -->
				<div class="flex-1 flex overflow-hidden">
					<!-- Chat Area -->
					<div
						class="flex-1 flex flex-col overflow-hidden {isDocumentMode && showDocumentPanel
							? 'lg:w-1/2'
							: 'w-full'}"
					>
						<!-- Messages Area -->
						<main class="flex-1 overflow-hidden">
							<div class="h-full flex flex-col">
								<MessageList {messages} isTyping={isSending} />
							</div>
						</main>

						<!-- Floating Chat Input -->
						<div
							class="flex-shrink-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
						>
							<div class="max-w-3xl mx-auto">
								<ChatInput
									onSend={handleSend}
									disabled={isSending}
									{models}
									{selectedModelId}
									onModelSelect={handleModelSelect}
									documentMode={isDocumentMode}
								/>
							</div>
						</div>
					</div>

					<!-- Document Panel -->
					{#if isDocumentMode && showDocumentPanel}
						<div class="hidden lg:flex lg:w-1/2 flex-col border-l border-border bg-surface">
							<!-- Document Header -->
							<div
								class="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/50 backdrop-blur-sm"
							>
								<div class="flex items-center gap-2">
									<FileText size={18} weight="bold" class="text-primary" />
									<span class="font-medium text-foreground">Dokument</span>
									{#if document}
										<span
											class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-lg"
										>
											v{document.version}
										</span>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={loadVersions}
										class="p-2 text-muted-foreground hover:text-foreground
                               hover:bg-muted rounded-lg transition-colors"
										title="Versionen anzeigen"
									>
										<ClockCounterClockwise size={16} weight="bold" />
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
											<FloppyDisk size={16} weight="bold" />
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
                             bg-muted/50 text-foreground
                             border border-border rounded-xl
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
						class="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg z-50"
					>
						{error}
					</div>
				{/if}
			</div>

			<!-- Versions Modal -->
			{#if showVersionsModal}
				<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div
						class="bg-surface rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-border"
					>
						<div class="flex items-center justify-between p-4 border-b border-border">
							<h3 class="text-lg font-semibold text-foreground">Dokumentversionen</h3>
							<button
								onclick={() => (showVersionsModal = false)}
								class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
								aria-label="Schließen"
							>
								<X size={18} weight="bold" />
							</button>
						</div>
						<div class="flex-1 overflow-auto p-4">
							{#if documentVersions.length === 0}
								<p class="text-center text-muted-foreground py-8">Keine Versionen vorhanden</p>
							{:else}
								<div class="space-y-2">
									{#each documentVersions as version (version.id)}
										<button
											onclick={() => restoreVersion(version)}
											class="w-full p-4 text-left rounded-xl border
                                 hover:bg-muted/50 transition-colors
                                 {version.id === document?.id
												? 'border-primary bg-primary/5 ring-2 ring-primary'
												: 'border-border'}"
										>
											<div class="flex items-center justify-between mb-1">
												<span class="font-medium text-foreground">
													Version {version.version}
													{version.id === document?.id ? ' (aktuell)' : ''}
												</span>
												<span class="text-xs text-muted-foreground">
													{new Date(version.createdAt).toLocaleDateString('de-DE', {
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
	{/snippet}
</ChatLayout>
