<script lang="ts">
	import { useLiveQuery } from '@manacore/local-store/svelte';
	import { tagCollection, linkTagCollection } from '$lib/data/local-store';
	import type { LocalTag } from '$lib/data/local-store';
	import { toast } from 'svelte-sonner';
	import { PencilSimple, Trash } from '@manacore/shared-icons';

	const tags = useLiveQuery(() => tagCollection.getAll({}, { sortBy: 'name' }));
	const linkTags = useLiveQuery(() => linkTagCollection.getAll());

	let showCreateForm = $state(false);
	let newName = $state('');
	let newColor = $state('#6366f1');
	let editingTag = $state<LocalTag | null>(null);

	function slugify(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function getUsageCount(tagId: string): number {
		return (linkTags.value ?? []).filter((lt) => lt.tagId === tagId).length;
	}

	async function createTag() {
		if (!newName.trim()) return;
		await tagCollection.insert({
			id: crypto.randomUUID(),
			name: newName.trim(),
			slug: slugify(newName),
			color: newColor,
			icon: null,
			isPublic: false,
			usageCount: 0,
		});
		toast.success(`Tag "${newName}" erstellt`);
		newName = '';
		newColor = '#6366f1';
		showCreateForm = false;
	}

	async function deleteTag(tag: LocalTag) {
		await tagCollection.delete(tag.id);
		toast.success(`Tag "${tag.name}" gelöscht`);
	}

	async function updateTag() {
		if (!editingTag) return;
		await tagCollection.update(editingTag.id, {
			name: editingTag.name,
			slug: slugify(editingTag.name),
			color: editingTag.color,
		});
		toast.success('Tag aktualisiert');
		editingTag = null;
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Tags</h1>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
		>
			{showCreateForm ? '- Ausblenden' : '+ Neuer Tag'}
		</button>
	</div>

	{#if showCreateForm}
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex items-end gap-4">
				<div class="flex-1">
					<label for="tag-name" class="mb-1 block text-sm font-medium">Name</label>
					<input
						id="tag-name"
						type="text"
						bind:value={newName}
						placeholder="z.B. Social Media"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
						onkeydown={(e) => e.key === 'Enter' && createTag()}
					/>
				</div>
				<div>
					<label for="tag-color" class="mb-1 block text-sm font-medium">Farbe</label>
					<input
						id="tag-color"
						type="color"
						bind:value={newColor}
						class="h-10 w-16 cursor-pointer rounded-lg border border-gray-300"
					/>
				</div>
				<button
					onclick={createTag}
					disabled={!newName.trim()}
					class="rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
				>
					Erstellen
				</button>
			</div>
		</div>
	{/if}

	{#if tags.loading}
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"></div>
			{/each}
		</div>
	{:else if !tags.value || tags.value.length === 0}
		<div
			class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600"
		>
			<p class="text-lg font-medium opacity-60">Noch keine Tags</p>
			<p class="mt-1 text-sm opacity-40">Erstelle Tags um deine Links zu organisieren.</p>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each tags.value as tag (tag.id)}
				<div
					class="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
				>
					{#if editingTag?.id === tag.id}
						<div class="space-y-3">
							<input
								type="text"
								bind:value={editingTag.name}
								class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
							/>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={editingTag.color} class="h-8 w-12 rounded" />
								<button
									onclick={updateTag}
									class="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Speichern</button
								>
								<button onclick={() => (editingTag = null)} class="rounded border px-3 py-1 text-sm"
									>Abbrechen</button
								>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span
									class="inline-block h-4 w-4 rounded-full"
									style="background-color: {tag.color}"
								></span>
								<span class="font-medium">{tag.name}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-sm opacity-50">{getUsageCount(tag.id)} Links</span>
								<button
									onclick={() => (editingTag = { ...tag })}
									class="rounded p-1 opacity-0 transition-all hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-700"
								>
									<PencilSimple size={16} />
								</button>
								<button
									onclick={() => deleteTag(tag)}
									class="rounded p-1 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
								>
									<Trash size={16} />
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
