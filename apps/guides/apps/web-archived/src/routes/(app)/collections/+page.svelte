<script lang="ts">
	import { liveQuery } from 'dexie';
	import { collectionCollection, guideCollection, runCollection } from '$lib/data/local-store.js';
	import type { LocalCollection, LocalGuide, LocalRun } from '$lib/data/local-store.js';
	import { guidesStore } from '$lib/stores/guides.svelte';
	import CollectionEditModal from '$lib/components/CollectionEditModal.svelte';

	let showCreateModal = $state(false);
	let editingCollection = $state<LocalCollection | undefined>(undefined);

	let collections = $state<LocalCollection[]>([]);
	let allGuides = $state<LocalGuide[]>([]);
	let allRuns = $state<LocalRun[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			const [cols, guides, runs] = await Promise.all([
				collectionCollection.getAll(),
				guideCollection.getAll(),
				runCollection.getAll(),
			]);
			return { cols, guides, runs };
		}).subscribe(({ cols, guides, runs }) => {
			collections = cols;
			allGuides = guides;
			allRuns = runs;
		});
		return () => sub.unsubscribe();
	});

	function getGuidesForCollection(col: LocalCollection): LocalGuide[] {
		if (col.type === 'path') {
			return col.guideOrder
				.map((id) => allGuides.find((g) => g.id === id))
				.filter(Boolean) as LocalGuide[];
		}
		return allGuides.filter((g) => g.collectionId === col.id);
	}

	function getPathProgress(col: LocalCollection): number {
		const guides = getGuidesForCollection(col);
		if (guides.length === 0) return 0;
		const completed = guides.filter((g) =>
			allRuns.some((r) => r.guideId === g.id && r.completedAt)
		).length;
		return Math.round((completed / guides.length) * 100);
	}
</script>

<div class="p-4 md:p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Sammlungen</h1>
			<p class="text-sm text-muted-foreground">Lernpfade und thematische Anleitungs-Sets</p>
		</div>
		<button
			onclick={() => { editingCollection = undefined; showCreateModal = true; }}
			class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
		>
			+ Neu
		</button>
	</div>

	{#if collections.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-center">
			<span class="mb-4 text-6xl">📂</span>
			<h2 class="mb-2 text-lg font-semibold">Noch keine Sammlungen</h2>
			<p class="mb-6 text-sm text-muted-foreground max-w-sm">
				Sammlungen gruppieren Anleitungen zu Lernpfaden oder thematischen Bibliotheken.
			</p>
			<button
				onclick={() => { editingCollection = undefined; showCreateModal = true; }}
				class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
			>
				Erste Sammlung erstellen
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each collections as col (col.id)}
				{@const guides = getGuidesForCollection(col)}
				{@const progress = col.type === 'path' ? getPathProgress(col) : null}
				<a
					href="/collections/{col.id}"
					class="group block rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-md"
				>
					<div class="mb-3 flex items-center gap-3">
						<div
							class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
							style="background-color: {col.coverColor ?? '#0d9488'}20"
						>
							{col.coverEmoji ?? (col.type === 'path' ? '🗺' : '📚')}
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="truncate font-semibold text-foreground group-hover:text-primary">
								{col.title}
							</h3>
							<span class="text-xs text-muted-foreground">
								{col.type === 'path' ? '🗺 Lernpfad' : '📚 Bibliothek'} · {guides.length} Anleitungen
							</span>
						</div>
					</div>

					{#if col.description}
						<p class="mb-3 text-xs text-muted-foreground line-clamp-2">{col.description}</p>
					{/if}

					{#if progress !== null}
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Fortschritt</span>
								<span class="font-medium text-primary">{progress}%</span>
							</div>
							<div class="h-1.5 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-primary transition-all"
									style="width: {progress}%"
								></div>
							</div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

{#if showCreateModal}
	<CollectionEditModal
		open={true}
		collection={editingCollection}
		onClose={() => (showCreateModal = false)}
		onSave={async (data) => {
			if (editingCollection) await guidesStore.updateCollection(editingCollection.id, data);
			else await guidesStore.createCollection(data);
			showCreateModal = false;
		}}
		onDelete={editingCollection ? async (id) => {
			await collectionCollection.delete(id);
			showCreateModal = false;
		} : undefined}
	/>
{/if}
