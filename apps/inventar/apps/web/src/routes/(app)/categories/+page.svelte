<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { categoriesStore } from '$lib/stores/categories.svelte';
	import type { Category } from '@inventar/shared';

	const categoriesCtx: { readonly value: Category[] } = getContext('categories');

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let name = $state('');
	let icon = $state('');
	let color = $state('');

	function startCreate() {
		name = '';
		icon = '';
		color = '';
		editingId = null;
		showForm = true;
	}

	function startEdit(category: Category) {
		editingId = category.id;
		name = category.name;
		icon = category.icon || '';
		color = category.color || '';
		showForm = true;
	}

	async function save() {
		if (!name.trim()) return;
		if (editingId) {
			await categoriesStore.update(editingId, {
				name: name.trim(),
				icon: icon || undefined,
				color: color || undefined,
			});
		} else {
			await categoriesStore.create({
				name: name.trim(),
				icon: icon || undefined,
				color: color || undefined,
			});
		}
		showForm = false;
	}

	async function deleteCategory(id: string) {
		if (confirm('Kategorie löschen?')) {
			await categoriesStore.delete(id);
		}
	}

	let sortedCategories = $derived([...categoriesCtx.value].sort((a, b) => a.order - b.order));

	const inputClass =
		'rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]';
</script>

<svelte:head>
	<title>{$_('nav.categories')} | Inventar</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.categories')}</h1>
		<button
			onclick={startCreate}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{$_('category.create')}
		</button>
	</div>

	{#if showForm}
		<div class="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))] p-4">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={icon}
					placeholder="🏷️"
					class="{inputClass} w-12 text-center text-lg"
					maxlength="2"
				/>
				<input
					type="text"
					bind:value={name}
					placeholder={$_('category.name')}
					class="{inputClass} flex-1"
					onkeydown={(e) => e.key === 'Enter' && save()}
				/>
				<input
					type="color"
					bind:value={color}
					class="h-9 w-9 cursor-pointer rounded-lg border border-[hsl(var(--border))]"
				/>
				<button
					onclick={save}
					disabled={!name.trim()}
					class="rounded-lg bg-[hsl(var(--primary))] px-4 text-sm text-[hsl(var(--primary-foreground))] disabled:opacity-50"
					>{$_('common.save')}</button
				>
				<button
					onclick={() => (showForm = false)}
					class="rounded-lg border border-[hsl(var(--border))] px-3 text-sm"
					>{$_('common.cancel')}</button
				>
			</div>
		</div>
	{/if}

	{#if sortedCategories.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<span class="mb-4 text-4xl">🏷️</span>
			<p class="text-[hsl(var(--muted-foreground))]">{$_('category.noCategories')}</p>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each sortedCategories as category (category.id)}
				<div
					class="group flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
				>
					<span class="text-xl">{category.icon || '🏷️'}</span>
					{#if category.color}
						<span class="h-3 w-3 rounded-full" style="background-color: {category.color}"></span>
					{/if}
					<span class="flex-1 font-medium text-[hsl(var(--foreground))]">{category.name}</span>
					<button
						onclick={() => startEdit(category)}
						class="text-xs text-[hsl(var(--muted-foreground))] opacity-0 hover:text-[hsl(var(--foreground))] group-hover:opacity-100"
						>✎</button
					>
					<button
						onclick={() => deleteCategory(category.id)}
						class="text-xs text-[hsl(var(--muted-foreground))] opacity-0 hover:text-red-500 group-hover:opacity-100"
						>×</button
					>
				</div>
			{/each}
		</div>
	{/if}
</div>
