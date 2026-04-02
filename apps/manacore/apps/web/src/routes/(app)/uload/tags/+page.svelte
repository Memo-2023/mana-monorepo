<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { uloadTagTable, useAllTags, useAllLinkTags, slugify } from '$lib/modules/uload';
	import type { LocalTag } from '$lib/modules/uload';
	import { toast } from 'svelte-sonner';
	import { PencilSimple, Trash, ArrowLeft } from '@manacore/shared-icons';

	const tags = useAllTags();
	const linkTags = useAllLinkTags();

	let showCreateForm = $state(false);
	let newName = $state('');
	let newColor = $state('#6366f1');
	let editingTag = $state<{ id: string; name: string; color?: string } | null>(null);

	function getUsageCount(tagId: string): number {
		return (tags.value ? linkTags.value : []).filter((lt) => lt.tagId === tagId).length;
	}

	async function createTag() {
		if (!newName.trim()) return;
		await uloadTagTable.add({
			id: crypto.randomUUID(),
			name: newName.trim(),
			slug: slugify(newName),
			color: newColor,
			icon: null,
			isPublic: false,
			usageCount: 0,
		} as LocalTag);
		toast.success(`Tag "${newName}" erstellt`);
		newName = '';
		newColor = '#6366f1';
		showCreateForm = false;
	}

	async function deleteTag(tag: { id: string; name: string }) {
		await uloadTagTable.delete(tag.id);
		toast.success(`Tag "${tag.name}" geloescht`);
	}

	async function updateTag() {
		if (!editingTag) return;
		await uloadTagTable.update(editingTag.id, {
			name: editingTag.name,
			slug: slugify(editingTag.name),
			color: editingTag.color,
		});
		toast.success('Tag aktualisiert');
		editingTag = null;
	}
</script>

<div class="mx-auto max-w-4xl p-4">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/uload" class="rounded-lg p-2 transition-colors hover:bg-white/5">
				<ArrowLeft size={20} class="text-white/60" />
			</a>
			<h1 class="text-2xl font-bold text-white">Tags</h1>
		</div>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
		>
			{showCreateForm ? 'Ausblenden' : '+ Neuer Tag'}
		</button>
	</div>

	{#if showCreateForm}
		<div class="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
			<div class="flex items-end gap-4">
				<div class="flex-1">
					<label for="tag-name" class="mb-1 block text-sm font-medium text-white/60">Name</label>
					<input
						id="tag-name"
						type="text"
						bind:value={newName}
						placeholder="z.B. Social Media"
						class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none"
						onkeydown={(e) => e.key === 'Enter' && createTag()}
					/>
				</div>
				<div>
					<label for="tag-color" class="mb-1 block text-sm font-medium text-white/60">Farbe</label>
					<input
						id="tag-color"
						type="color"
						bind:value={newColor}
						class="h-10 w-16 cursor-pointer rounded-lg border border-white/10"
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

	{#if !tags.value || tags.value.length === 0}
		<div class="rounded-xl border-2 border-dashed border-white/10 p-12 text-center">
			<p class="text-lg font-medium text-white/60">Noch keine Tags</p>
			<p class="mt-1 text-sm text-white/40">Erstelle Tags um deine Links zu organisieren.</p>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each tags.value as tag (tag.id)}
				<div
					class="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/8"
				>
					{#if editingTag?.id === tag.id}
						<div class="space-y-3">
							<input
								type="text"
								bind:value={editingTag.name}
								class="w-full rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
							/>
							<div class="flex items-center gap-2">
								<input type="color" bind:value={editingTag.color} class="h-8 w-12 rounded" />
								<button
									onclick={updateTag}
									class="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
									>{$_('common.save')}</button
								>
								<button
									onclick={() => (editingTag = null)}
									class="rounded border border-white/10 px-3 py-1 text-sm text-white/60"
									>{$_('common.cancel')}</button
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
								<span class="font-medium text-white">{tag.name}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-sm text-white/40">{getUsageCount(tag.id)} Links</span>
								<button
									onclick={() => (editingTag = { id: tag.id, name: tag.name, color: tag.color })}
									class="rounded p-1 text-white/40 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
								>
									<PencilSimple size={16} />
								</button>
								<button
									onclick={() => deleteTag(tag)}
									class="rounded p-1 text-white/40 opacity-0 transition-all hover:bg-red-900/20 hover:text-red-400 group-hover:opacity-100"
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
