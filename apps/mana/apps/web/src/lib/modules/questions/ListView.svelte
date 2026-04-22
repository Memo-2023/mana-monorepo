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
		open: 'bg-primary/20 text-primary',
		researching: 'bg-warning/20 text-warning',
		answered: 'bg-success/20 text-success',
		archived: 'bg-muted text-muted-foreground',
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
			<span class="text-xs text-muted-foreground"
				>{questions.length} Fragen · {collections.length} Sammlungen</span
			>
			<button
				type="button"
				class="text-xs text-muted-foreground transition-colors hover:text-foreground"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neue Frage'}
			</button>
		</div>

		{#if creating}
			<form class="flex flex-col gap-2 rounded-lg bg-muted/30 p-3" onsubmit={handleCreate}>
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Was möchtest du herausfinden?"
					required
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newDescription}
					placeholder="Kontext / Details (optional)"
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
			class="mb-2 w-full text-left rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer min-h-[44px]"
		>
			<div class="flex items-start justify-between gap-2">
				<p class="text-sm font-medium text-foreground">{question.title}</p>
				<span
					class="shrink-0 rounded px-1.5 py-0.5 text-[10px] {statusColors[question.status] ?? ''}"
				>
					{statusLabels[question.status] ?? question.status}
				</span>
			</div>
			{#if question.description}
				<p class="mt-1 truncate text-xs text-muted-foreground/70">{question.description}</p>
			{/if}
			{#if question.tags.length > 0}
				<div class="mt-1 flex gap-1">
					{#each question.tags.slice(0, 3) as tag}
						<span class="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
							>{tag}</span
						>
					{/each}
				</div>
			{/if}
		</button>
	{/snippet}
</BaseListView>
