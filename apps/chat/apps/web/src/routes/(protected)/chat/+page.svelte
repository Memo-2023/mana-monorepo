<script lang="ts">
	import { goto } from '$app/navigation';
	import { chatService } from '$lib/services/chat';
	import { conversationService } from '$lib/services/conversation';
	import { templateService } from '$lib/services/template';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ModelSelector from '$lib/components/chat/ModelSelector.svelte';
	import ChatLayout from '$lib/components/chat/ChatLayout.svelte';
	import type { AIModel, Message, Template } from '@chat/types';
	import { FileText, Sparkle } from '@manacore/shared-icons';

	let models = $state<AIModel[]>([]);
	let templates = $state<Template[]>([]);
	let selectedModelId = $state('');
	let selectedTemplateId = $state('');
	let documentMode = $state(false);
	let messages = $state<Message[]>([]);
	let isLoading = $state(true);
	let isSending = $state(false);
	let error = $state<string | null>(null);
	let dataLoaded = $state(false);

	// Get selected template
	const selectedTemplate = $derived(templates.find((t) => t.id === selectedTemplateId));

	// Wait for auth to be initialized before loading data
	$effect(() => {
		if (authStore.initialized && !dataLoaded) {
			loadData();
		}
	});

	async function loadData() {
		dataLoaded = true;
		models = await chatService.getModels();
		if (models.length > 0) {
			// Find default model, or fall back to first model
			const defaultModel = models.find((m) => m.isDefault);
			selectedModelId = defaultModel?.id || models[0].id;
		}

		// Load user templates
		if (authStore.user) {
			templates = await templateService.getTemplates(authStore.user.id);
		}

		isLoading = false;
	}

	async function handleSend(text: string) {
		if (!authStore.user || !selectedModelId) return;

		isSending = true;
		error = null;

		// Add optimistic user message
		const tempUserMessage: Message = {
			id: `temp-${Date.now()}`,
			conversation_id: '',
			sender: 'user',
			message_text: text,
			created_at: new Date().toISOString(),
		};
		messages = [...messages, tempUserMessage];

		try {
			// Determine mode and model based on template
			const mode = selectedTemplate ? 'template' : 'free';
			const modelToUse = selectedTemplate?.model_id || selectedModelId;
			const docMode = selectedTemplate?.document_mode || documentMode;

			// Create new conversation
			const conversationId = await conversationService.createConversation(
				authStore.user.id,
				modelToUse,
				mode as 'free' | 'guided' | 'template',
				selectedTemplate?.id,
				docMode
			);

			if (!conversationId) {
				throw new Error('Konversation konnte nicht erstellt werden');
			}

			// Send message and get response
			const result = await conversationService.sendMessageAndGetResponse(
				conversationId,
				text,
				modelToUse
			);

			// Reload conversations list
			await conversationsStore.loadConversations(authStore.user.id);

			// Navigate to the new conversation
			goto(`/chat/${conversationId}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Erstellen der Konversation';
			messages = [];
		} finally {
			isSending = false;
		}
	}

	function handleModelSelect(modelId: string) {
		selectedModelId = modelId;
	}

	function handleTemplateSelect(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedTemplateId = target.value;

		// If template has a model, update selected model
		const template = templates.find((t) => t.id === target.value);
		if (template?.model_id) {
			selectedModelId = template.model_id;
		}
		// If template has document mode, enable it
		if (template?.document_mode) {
			documentMode = true;
		}
	}

	function toggleDocumentMode() {
		documentMode = !documentMode;
	}
</script>

<svelte:head>
	<title>Chat | ManaChat</title>
</svelte:head>

<ChatLayout>
	{#snippet children()}
		<div class="flex flex-col h-full">
			<!-- Welcome Header -->
			<div class="flex-shrink-0 border-b border-border bg-surface/50 backdrop-blur-sm px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
						>
							<Sparkle size={22} weight="fill" class="text-primary-foreground" />
						</div>
						<div>
							<h2 class="text-lg font-semibold text-foreground">Neuer Chat</h2>
							<p class="text-sm text-muted-foreground">Starte eine neue Unterhaltung</p>
						</div>
					</div>
					<div class="flex items-center gap-3 flex-wrap">
						<!-- Model Selector -->
						<ModelSelector
							{models}
							{selectedModelId}
							onSelect={handleModelSelect}
							disabled={isSending}
						/>

						<!-- Template Selector -->
						{#if templates.length > 0}
							<select
								onchange={handleTemplateSelect}
								value={selectedTemplateId}
								disabled={isSending}
								class="px-3 py-1.5 text-sm border border-border rounded-lg
                       bg-surface text-foreground
                       focus:ring-2 focus:ring-primary focus:border-transparent
                       disabled:opacity-50"
							>
								<option value="">Ohne Vorlage</option>
								{#each templates as template}
									<option value={template.id}>
										{template.name}
										{template.is_default ? ' (Standard)' : ''}
									</option>
								{/each}
							</select>
						{/if}

						<!-- Document Mode Toggle -->
						<button
							onclick={toggleDocumentMode}
							disabled={isSending}
							class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors
                     {documentMode
								? 'bg-primary/10 text-primary border border-primary/30'
								: 'bg-muted text-muted-foreground border border-border'}
                     hover:bg-opacity-80 disabled:opacity-50"
							title="Dokumentmodus aktivieren"
						>
							<FileText size={16} weight="bold" />
							Dokument
						</button>
					</div>
				</div>
			</div>

			<!-- Messages Area -->
			<main class="flex-1 overflow-hidden">
				{#if messages.length === 0 && !isSending}
					<!-- Empty State -->
					<div class="h-full flex flex-col items-center justify-center px-6">
						<div class="text-center max-w-md">
							<div
								class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
							>
								<Sparkle size={32} weight="duotone" class="text-primary" />
							</div>
							<h3 class="text-xl font-semibold text-foreground mb-2">Worüber möchtest du reden?</h3>
							<p class="text-muted-foreground mb-6">
								Stelle eine Frage, bitte um Hilfe bei einem Projekt oder starte einfach eine
								Unterhaltung.
							</p>
							<div class="flex flex-wrap justify-center gap-2">
								<button
									onclick={() => handleSend('Erkläre mir, wie KI funktioniert')}
									class="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
								>
									Erkläre mir KI
								</button>
								<button
									onclick={() => handleSend('Hilf mir beim Schreiben eines Textes')}
									class="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
								>
									Beim Schreiben helfen
								</button>
								<button
									onclick={() => handleSend('Was sind aktuelle Technologie-Trends?')}
									class="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
								>
									Tech-Trends
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="h-full flex flex-col">
						<MessageList {messages} isTyping={isSending} />
					</div>
				{/if}
			</main>

			<!-- Floating Chat Input -->
			<div class="flex-shrink-0 p-4 bg-gradient-to-t from-surface via-surface to-transparent">
				<div class="max-w-3xl mx-auto">
					<ChatInput onSend={handleSend} disabled={isSending || isLoading} />
				</div>
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
	{/snippet}
</ChatLayout>
