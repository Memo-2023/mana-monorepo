<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { memosStore } from '$lib/modules/memoro/stores/memos.svelte';
	import { memoriesStore } from '$lib/modules/memoro/stores/memories.svelte';
	import { memoTagOps } from '$lib/modules/memoro/stores/tags.svelte';
	import {
		useMemoriesByMemo,
		getTagsForMemo,
		formatDuration,
		getStatusLabel,
	} from '$lib/modules/memoro/queries';
	import type { Memo, Memory, Tag, LocalMemoTag } from '$lib/modules/memoro/types';
	import {
		ArrowLeft,
		Trash,
		PushPin,
		Archive,
		PencilSimple,
		Check,
		X,
		Plus,
		Tag as TagIcon,
	} from '@mana/shared-icons';

	const memosCtx: { readonly value: Memo[] } = getContext('memos');
	const tagsCtx: { readonly value: Tag[] } = getContext('tags');
	const memoTagsCtx: { readonly value: LocalMemoTag[] } = getContext('memoTags');

	const memoId = $derived($page.params.id ?? '');
	const memo = $derived(memosCtx.value.find((m) => m.id === memoId));

	// Live query for memories of this memo
	const memoriesQuery = $derived(useMemoriesByMemo(memoId));
	let memories = $derived(memoriesQuery.value);

	let memoTags = $derived(getTagsForMemo(tagsCtx.value, memoTagsCtx.value, memoId));

	let isEditingTitle = $state(false);
	let editTitle = $state('');
	let showTagPicker = $state(false);

	function startEditTitle() {
		editTitle = memo?.title ?? '';
		isEditingTitle = true;
	}

	async function saveTitle() {
		if (editTitle.trim()) {
			await memosStore.update(memoId, { title: editTitle.trim() });
		}
		isEditingTitle = false;
	}

	async function togglePin() {
		if (!memo) return;
		if (memo.isPinned) {
			await memosStore.unpin(memoId);
		} else {
			await memosStore.pin(memoId);
		}
	}

	async function handleArchive() {
		await memosStore.archive(memoId);
		goto('/memoro');
	}

	async function handleDelete() {
		if (confirm('Memo wirklich loschen?')) {
			await memosStore.delete(memoId);
			goto('/memoro');
		}
	}

	async function handleAddTag(tagId: string) {
		await memoTagOps.addTag(memoId, tagId);
		showTagPicker = false;
	}

	async function handleRemoveTag(tagId: string) {
		await memoTagOps.removeTag(memoId, tagId);
	}

	// Available tags (not already assigned)
	let availableTags = $derived(tagsCtx.value.filter((t) => !memoTags.some((mt) => mt.id === t.id)));
</script>

<svelte:head>
	<title>{memo?.title || 'Memo'} - Memoro - Mana</title>
</svelte:head>

{#if !memo}
	<div class="flex flex-col items-center justify-center py-16">
		<p class="mb-4 text-[hsl(var(--muted-foreground))]">Memo nicht gefunden</p>
		<a href="/memoro" class="text-sm text-[hsl(var(--primary))] hover:underline">
			Zuruck zu Memoro
		</a>
	</div>
{:else}
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
				<div class="min-w-0 flex-1">
					{#if isEditingTitle}
						<div class="flex items-center gap-2">
							<input
								type="text"
								bind:value={editTitle}
								onkeydown={(e) => e.key === 'Enter' && saveTitle()}
								class="flex-1 rounded border border-[hsl(var(--border))] bg-transparent px-2 py-1 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
							/>
							<button onclick={saveTitle} class="text-[hsl(var(--primary))]">
								<Check size={18} />
							</button>
							<button
								onclick={() => (isEditingTitle = false)}
								class="text-[hsl(var(--muted-foreground))]"
							>
								<X size={18} />
							</button>
						</div>
					{:else}
						<button onclick={startEditTitle} class="group flex items-center gap-2 text-left">
							<h1 class="text-xl font-bold text-[hsl(var(--foreground))]">
								{memo.title || 'Unbenanntes Memo'}
							</h1>
							<PencilSimple
								size={16}
								class="shrink-0 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100"
							/>
						</button>
					{/if}
					<p class="text-sm text-[hsl(var(--muted-foreground))]">
						{new Date(memo.createdAt).toLocaleDateString('de-DE', {
							day: '2-digit',
							month: 'long',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
						})}
						{#if memo.audioDurationMs}
							&middot; {formatDuration(memo.audioDurationMs)}
						{/if}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-1">
				<button
					onclick={togglePin}
					class="rounded-lg p-1.5 transition-colors {memo.isPinned
						? 'text-[hsl(var(--primary))]'
						: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}"
					title={memo.isPinned ? 'Loslosen' : 'Anpinnen'}
				>
					<PushPin size={18} weight={memo.isPinned ? 'fill' : 'regular'} />
				</button>
				<button
					onclick={handleArchive}
					class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
					title="Archivieren"
				>
					<Archive size={18} />
				</button>
				<button
					onclick={handleDelete}
					class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500"
					title="Loschen"
				>
					<Trash size={18} />
				</button>
			</div>
		</div>

		<!-- Status -->
		{#if memo.processingStatus !== 'completed'}
			<div
				class="rounded-lg bg-[hsl(var(--muted))] px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]"
			>
				Status: {getStatusLabel(memo.processingStatus)}
			</div>
		{/if}

		<!-- Tags -->
		<div class="flex flex-wrap items-center gap-2">
			{#each memoTags as tag (tag.id)}
				<span
					class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
					style="background-color: {tag.color || 'hsl(var(--muted))'}"
				>
					{tag.name}
					<button
						onclick={() => handleRemoveTag(tag.id)}
						class="ml-0.5 rounded-full hover:bg-white/20"
					>
						<X size={12} />
					</button>
				</span>
			{/each}
			<div class="relative">
				<button
					onclick={() => (showTagPicker = !showTagPicker)}
					class="flex items-center gap-1 rounded-full border border-dashed border-[hsl(var(--border))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
				>
					<TagIcon size={12} />
					Tag hinzufugen
				</button>
				{#if showTagPicker && availableTags.length > 0}
					<div
						class="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-lg"
					>
						{#each availableTags as tag (tag.id)}
							<button
								onclick={() => handleAddTag(tag.id)}
								class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[hsl(var(--muted))]"
							>
								<span class="h-3 w-3 rounded-full" style="background-color: {tag.color || '#888'}"
								></span>
								{tag.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Intro -->
		{#if memo.intro}
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
				<h2
					class="mb-2 text-sm font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
				>
					Zusammenfassung
				</h2>
				<p class="text-[hsl(var(--foreground))]">{memo.intro}</p>
			</div>
		{/if}

		<!-- Transcript -->
		{#if memo.transcript}
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
				<h2
					class="mb-2 text-sm font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
				>
					Transkript
				</h2>
				<p class="whitespace-pre-wrap text-sm leading-relaxed text-[hsl(var(--foreground))]">
					{memo.transcript}
				</p>
			</div>
		{/if}

		<!-- Memories -->
		<div>
			<h2
				class="mb-3 text-sm font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
			>
				Erinnerungen ({memories.length})
			</h2>
			{#if memories.length === 0}
				<p class="text-sm text-[hsl(var(--muted-foreground))]">
					Noch keine Erinnerungen fur dieses Memo.
				</p>
			{:else}
				<div class="space-y-3">
					{#each memories as memory (memory.id)}
						<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
							<h3 class="font-medium text-[hsl(var(--foreground))]">{memory.title}</h3>
							{#if memory.content}
								<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
									{memory.content}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
