<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { tagMutations } from '$lib/modules/memoro/stores/tags.svelte';
	import type { Tag } from '@mana/shared-tags';
	import {
		ArrowLeft,
		Plus,
		Trash,
		PencilSimple,
		PushPin,
		Check,
		X,
		Tag as TagIcon,
	} from '@mana/shared-icons';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');

	let showCreateForm = $state(false);
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formColor = $state('#3b82f6');

	const COLORS = [
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
		'#f97316',
		'#10b981',
		'#06b6d4',
		'#ef4444',
		'#eab308',
	];

	function openCreateForm() {
		editingId = null;
		formName = '';
		formColor = '#3b82f6';
		showCreateForm = true;
	}

	function openEditForm(tag: Tag) {
		editingId = tag.id;
		formName = tag.name;
		formColor = tag.color || '#3b82f6';
		showCreateForm = true;
	}

	async function handleSubmit() {
		if (!formName.trim()) return;
		if (editingId) {
			await tagMutations.updateTag(editingId, { name: formName.trim(), color: formColor });
		} else {
			await tagMutations.createTag({ name: formName.trim(), color: formColor });
		}
		showCreateForm = false;
	}

	async function handleDelete(id: string) {
		if (confirm('Tag wirklich loschen?')) {
			await tagMutations.deleteTag(id);
		}
	}
</script>

<svelte:head>
	<title>Tags - Memoro - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/memoro"
				class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Tags</h1>
				<p class="text-sm text-[hsl(var(--muted-foreground))]">
					{tagsCtx.value.length} Tags
				</p>
			</div>
		</div>
		<button
			onclick={openCreateForm}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
		>
			<Plus size={16} />
			Neuer Tag
		</button>
	</div>

	{#if tagsCtx.value.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--border))] py-16"
		>
			<TagIcon size={48} class="mb-4 text-[hsl(var(--muted-foreground))]" />
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--foreground))]">Keine Tags</h2>
			<p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
				Erstelle Tags, um deine Memos zu organisieren.
			</p>
			<button
				onclick={openCreateForm}
				class="rounded-lg bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
			>
				Neuer Tag
			</button>
		</div>
	{:else}
		<div class="space-y-2">
			{#each tagsCtx.value as tag (tag.id)}
				<div
					class="group flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
				>
					<span
						class="h-4 w-4 shrink-0 rounded-full"
						style="background-color: {tag.color || '#888'}"
					></span>
					<span class="flex-1 font-medium text-[hsl(var(--foreground))]">{tag.name}</span>
					<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							onclick={() => openEditForm(tag)}
							class="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
						>
							<PencilSimple size={16} />
						</button>
						<button
							onclick={() => handleDelete(tag.id)}
							class="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-red-500"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create/Edit Form Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="w-full max-w-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">
					{editingId ? 'Tag bearbeiten' : 'Neuer Tag'}
				</h2>
				<button
					onclick={() => (showCreateForm = false)}
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
					<label for="tag-name" class="mb-1 block text-sm font-medium">Name</label>
					<input
						id="tag-name"
						type="text"
						bind:value={formName}
						required
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
					/>
				</div>
				<div>
					<span class="mb-1 block text-sm font-medium">Farbe</span>
					<div class="flex gap-2">
						{#each COLORS as color}
							<button
								type="button"
								aria-label="Farbe wählen"
								onclick={() => (formColor = color)}
								class="h-7 w-7 rounded-full border-2 transition-transform {formColor === color
									? 'scale-110 border-[hsl(var(--foreground))]'
									: 'border-transparent hover:scale-105'}"
								style="background-color: {color}"
							></button>
						{/each}
					</div>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showCreateForm = false)}
						class="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!formName.trim()}
						class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
					>
						{editingId ? $_('common.save') : $_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
