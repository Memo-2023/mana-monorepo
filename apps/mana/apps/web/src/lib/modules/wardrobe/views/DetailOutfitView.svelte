<!--
  Outfit detail page. Left column: the latest try-on preview (falls back
  to garment collage when no try-on has been rendered yet — M4 wires up
  the actual Try-On button). Right column: metadata, garment list (each
  tile links to the garment's own detail page), and the action rail:
  Favorite, Edit (→ composer), Archive, Delete.

  The Try-On action is a stub in M3 — the Picture-generator reference
  endpoint is already wired (M3 of me-images plan), but the composer
  logic that auto-fills referenceMediaIds from face+body+garments lives
  in M4 of this plan.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Archive, Heart, PencilSimple, Trash } from '@mana/shared-icons';
	import { useAllGarments, useOutfit, useOutfitTryOns } from '../queries';
	import { wardrobeOutfitsStore } from '../stores/outfits.svelte';
	import { garmentPhotoUrl } from '../api/media-url';
	import { CATEGORY_LABELS_SINGULAR, OCCASION_LABELS, SEASON_LABELS } from '../constants';
	import TryOnButton from '../components/TryOnButton.svelte';
	import type { Garment } from '../types';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	// Wrapped in `{#key id}` by the route — captures are intentional.
	// svelte-ignore state_referenced_locally
	const outfit$ = useOutfit(id);
	// svelte-ignore state_referenced_locally
	const tryOns$ = useOutfitTryOns(id);
	const allGarments$ = useAllGarments();

	const outfit = $derived(outfit$.value);
	const tryOns = $derived(tryOns$.value ?? []);
	const allGarments = $derived(allGarments$.value ?? []);

	const garmentsById = $derived.by<Record<string, Garment>>(() => {
		const map: Record<string, Garment> = {};
		for (const g of allGarments) map[g.id] = g;
		return map;
	});

	const resolvedGarments = $derived.by<Garment[]>(() => {
		if (!outfit) return [];
		const out: Garment[] = [];
		for (const gid of outfit.garmentIds) {
			const g = garmentsById[gid];
			if (g) out.push(g);
		}
		return out;
	});

	async function handleToggleFavorite() {
		if (!outfit) return;
		await wardrobeOutfitsStore.toggleFavorite(outfit.id);
	}

	async function handleArchive() {
		if (!outfit) return;
		await wardrobeOutfitsStore.archiveOutfit(outfit.id, !outfit.isArchived);
	}

	async function handleDelete() {
		if (!outfit) return;
		if (!confirm(`Outfit "${outfit.name}" wirklich löschen?`)) return;
		await wardrobeOutfitsStore.deleteOutfit(outfit.id);
		goto('/wardrobe');
	}
</script>

