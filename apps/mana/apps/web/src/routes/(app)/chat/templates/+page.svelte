<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { templatesStore } from '$lib/modules/chat/stores/templates.svelte';
	import { conversationsStore } from '$lib/modules/chat/stores/conversations.svelte';
	import type { Template } from '$lib/modules/chat/types';
	import {
		ArrowLeft,
		Plus,
		Trash,
		PencilSimple,
		Star,
		Play,
		FileText,
		X,
	} from '@mana/shared-icons';

	const templatesCtx: { readonly value: Template[] } = getContext('templates');
	let templates = $derived(templatesCtx.value);

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formDescription = $state('');
	let formSystemPrompt = $state('');
	let formColor = $state('#3b82f6');
	let formDocumentMode = $state(false);

	const COLORS = [
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
		'#f97316',
		'#10b981',
		'#06b6d4',
		'#6366f1',
		'#ef4444',
	];

	function openCreateForm() {
		editingId = null;
		formName = '';
		formDescription = '';
		formSystemPrompt = '';
		formColor = '#3b82f6';
		formDocumentMode = false;
		showForm = true;
	}

	function openEditForm(template: Template) {
		editingId = template.id;
		formName = template.name;
		formDescription = template.description ?? '';
		formSystemPrompt = template.systemPrompt;
		formColor = template.color;
		formDocumentMode = template.documentMode;
		showForm = true;
	}

	async function handleSubmit() {
		if (!formName.trim() || !formSystemPrompt.trim()) return;

		if (editingId) {
			await templatesStore.update(editingId, {
				name: formName.trim(),
				description: formDescription.trim(),
				systemPrompt: formSystemPrompt.trim(),
				color: formColor,
				documentMode: formDocumentMode,
			});
		} else {
			await templatesStore.create({
				name: formName.trim(),
				description: formDescription.trim(),
				systemPrompt: formSystemPrompt.trim(),
				color: formColor,
				documentMode: formDocumentMode,
			});
		}
		showForm = false;
	}

	async function handleDelete(id: string) {
		if (confirm('Vorlage wirklich loschen?')) {
			await templatesStore.delete(id);
		}
	}

	async function handleSetDefault(id: string) {
		await templatesStore.setDefault(id);
	}

	async function handleUse(template: Template) {
		const conversation = await conversationsStore.create({
			templateId: template.id,
			modelId: template.modelId ?? undefined,
			mode: 'template',
			documentMode: template.documentMode,
		});
		goto(`/chat/${conversation.id}`);
	}
</script>

<svelte:head>
	<title>Vorlagen - Chat - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/chat"
				class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Vorlagen</h1>
				<p class="text-sm text-[hsl(var(--muted-foreground))]">
					Erstelle Vorlagen mit benutzerdefinierten System-Prompts.
				</p>
			</div>
		</div>
		<button
			onclick={openCreateForm}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
		>
			<Plus size={20} />
			Neue Vorlage
		</button>
	</div>

	<!-- Templates Grid -->
	{#if templates.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<FileText size={48} class="mb-4 text-[hsl(var(--muted-foreground))]" />
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">Keine Vorlagen</h2>
			<p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
				Erstelle deine erste Vorlage, um loszulegen.
			</p>
			<button
				onclick={openCreateForm}
				class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
			>
				Neue Vorlage
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each templates as template (template.id)}
				<div
					class="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full" style="background-color: {template.color}"></div>
							<div>
								<h3 class="font-semibold text-[hsl(var(--foreground))]">
									{template.name}
									{#if template.isDefault}
										<Star size={14} weight="fill" class="ml-1 inline text-yellow-500" />
									{/if}
								</h3>
								{#if template.description}
									<p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
										{template.description}
									</p>
								{/if}
							</div>
						</div>
					</div>

					{#if template.documentMode}
						<span
							class="mt-2 inline-block rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
						>
							Dokumentmodus
						</span>
					{/if}

					<div class="mt-4 flex items-center gap-2">
						<button
							onclick={() => handleUse(template)}
							class="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
						>
							<Play size={14} />
							Verwenden
						</button>
						<button
							onclick={() => openEditForm(template)}
							class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
						>
							<PencilSimple size={16} />
						</button>
						<button
							onclick={() => handleSetDefault(template.id)}
							class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-yellow-500"
							title="Als Standard setzen"
						>
							<Star size={16} weight={template.isDefault ? 'fill' : 'regular'} />
						</button>
						<button
							onclick={() => handleDelete(template.id)}
							class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Form Modal -->
{#if showForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="w-full max-w-lg rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">
					{editingId ? 'Vorlage bearbeiten' : 'Neue Vorlage'}
				</h2>
				<button
					onclick={() => (showForm = false)}
					class="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
				>
					<X size={20} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div>
					<label for="tpl-name" class="mb-1 block text-sm font-medium">Name</label>
					<input
						id="tpl-name"
						type="text"
						bind:value={formName}
						required
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="tpl-desc" class="mb-1 block text-sm font-medium">Beschreibung</label>
					<input
						id="tpl-desc"
						type="text"
						bind:value={formDescription}
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<label for="tpl-prompt" class="mb-1 block text-sm font-medium">System-Prompt</label>
					<textarea
						id="tpl-prompt"
						bind:value={formSystemPrompt}
						required
						rows="4"
						class="w-full resize-none rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					></textarea>
				</div>
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="mb-1 block text-sm font-medium">Farbe</label>
					<div class="flex gap-2">
						<!-- svelte-ignore a11y_consider_explicit_label -->
						{#each COLORS as color}
							<button
								type="button"
								onclick={() => (formColor = color)}
								class="h-7 w-7 rounded-full border-2 transition-transform {formColor === color
									? 'scale-110 border-[hsl(var(--foreground))]'
									: 'border-transparent hover:scale-105'}"
								style="background-color: {color}"
							></button>
						{/each}
					</div>
				</div>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={formDocumentMode} class="rounded" />
					Dokumentmodus
				</label>
				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showForm = false)}
						class="rounded-lg px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!formName.trim() || !formSystemPrompt.trim()}
						class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
					>
						{editingId ? $_('common.save') : $_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
