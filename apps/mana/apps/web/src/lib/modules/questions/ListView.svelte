<!--
  Questions — Workbench ListView
  Research questions list with status badges.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords, encryptRecord } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalQuestion, LocalCollection } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { questionTable } from './collections';

	let { navigate }: ViewProps = $props();

	let creating = $state(false);
	let newTitle = $state('');
	let newDescription = $state('');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const title = newTitle.trim();
		if (!title) return;
		const id = crypto.randomUUID();
		const newLocal: LocalQuestion = {
			id,
			title,
			description: newDescription.trim() || null,
			collectionId: null,
			status: 'open',
			priority: 'normal',
			tags: [],
			researchDepth: 'standard',
		};
		await encryptRecord('questions', newLocal);
		await questionTable.add(newLocal);
		newTitle = '';
		newDescription = '';
		creating = false;
		navigate('detail', {
			questionId: id,
			_siblingIds: [...sorted.map((q) => q.id), id],
			_siblingKey: 'questionId',
		});
	}

	const questionsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalQuestion>('questions').toArray();
		const visible = all.filter((q) => !q.deletedAt);
		return decryptRecords('questions', visible);
	}, [] as LocalQuestion[]);

	const collectionsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalCollection>('questionCollections').toArray();
		return all.filter((c) => !c.deletedAt);
	}, [] as LocalCollection[]);

	const questions = $derived(questionsQuery.value);
	const collections = $derived(collectionsQuery.value);

	const statusColors: Record<string, string> = {
		open: 'bg-blue-500/20 text-blue-300',
		researching: 'bg-amber-500/20 text-amber-300',
		answered: 'bg-green-500/20 text-green-300',
		archived: 'bg-white/10 text-white/40',
	};

	const statusLabels: Record<string, string> = {
		open: 'Offen',
		researching: 'Recherche',
		answered: 'Beantwortet',
		archived: 'Archiviert',
	};

	const sorted = $derived(
		[...questions]
			.filter((q) => q.status !== 'archived')
			.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
	);
</script>

<BaseListView items={sorted} getKey={(q) => q.id} emptyTitle="Keine offenen Fragen">
	{#snippet toolbar()}
		<div class="flex items-center justify-between">
			<span class="text-xs text-white/40"
				>{questions.length} Fragen · {collections.length} Sammlungen</span
			>
			<button
				type="button"
				class="text-xs text-white/50 transition-colors hover:text-white/80"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neue Frage'}
			</button>
		</div>

		{#if creating}
			<form class="flex flex-col gap-2 rounded-lg bg-white/5 p-3" onsubmit={handleCreate}>
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Was möchtest du herausfinden?"
					required
					class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newDescription}
					placeholder="Kontext / Details (optional)"
					class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!newTitle.trim()}
				>
					Frage stellen
				</button>
			</form>
		{/if}
	{/snippet}

	{#snippet header()}
		<span>{questions.length} Fragen</span>
		<span>{collections.length} Sammlungen</span>
	{/snippet}

	{#snippet item(question)}
		<button
			onclick={() =>
				navigate('detail', {
					questionId: question.id,
					_siblingIds: sorted.map((q) => q.id),
					_siblingKey: 'questionId',
				})}
			class="mb-2 w-full text-left rounded-md border border-white/10 px-3 py-2.5 transition-colors hover:bg-white/5 cursor-pointer min-h-[44px]"
		>
			<div class="flex items-start justify-between gap-2">
				<p class="text-sm font-medium text-white/80">{question.title}</p>
				<span
					class="shrink-0 rounded px-1.5 py-0.5 text-[10px] {statusColors[question.status] ?? ''}"
				>
					{statusLabels[question.status] ?? question.status}
				</span>
			</div>
			{#if question.description}
				<p class="mt-1 truncate text-xs text-white/30">{question.description}</p>
			{/if}
			{#if question.tags.length > 0}
				<div class="mt-1 flex gap-1">
					{#each question.tags.slice(0, 3) as tag}
						<span class="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">{tag}</span>
					{/each}
				</div>
			{/if}
		</button>
	{/snippet}
</BaseListView>
