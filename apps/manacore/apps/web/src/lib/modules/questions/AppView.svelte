<!--
  Questions — Split-Screen AppView
  Research questions list with status badges.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalQuestion, LocalCollection } from './types';

	let questions = $state<LocalQuestion[]>([]);
	let collections = $state<LocalCollection[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalQuestion>('questions')
				.toArray()
				.then((all) => all.filter((q) => !q.deletedAt));
		}).subscribe((val) => {
			questions = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalCollection>('questionCollections')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt));
		}).subscribe((val) => {
			collections = val ?? [];
		});
		return () => sub.unsubscribe();
	});

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

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex gap-3 text-xs text-white/40">
		<span>{questions.length} Fragen</span>
		<span>{collections.length} Sammlungen</span>
	</div>

	<div class="flex-1 overflow-auto">
		{#each sorted as question (question.id)}
			<div
				class="mb-2 rounded-md border border-white/10 px-3 py-2.5 transition-colors hover:bg-white/5"
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
			</div>
		{/each}

		{#if sorted.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine offenen Fragen</p>
		{/if}
	</div>
</div>
