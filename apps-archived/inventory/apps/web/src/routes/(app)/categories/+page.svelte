<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { categoriesStore } from '$lib/stores';
	import { PageHeader, Button, Input } from '@manacore/shared-ui';
	import type { Category } from '@inventory/shared';

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formData = $state({ name: '', icon: '', color: '#3B82F6', parentCategoryId: '' });

	function startCreate(parentId?: string) {
		editingId = null;
		formData = { name: '', icon: '', color: '#3B82F6', parentCategoryId: parentId || '' };
		showForm = true;
	}

	function startEdit(category: Category & { level?: number }) {
		editingId = category.id;
		formData = {
			name: category.name,
			icon: category.icon || '',
			color: category.color || '#3B82F6',
			parentCategoryId: category.parentCategoryId || '',
		};
		showForm = true;
	}

	function cancelForm() {
		showForm = false;
		editingId = null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (editingId) {
			await categoriesStore.updateCategory(editingId, formData);
		} else {
			await categoriesStore.createCategory(formData);
		}
		cancelForm();
	}

	async function handleDelete(id: string) {
		if (confirm($_('categories.confirmDelete'))) {
			await categoriesStore.deleteCategory(id);
		}
	}
</script>

<svelte:head>
	<title>{$_('categories.title')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6 max-w-2xl mx-auto">
	<PageHeader title={$_('categories.title')}>
		{#snippet actions()}
			<Button onclick={() => startCreate()}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{$_('categories.new')}
			</Button>
		{/snippet}
	</PageHeader>

	<!-- Form -->
	{#if showForm}
		<form
			onsubmit={handleSubmit}
			class="mt-6 p-4 rounded-xl border border-theme bg-surface space-y-4"
		>
			<h3 class="font-medium text-theme">
				{editingId ? $_('categories.edit') : $_('categories.new')}
			</h3>

			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('categories.name')} *</label>
				<Input bind:value={formData.name} required />
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('categories.icon')}</label>
					<Input bind:value={formData.icon} placeholder="laptop, home, car..." />
				</div>
				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('categories.color')}</label>
					<input
						type="color"
						bind:value={formData.color}
						class="w-full h-10 rounded-lg border border-theme cursor-pointer"
					/>
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('categories.parent')}</label>
				<select
					bind:value={formData.parentCategoryId}
					class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
				>
					<option value="">{$_('common.none')}</option>
					{#each categoriesStore.flatCategories.filter((c) => c.id !== editingId) as cat}
						<option value={cat.id}>{'  '.repeat(cat.level)}{cat.name}</option>
					{/each}
				</select>
			</div>

			<div class="flex gap-3 justify-end">
				<Button variant="outline" onclick={cancelForm}>{$_('common.cancel')}</Button>
				<Button type="submit" disabled={!formData.name}>{$_('common.save')}</Button>
			</div>
		</form>
	{/if}

	<!-- Categories List -->
	<div class="mt-6 space-y-2">
		{#if categoriesStore.loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if categoriesStore.flatCategories.length === 0}
			<div class="text-center py-12">
				<p class="text-theme-secondary">{$_('categories.empty')}</p>
			</div>
		{:else}
			{#each categoriesStore.flatCategories as category}
				<div
					class="flex items-center justify-between p-3 rounded-lg border border-theme hover:border-primary transition-colors"
					style="margin-left: {category.level * 1.5}rem"
				>
					<div class="flex items-center gap-3">
						{#if category.color}
							<div class="w-4 h-4 rounded-full" style="background-color: {category.color}"></div>
						{/if}
						<span class="font-medium text-theme">{category.name}</span>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => startCreate(category.id)}
							class="p-1 text-theme-secondary hover:text-primary transition-colors"
							title="Unterkategorie hinzufügen"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</button>
						<button
							onclick={() => startEdit(category)}
							class="p-1 text-theme-secondary hover:text-primary transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<button
							onclick={() => handleDelete(category.id)}
							class="p-1 text-theme-secondary hover:text-red-500 transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
