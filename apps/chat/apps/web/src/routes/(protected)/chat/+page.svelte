<script lang="ts">
	import { goto } from '$app/navigation';
	import { chatService } from '$lib/services/chat';
	import { conversationService } from '$lib/services/conversation';
	import { templateService } from '$lib/services/template';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatLayout from '$lib/components/chat/ChatLayout.svelte';
	import type { AIModel, Message, Template } from '@chat/types';
	import { Sparkle } from '@manacore/shared-icons';

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
			conversationId: '',
			sender: 'user',
			messageText: text,
			createdAt: new Date().toISOString(),
		};
		messages = [...messages, tempUserMessage];

		try {
			// Determine mode and model based on template
			const mode = selectedTemplate ? 'template' : 'free';
			const modelToUse = selectedTemplate?.modelId || selectedModelId;
			const docMode = selectedTemplate?.documentMode || documentMode;

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
		if (template?.modelId) {
			selectedModelId = template.modelId;
		}
		// If template has document mode, enable it
		if (template?.documentMode) {
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
		<div class="flex flex-col h-full bg-background">
			<!-- Messages Area -->
			<main class="flex-1 overflow-hidden">
				{#if messages.length === 0 && !isSending}
					<!-- Empty State - Centered Content -->
					<div class="h-full flex flex-col items-center justify-center px-6">
						<div class="text-center max-w-xl w-full">
							<!-- Icon -->
							<div
								class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 shadow-lg flex items-center justify-center"
							>
								<Sparkle size={40} weight="duotone" class="text-primary" />
							</div>

							<!-- Title -->
							<h3 class="text-2xl font-semibold text-foreground mb-3">Worüber möchtest du reden?</h3>
							<p class="text-muted-foreground mb-8">
								Stelle eine Frage, bitte um Hilfe bei einem Projekt oder starte einfach eine
								Unterhaltung.
							</p>

							<!-- Suggestion Pills -->
							<div class="flex flex-wrap justify-center gap-3">
								<button
									onclick={() => handleSend('Erkläre mir, wie KI funktioniert')}
									class="px-5 py-2.5 text-sm font-medium rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 text-foreground shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
								>
									Erkläre mir KI
								</button>
								<button
									onclick={() => handleSend('Hilf mir beim Schreiben eines Textes')}
									class="px-5 py-2.5 text-sm font-medium rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 text-foreground shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
								>
									Beim Schreiben helfen
								</button>
								<button
									onclick={() => handleSend('Was sind aktuelle Technologie-Trends?')}
									class="px-5 py-2.5 text-sm font-medium rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 text-foreground shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5"
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
			<div class="flex-shrink-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
				<div class="max-w-3xl mx-auto">
					<ChatInput
						onSend={handleSend}
						disabled={isSending || isLoading}
						{models}
						{selectedModelId}
						onModelSelect={handleModelSelect}
						{documentMode}
						onDocumentModeToggle={toggleDocumentMode}
					/>
				</div>
			</div>

			<!-- Error Message -->
			{#if error}
				<div
					class="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-destructive/30 text-destructive rounded-full shadow-lg z-50"
				>
					{error}
				</div>
			{/if}
		</div>
	{/snippet}
</ChatLayout>
