<!--
  Garment detail page. Renders the primary photo + a compact metadata
  card that flips to edit mode via GarmentForm. "Heute getragen"
  increments wearCount + stamps lastWornAt. Archive and delete both
  sit in an overflow row below — visible but unobtrusive.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { CheckCircle, PencilSimple, Archive, Trash } from '@mana/shared-icons';
	import { useGarment, useGarmentSoloTryOns, useOutfitsContainingGarment } from '../queries';
	import { wardrobeGarmentsStore } from '../stores/garments.svelte';
	import { garmentPhotoUrl } from '../api/media-url';
	import { CATEGORY_LABELS } from '../constants';
	import GarmentForm from '../components/GarmentForm.svelte';
	import GarmentTryOnButton from '../components/GarmentTryOnButton.svelte';
	import ImageLightbox from '$lib/modules/picture/components/ImageLightbox.svelte';
	import type { Image } from '$lib/modules/picture/types';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	// id is stable for this component instance — the route file wraps
	// us in `{#key id}` so a navigation to a different garment re-mounts.
	// svelte-ignore state_referenced_locally
	const garment$ = useGarment(id);
	const garment = $derived(garment$.value);

	// Back-refs into Picture + sibling outfits. Both live-queries so
	// a fresh try-on (solo or via a linked outfit) pushes into the
	// strips without a manual reload.
	// svelte-ignore state_referenced_locally
	const soloTryOns$ = useGarmentSoloTryOns(id);
	// svelte-ignore state_referenced_locally
	const outfits$ = useOutfitsContainingGarment(id);
	const soloTryOns = $derived(soloTryOns$.value);
	const outfits = $derived(outfits$.value);

	let editing = $state(false);
	let saving = $state(false);
	let markingWorn = $state(false);

	// Lightbox state — shared between the Anproben-Strip (try-on thumbs)
	// and the hero-photo. Null = closed, Image = open.
	let lightboxImage = $state<Image | null>(null);

	// The hero-photo is a garment row, not a picture.Image — synthesise
	// the shape the lightbox expects so clicking the photo opens the
	// full-resolution mana-media URL with the garment's name as
	// prompt-caption. No model / dims / date are rendered (all optional
	// in the lightbox), keeping the modal clean for a plain clothing
	// photo.
	function openPhotoLightbox() {
		if (!garment || !garment.mediaIds[0]) return;
		lightboxImage = {
			id: garment.id,
			prompt: garment.name,
			storagePath: garment.mediaIds[0],
			filename: garment.name,
			publicUrl: garmentPhotoUrl(garment.mediaIds[0], 'large'),
			visibility: 'private',
			isFavorite: false,
			downloadCount: 0,
			createdAt: garment.createdAt,
			updatedAt: garment.updatedAt,
		};
	}

	async function handleMarkWorn() {
		if (!garment) return;
		markingWorn = true;
		try {
			await wardrobeGarmentsStore.markWornToday(garment.id);
		} finally {
			markingWorn = false;
		}
	}

	async function handleArchive() {
		if (!garment) return;
		await wardrobeGarmentsStore.archiveGarment(garment.id, !garment.isArchived);
	}

	async function handleDelete() {
		if (!garment) return;
		if (!confirm(`"${garment.name}" wirklich löschen?`)) return;
		await wardrobeGarmentsStore.deleteGarment(garment.id);
		goto('/wardrobe');
	}

	type SavePatch = Parameters<typeof wardrobeGarmentsStore.updateGarment>[1];

	async function handleSave(patch: SavePatch) {
		if (!garment) return;
		saving = true;
		try {
			await wardrobeGarmentsStore.updateGarment(garment.id, patch);
			editing = false;
		} finally {
			saving = false;
		}
	}
</script>

<!-- The ModuleShell wrapping this view already renders both the
     back-arrow and the "Kleiderschrank" title in its header. An inner
     breadcrumb would double them up — drop it. -->
