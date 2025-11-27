<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { chatService } from '$lib/services/chat';
	import { conversationService } from '$lib/services/conversation';
	import { templateService } from '$lib/services/template';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ModelSelector from '$lib/components/chat/ModelSelector.svelte';
	import { theme } from '$lib/stores/theme';
	import type { AIModel, Message, Template } from '@chat/types';

	let models = $state<AIModel[]>([]);
	let templates = $state<Template[]>([]);
	let selectedModelId = $state('');
	let selectedTemplateId = $state('');
	let documentMode = $state(false);
	let messages = $state<Message[]>([]);
	let isLoading = $state(true);
	let isSending = $state(false);
	let error = $state<string | null>(null);

	// Get selected template
	const selectedTemplate = $derived(templates.find((t) => t.id === selectedTemplateId));

	onMount(async () => {
		models = await chatService.getModels();
		if (models.length > 0) {
			selectedModelId = models[0].id;
		}

		// Load user templates
		if (authStore.user) {
			templates = await templateService.getTemplates(authStore.user.id);
		}

		isLoading = false;
	});

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

	function toggleTheme() {
		theme.toggleMode();
	}
</script>

<svelte:head>
	<title>Chat | ManaChat</title>
</svelte:head>

<div class="flex flex-col h-full">
	<!-- Chat Header -->
	<header
		class="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
	>
		<div class="flex items-center justify-between max-w-4xl mx-auto">
			<div class="flex items-center gap-3 flex-wrap">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Neuer Chat</h2>

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
						class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
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
						? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
						: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'}
                 hover:bg-opacity-80 disabled:opacity-50"
					title="Dokumentmodus aktivieren"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Dokument
				</button>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={toggleTheme}
					class="p-2 text-gray-700 dark:text-gray-300
                 bg-gray-100 dark:bg-gray-800 rounded-lg
                 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

	<!-- Messages Area -->
	<main class="flex-1 overflow-hidden bg-white dark:bg-gray-900">
		<div class="h-full max-w-4xl mx-auto flex flex-col">
			<MessageList {messages} isTyping={isSending} />
		</div>
	</main>

	<!-- Input Area -->
	<ChatInput onSend={handleSend} disabled={isSending || isLoading} />

	<!-- Error Message -->
	{#if error}
		<div
			class="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg"
		>
			{error}
		</div>
	{/if}
</div>