<div class="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
	<nav class="flex items-center gap-2 text-sm">
		<a
			href="/wardrobe"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			aria-label="Zurück zum Kleiderschrank"
		>
			<ArrowLeft size={16} />
		</a>
		<span class="text-muted-foreground">Kleiderschrank · Outfits</span>
	</nav>

	{#if !outfit}
		{#if outfit$.loading}
			<p class="text-sm text-muted-foreground">Lädt…</p>
		{:else}
			<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
				<p class="text-sm font-medium text-foreground">Outfit nicht gefunden.</p>
				<p class="mt-1 text-sm text-muted-foreground">Gelöscht oder in einem anderen Space.</p>
			</div>
		{/if}
	{:else}
		<div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
			<!-- Cover (last try-on or collage fallback) -->
			<div class="space-y-3">
				<div class="overflow-hidden rounded-2xl border border-border bg-muted">
					{#if outfit.lastTryOn?.imageUrl}
						<img
							src={outfit.lastTryOn.imageUrl}
							alt="Try-On Vorschau"
							class="h-full w-full object-cover"
						/>
					{:else if resolvedGarments.length > 0}
						<div class="grid grid-cols-2 gap-0.5 bg-border">
							{#each resolvedGarments.slice(0, 4) as g}
								{@const mediaId = g.mediaIds[0]}
								<div class="aspect-square overflow-hidden bg-muted">
									{#if mediaId}
										<img
											src={garmentPhotoUrl(mediaId, 'medium')}
											alt={g.name}
											class="h-full w-full object-cover"
										/>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<div
							class="flex aspect-square items-center justify-center text-sm text-muted-foreground"
						>
							Keine Kleidungsstücke
						</div>
					{/if}
				</div>

				<!-- Try-On action (M4) -->
				<TryOnButton {outfit} garments={resolvedGarments} />

				{#if tryOns.length > 0}
					<div>
						<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Try-On Verlauf
						</h3>
						<div class="flex gap-2 overflow-x-auto">
							{#each tryOns as t (t.id)}
								{#if t.publicUrl}
									<img
										src={t.publicUrl}
										alt={outfit.name}
										class="h-20 w-20 flex-shrink-0 rounded-md border border-border bg-muted object-cover"
										loading="lazy"
									/>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Metadata + actions -->
			<div class="space-y-4">
				<div class="space-y-3 rounded-2xl border border-border bg-card p-5">
					<header class="flex items-start justify-between gap-2">
						<div>
							<h1 class="text-lg font-semibold text-foreground">{outfit.name}</h1>
							<div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<span>
									{outfit.garmentIds.length}
									{outfit.garmentIds.length === 1 ? 'Stück' : 'Stücke'}
								</span>
								{#if outfit.occasion}
									<span class="text-border">·</span>
									<span>{OCCASION_LABELS[outfit.occasion]}</span>
								{/if}
								{#if outfit.season && outfit.season.length > 0}
									<span class="text-border">·</span>
									<span>{outfit.season.map((s) => SEASON_LABELS[s]).join(', ')}</span>
								{/if}
							</div>
						</div>
						<div class="flex gap-1">
							<button
								type="button"
								onclick={handleToggleFavorite}
								aria-label={outfit.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
								title={outfit.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
								class="flex h-8 w-8 items-center justify-center rounded-md transition-colors {outfit.isFavorite
									? 'text-rose-500 hover:bg-rose-500/10'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
							>
								<Heart size={16} weight={outfit.isFavorite ? 'fill' : 'regular'} />
							</button>
							<a
								href="/wardrobe/compose/{outfit.id}"
								aria-label="Bearbeiten"
								title="Bearbeiten"
								class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<PencilSimple size={16} />
							</a>
						</div>
					</header>

					{#if outfit.description}
						<p class="whitespace-pre-wrap text-sm text-foreground">{outfit.description}</p>
					{/if}

					{#if outfit.tags.length > 0}
						<div class="flex flex-wrap gap-1.5">
							{#each outfit.tags as tag}
								<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Garments in this outfit -->
				<div class="space-y-3 rounded-2xl border border-border bg-card p-5">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Zusammenstellung
					</h2>
					{#if resolvedGarments.length > 0}
						<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
							{#each resolvedGarments as g (g.id)}
								{@const mediaId = g.mediaIds[0]}
								<a
									href="/wardrobe/garment/{g.id}"
									class="group overflow-hidden rounded-md border border-border bg-muted transition-shadow hover:shadow-md"
								>
									<div class="aspect-square">
										{#if mediaId}
											<img
												src={garmentPhotoUrl(mediaId, 'thumb')}
												alt={g.name}
												loading="lazy"
												class="h-full w-full object-cover"
											/>
										{/if}
									</div>
									<div class="px-1.5 py-1">
										<p class="truncate text-xs font-medium text-foreground">{g.name}</p>
										<p class="truncate text-[10px] text-muted-foreground">
											{CATEGORY_LABELS_SINGULAR[g.category]}
										</p>
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">
							Referenzierte Kleidungsstücke wurden entfernt oder gehören zu einem anderen Space.
						</p>
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
						{outfit.isArchived ? 'Wieder aktiv' : 'Archivieren'}
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
			</div>
		</div>
	{/if}
</div>