<div class="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
	{#if !garment}
		{#if garment$.loading}
			<p class="text-sm text-muted-foreground">Lädt…</p>
		{:else}
			<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
				<p class="text-sm font-medium text-foreground">Nicht gefunden.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Das Kleidungsstück wurde gelöscht oder gehört zu einem anderen Space.
				</p>
			</div>
		{/if}
	{:else}
		<div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
			<!-- Photo — clickable: opens the lightbox with the full-res
			     image so the user can inspect detail at the original
			     resolution. Hover state mirrors the Try-On thumbnail
			     strip + model picker (primary-tinted border) so the
			     whole page uses one interaction vocabulary. -->
			{#if garment.mediaIds[0]}
				<button
					type="button"
					onclick={openPhotoLightbox}
					aria-label="Foto vergrößern"
					class="group block overflow-hidden rounded-2xl border border-border bg-muted transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
				>
					<img
						src={garmentPhotoUrl(garment.mediaIds[0], 'large')}
						alt={garment.name}
						class="h-full w-full object-cover transition-transform group-hover:scale-[1.01]"
					/>
				</button>
			{:else}
				<div class="rounded-2xl border border-border bg-muted"></div>
			{/if}

			<!-- Metadata / Edit -->
			<div class="space-y-4">
				{#if editing}
					<GarmentForm {garment} {saving} onSave={handleSave} onCancel={() => (editing = false)} />
				{:else}
					<div class="space-y-4 rounded-2xl border border-border bg-card p-5">
						<header class="flex items-start justify-between gap-2">
							<div>
								<h1 class="text-lg font-semibold text-foreground">{garment.name}</h1>
								<p class="text-sm text-muted-foreground">{CATEGORY_LABELS[garment.category]}</p>
							</div>
							<!-- Edit affordance uses the same primary-tinted hover as
							     the Try-On thumbs / model picker so interactive elements
							     on the page share one hover vocabulary. Label is
							     always visible (not hover-to-discover) so editing
							     reads as a first-class action. -->
							<button
								type="button"
								onclick={() => (editing = true)}
								aria-label="Bearbeiten"
								class="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
							>
								<PencilSimple size={14} />
								Bearbeiten
							</button>
						</header>

						<dl class="grid grid-cols-2 gap-3 text-sm">
							{#if garment.brand}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Marke</dt>
									<dd class="text-foreground">{garment.brand}</dd>
								</div>
							{/if}
							{#if garment.color}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Farbe</dt>
									<dd class="text-foreground">{garment.color}</dd>
								</div>
							{/if}
							{#if garment.size}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Größe</dt>
									<dd class="text-foreground">{garment.size}</dd>
								</div>
							{/if}
							{#if garment.material}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Material</dt>
									<dd class="text-foreground">{garment.material}</dd>
								</div>
							{/if}
							{#if garment.priceCents}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Preis</dt>
									<dd class="text-foreground">
										{(garment.priceCents / 100).toFixed(2)}
										{garment.currency ?? ''}
									</dd>
								</div>
							{/if}
							{#if garment.wearCount && garment.wearCount > 0}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Getragen</dt>
									<dd class="text-foreground">
										{garment.wearCount}×{garment.lastWornAt
											? ` · zuletzt ${garment.lastWornAt}`
											: ''}
									</dd>
								</div>
							{/if}
						</dl>

						{#if garment.tags.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each garment.tags as tag}
									<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										{tag}
									</span>
								{/each}
							</div>
						{/if}

						{#if garment.notes}
							<p class="whitespace-pre-wrap text-sm text-foreground">{garment.notes}</p>
						{/if}
					</div>

					<!-- Try-on — "wie sähe das an mir aus" -->
					<GarmentTryOnButton {garment} />

					<!-- Secondary-action row: "Heute getragen" is the frequent
					     positive action and takes most of the width; Archive and
					     Löschen shrink to icon-only buttons on the right so they
					     stop competing with the primary CTA for attention. All
					     three share the primary-tinted hover; Löschen keeps its
					     destructive-red tint. Tooltips (title+aria-label) carry
					     the full label for discoverability. -->
					<div class="flex gap-2">
						<button
							type="button"
							onclick={handleMarkWorn}
							disabled={markingWorn}
							class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-background"
						>
							<CheckCircle size={14} />
							{markingWorn ? 'Gespeichert…' : 'Heute getragen'}
						</button>
						<button
							type="button"
							onclick={handleArchive}
							aria-label={garment.isArchived ? 'Wieder aktiv setzen' : 'Archivieren'}
							title={garment.isArchived ? 'Wieder aktiv setzen' : 'Archivieren'}
							class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
						>
							<Archive size={16} />
						</button>
						<button
							type="button"
							onclick={handleDelete}
							aria-label="Löschen"
							title="Löschen"
							class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-border bg-background text-error transition-colors hover:border-error/50 hover:bg-error/10"
						>
							<Trash size={16} />
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Solo try-on history — every image produced by
		     runGarmentTryOn carrying this garment's wardrobeGarmentId FK.
		     Clicking a thumb opens the full image in the Picture gallery
		     so favoriting / download / delete etc. live in their canonical
		     home. -->
		{#if soloTryOns.length > 0}
			<section class="space-y-2">
				<header class="flex items-baseline justify-between">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Anproben · {soloTryOns.length}
					</h2>
				</header>
				<div class="flex gap-3 overflow-x-auto pb-1">
					{#each soloTryOns as image (image.id)}
						<button
							type="button"
							onclick={() => (lightboxImage = image)}
							class="group block flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted transition-all hover:border-primary/50"
							title={image.prompt}
						>
							{#if image.publicUrl}
								<img
									src={image.publicUrl}
									alt={image.prompt}
									loading="lazy"
									class="h-40 w-28 object-cover transition-transform group-hover:scale-[1.02]"
								/>
							{/if}
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Outfits containing this garment — reverse of DetailOutfitView's
		     garment list. Each card links to /wardrobe/outfit/[id]; the
		     lastTryOn snapshot (cached on the outfit row) gives an instant
		     thumb without another image round-trip. -->
		{#if outfits.length > 0}
			<section class="space-y-2">
				<header class="flex items-baseline justify-between">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						In Outfits · {outfits.length}
					</h2>
				</header>
				<div class="flex gap-3 overflow-x-auto pb-1">
					{#each outfits as outfit (outfit.id)}
						<a
							href={`/wardrobe/outfit/${outfit.id}`}
							class="group block w-32 flex-shrink-0 space-y-1.5"
							title={outfit.name}
						>
							<div
								class="aspect-[2/3] overflow-hidden rounded-xl border border-border bg-muted transition-all group-hover:border-primary/50"
							>
								{#if outfit.lastTryOn?.imageUrl}
									<img
										src={outfit.lastTryOn.imageUrl}
										alt={outfit.name}
										loading="lazy"
										class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center text-xs text-muted-foreground"
									>
										Noch keine Anprobe
									</div>
								{/if}
							</div>
							<p class="truncate text-xs font-medium text-foreground">{outfit.name}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>

<!-- Lightbox for Solo-Try-On previews. The action slot carries a
     deep-link to the Picture gallery so the user can reach the full
     CRUD surface (Favorit, Archiv, Download) without us duplicating
     those buttons here in Wardrobe. -->
<ImageLightbox image={lightboxImage} onClose={() => (lightboxImage = null)}>
	{#snippet actions()}
		<a
			href="/picture"
			class="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
		>
			In Picture öffnen
		</a>
	{/snippet}
</ImageLightbox>
