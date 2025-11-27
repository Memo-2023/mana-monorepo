<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { templatesStore } from '$lib/stores/templates.svelte';
	import { conversationService } from '$lib/services/conversation';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import TemplateCard from '$lib/components/templates/TemplateCard.svelte';
	import TemplateForm from '$lib/components/templates/TemplateForm.svelte';
	import type { Template } from '@chat/types';

	let showForm = $state(false);
	let editingTemplate = $state<Template | undefined>(undefined);

	onMount(async () => {
		if (authStore.user) {
			await templatesStore.loadTemplates(authStore.user.id);
		}
	});

	function handleCreateNew() {
		editingTemplate = undefined;
		showForm = true;
	}

	function handleEdit(id: string) {
		const template = templatesStore.templates.find((t) => t.id === id);
		if (template) {
			editingTemplate = template;
			showForm = true;
		}
	}

	async function handleDelete(id: string) {
		if (confirm('Möchtest du diese Vorlage wirklich löschen?')) {
			await templatesStore.deleteTemplate(id);
		}
	}

	async function handleSetDefault(id: string) {
		if (authStore.user) {
			await templatesStore.setDefaultTemplate(id, authStore.user.id);
		}
	}

	async function handleUse(id: string) {
		const template = templatesStore.templates.find((t) => t.id === id);
		if (!template || !authStore.user) return;

		// Create a new conversation with this template
		const conversationId = await conversationService.createConversation(
			authStore.user.id,
			template.model_id || '550e8400-e29b-41d4-a716-446655440004', // Default to GPT-4o-Mini
			'template',
			template.id,
			template.document_mode
		);

		if (conversationId) {
			await conversationsStore.loadConversations(authStore.user.id);
			goto(`/chat/${conversationId}`);
		}
	}

	async function handleSubmit(data: Partial<Template>) {
		if (!authStore.user) return;

		if (data.id) {
			// Update existing template
			await templatesStore.updateTemplate(data.id, {
				name: data.name,
				description: data.description,
				system_prompt: data.system_prompt,
				initial_question: data.initial_question,
				color: data.color,
				model_id: data.model_id,
				document_mode: data.document_mode,
			});
		} else {
			// Create new template
			await templatesStore.createTemplate({
				user_id: authStore.user.id,
				name: data.name!,
				description: data.description ?? null,
				system_prompt: data.system_prompt!,
				initial_question: data.initial_question ?? null,
				color: data.color!,
				model_id: data.model_id ?? null,
				is_default: false,
				document_mode: data.document_mode ?? false,
			});
		}

		showForm = false;
		editingTemplate = undefined;
	}

	function handleCancel() {
		showForm = false;
		editingTemplate = undefined;
	}
</script>

<svelte:head>
	<title>Vorlagen | ManaChat</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Vorlagen</h1>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Erstelle Vorlagen mit benutzerdefinierten System-Prompts für verschiedene
					KI-Verhaltensweisen.
				</p>
			</div>
			<button
				onclick={handleCreateNew}
				class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
               hover:bg-blue-700 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Neue Vorlage
			</button>
		</div>

		<!-- Loading State -->
		{#if templatesStore.isLoading}
			<div class="flex items-center justify-center py-16">
				<div
					class="animate-spin w-8 h-8 border-4 border-blue-500 border-r-transparent rounded-full"
				></div>
			</div>
		{:else if templatesStore.templates.length === 0}
			<!-- Empty State -->
			<div class="text-center py-16">
				<svg
					class="w-16 h-16 text-gray-400 mx-auto mb-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
					Keine Vorlagen vorhanden
				</h3>
				<p class="text-gray-500 dark:text-gray-400 mb-4">
					Erstelle deine erste Vorlage, um loszulegen
				</p>
				<button
					onclick={handleCreateNew}
					class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
                 hover:bg-blue-700 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Erste Vorlage erstellen
				</button>
			</div>
		{:else}
			<!-- Templates Grid -->
			<div class="grid gap-4 sm:grid-cols-2">
				{#each templatesStore.templates as template (template.id)}
					<TemplateCard
						{template}
						onUse={handleUse}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onSetDefault={handleSetDefault}
					/>
				{/each}
			</div>
		{/if}

		<!-- Error Message -->
		{#if templatesStore.error}
			<div class="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
				{templatesStore.error}
			</div>
		{/if}
	</div>
</div>

<!-- Form Modal -->
{#if showForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
			<TemplateForm template={editingTemplate} onSubmit={handleSubmit} onCancel={handleCancel} />
		</div>
	</div>
{/if}
