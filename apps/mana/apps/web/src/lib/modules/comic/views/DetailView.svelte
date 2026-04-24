<!--
  Comic story detail — meta card (title + style + visibility +
  favorite + archive/delete) and panel strip with a "+ Panel" CTA
  that opens the PanelEditor sheet inline.

  Removing a panel here strips it from the story's `panelImageIds`
  and `panelMeta` only — the picture.images row itself survives so
  the user can keep the render in their Picture gallery. Final
  deletion happens from Picture, per decision in the plan.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Archive, Heart, Plus, Sparkle, Trash } from '@mana/shared-icons';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import { comicStoriesTable } from '../collections';
	import { comicStoriesStore } from '../stores/stories.svelte';
	import { useStory } from '../queries';
	import { STYLE_LABELS } from '../constants';
	import PanelStrip from '../components/PanelStrip.svelte';
	import PanelEditor from '../components/PanelEditor.svelte';
	import BatchPanelEditor from '../components/BatchPanelEditor.svelte';
	import StoryboardSuggester from '../components/StoryboardSuggester.svelte';
	import { encryptRecord } from '$lib/data/crypto';
	import type { ComicPanelMeta, LocalComicStory } from '../types';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	// svelte-ignore state_referenced_locally
	const story$ = useStory(id);
	const story = $derived(story$.value);

	type EditorMode = 'off' | 'single' | 'batch' | 'ai';
	let editorMode = $state<EditorMode>('off');

	async function handleToggleFavorite() {
		if (!story) return;
		await comicStoriesStore.toggleFavorite(story.id);
	}

	async function handleArchive() {
		if (!story) return;
		await comicStoriesStore.archiveStory(story.id, !story.isArchived);
	}

	async function handleDelete() {
		if (!story) return;
		if (!confirm(`Story "${story.title}" wirklich löschen?`)) return;
		await comicStoriesStore.deleteStory(story.id);
		await goto('/comic');
	}

	async function handleVisibilityChange(next: VisibilityLevel) {
		if (!story) return;
		await comicStoriesStore.setVisibility(story.id, next);
	}

	/**
	 * Strip a panel from the story without touching the image row.
	 * Re-encrypts `panelMeta` because it's one JSON blob per the
	 * registry; we can't partially update without decrypting first.
	 */
	async function handleRemovePanel(panelId: string) {
		if (!story) return;
		if (
			!confirm(
				'Panel aus der Story entfernen? Das Bild bleibt in deiner Picture-Galerie und kann dort gelöscht werden.'
			)
		)
			return;

		const existing = await comicStoriesTable.get(story.id);
		if (!existing) return;
		const nextIds = (existing.panelImageIds ?? []).filter((pid) => pid !== panelId);
		const nextMeta: Record<string, ComicPanelMeta> = { ...(existing.panelMeta ?? {}) };
		delete nextMeta[panelId];
		const patch = {
			panelImageIds: nextIds,
			panelMeta: nextMeta,
		} as Partial<LocalComicStory>;
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('comicStories', wrapped);
		await comicStoriesTable.update(story.id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	}
</script>

<div class="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
	<nav class="flex items-center gap-2 text-sm">
		<a
			href="/comic"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			aria-label="Zurück zu Comics"
		>
			<ArrowLeft size={16} />
		</a>
		<span class="text-muted-foreground">Comics</span>
	</nav>

	{#if !story}
		{#if story$.loading}
			<p class="text-sm text-muted-foreground">Lädt…</p>
		{:else}
			<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
				<p class="text-sm font-medium text-foreground">Story nicht gefunden.</p>
				<p class="mt-1 text-sm text-muted-foreground">Gelöscht oder in einem anderen Space.</p>
			</div>
		{/if}
	{:else}
		<!-- Meta -->
		<div class="space-y-3 rounded-2xl border border-border bg-card p-5">
			<header class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<h1 class="truncate text-lg font-semibold text-foreground">{story.title}</h1>
					<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span class="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
							{STYLE_LABELS[story.style].de}
						</span>
						<span>
							{story.panelImageIds.length}
							{story.panelImageIds.length === 1 ? 'Panel' : 'Panels'}
						</span>
						{#if story.characterMediaIds.length > 0}
							<span class="text-border">·</span>
							<span>
								{story.characterMediaIds.length} Referenz{story.characterMediaIds.length === 1
									? ''
									: 'en'}
							</span>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<VisibilityPicker
						level={story.visibility ?? 'space'}
						onChange={handleVisibilityChange}
						compact
					/>
					<button
						type="button"
						onclick={handleToggleFavorite}
						aria-label={story.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
						title={story.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
						class="flex h-8 w-8 items-center justify-center rounded-md transition-colors {story.isFavorite
							? 'text-rose-500 hover:bg-rose-500/10'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<Heart size={16} weight={story.isFavorite ? 'fill' : 'regular'} />
					</button>
				</div>
			</header>

			{#if story.description}
				<p class="whitespace-pre-wrap text-sm text-foreground">{story.description}</p>
			{/if}

			{#if story.storyContext}
				<div class="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
					<strong class="text-foreground">Kontext:</strong>
					{story.storyContext}
				</div>
			{/if}
		</div>

		<!-- Panels -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Panels</h2>
				{#if editorMode === 'off' && !story.isArchived}
					<div class="flex items-center gap-1">
						<button
							type="button"
							onclick={() => (editorMode = 'single')}
							class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<Plus size={12} />
							Panel
						</button>
						<button
							type="button"
							onclick={() => (editorMode = 'batch')}
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
							title="2–4 Panels in einem Rutsch generieren"
						>
							<Plus size={12} />
							Batch
						</button>
						<button
							type="button"
							onclick={() => (editorMode = 'ai')}
							class="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
							title="KI schlägt Panels aus einem Tagebuch-Eintrag, Notiz oder Review vor"
						>
							<Sparkle size={12} weight="fill" />
							Mit KI
						</button>
					</div>
				{/if}
			</div>

			<PanelStrip
				panelImageIds={story.panelImageIds}
				panelMeta={story.panelMeta}
				onRemove={handleRemovePanel}
			/>

			{#if editorMode === 'single' && !story.isArchived}
				<PanelEditor
					{story}
					onClose={() => (editorMode = 'off')}
					onGenerated={() => {
						// Keep the editor open for rapid iteration — the user
						// usually wants to generate 3–5 panels in a row. Reset
						// happens inside PanelEditor on success.
					}}
				/>
			{:else if editorMode === 'batch' && !story.isArchived}
				<BatchPanelEditor {story} onClose={() => (editorMode = 'off')} />
			{:else if editorMode === 'ai' && !story.isArchived}
				<StoryboardSuggester {story} onClose={() => (editorMode = 'off')} />
			{/if}
		</div>

		<!-- Secondary actions -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={handleArchive}
				class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
			>
				<Archive size={14} />
				{story.isArchived ? 'Wieder aktiv' : 'Archivieren'}
			</button>
			<button
				type="button"
				onclick={handleDelete}
				class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-error transition-colors hover:bg-error/10"
			>
				<Trash size={14} />
				Löschen
			</button>
		</div>

		{#if story.isArchived}
			<p
				class="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
			>
				<Sparkle size={12} class="inline" /> Archivierte Story — keine Panel-Generierung möglich, bis
				wieder aktiviert.
			</p>
		{/if}
	{/if}
</div>
