<!--
  Wardrobe grid view — category tabs + upload drop-zone + garment grid.
  The active category tab pre-selects the kind for new drops, so "Oberteile"
  tab + drop = garments created as kind='top'. On the "Alle" tab drops
  default to 'other' (user edits later on detail page).

  Layout: tabs → upload zone → grid. Upload is always-visible at the top
  of the view so a first-time user doesn't have to scroll past an empty
  grid to find it. The welcome blurb that used to sit on top now lives
  behind the help (?) icon in the ModuleShell header — wired via
  `wardrobe` in app-registry/help-content.ts.

  Upload flow: drop file(s) → read dimensions client-side → POST to
  `/api/v1/wardrobe/garments/upload` → write a LocalWardrobeGarment
  through the store (encryption + sync happen in there). Name defaults
  to the filename-sans-extension, as in the picture module's upload.
-->
<script lang="ts">
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { readImageDimensions } from '$lib/modules/profile/api/me-images';
	import { useAllGarments } from '../queries';
	import { wardrobeGarmentsStore } from '../stores/garments.svelte';
	import { uploadGarmentPhoto } from '../api/upload';
	import { CATEGORY_LABELS, CATEGORY_LABELS_SINGULAR } from '../constants';
	import CategoryTabs from '../components/CategoryTabs.svelte';
	import GarmentCard from '../components/GarmentCard.svelte';
	import { prettifyUploadName } from '../utils/name';
	import { getActiveSpace } from '$lib/data/scope';
	import type { GarmentCategory } from '../types';

	const garments$ = useAllGarments();
	const activeSpace = $derived(getActiveSpace());

	let activeTab = $state<GarmentCategory | 'all'>('all');

	const garments = $derived(garments$.value ?? []);
	const filtered = $derived(
		activeTab === 'all' ? garments : garments.filter((g) => g.category === activeTab)
	);

	const counts = $derived.by(() => {
		const map: Partial<Record<GarmentCategory | 'all', number>> = { all: garments.length };
		for (const g of garments) {
			map[g.category] = (map[g.category] ?? 0) + 1;
		}
		return map;
	});

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);

	async function ingestFiles(files: File[]) {
		// Pre-select kind from the active tab. Drops on "Alle" land as
		// 'other' — less specific, user edits on the detail page. Drops
		// on e.g. "Oberteile" land as 'top' ready-to-use.
		const defaultCategory: GarmentCategory = activeTab === 'all' ? 'other' : activeTab;
		uploading = true;
		uploadError = null;
		try {
			for (const file of files) {
				// Dimensions read but not currently stored — kept for parity
				// with me-images upload and future "width/height"-on-row work.
				await readImageDimensions(file);
				const uploaded = await uploadGarmentPhoto(file);
				await wardrobeGarmentsStore.createGarment({
					// prettifyUploadName turns e-commerce slugs like
					// `17390-gestreiftes-herren-t-shirt-aus-baumwolle-17390-2-w`
					// into `Gestreiftes Herren-T-Shirt Aus Baumwolle 2-W` so the
					// garment row lands with a presentable default. User still
					// edits on the detail page for anything nuanced.
					name: prettifyUploadName(file.name),
					category: defaultCategory,
					mediaIds: [uploaded.mediaId],
				});
			}
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="space-y-4">
	<!-- Category tabs — active tab drives the default kind for drops. -->
	<CategoryTabs active={activeTab} {counts} onChange={(next) => (activeTab = next)} />

	<!-- Upload zone lives at the top so it's always reachable without
	     scrolling past an empty grid. Label reflects the active category
	     so the user knows what kind the drop will be stamped with. -->
	<MeImageUploadZone
		variant="compact"
		label={activeTab === 'all'
			? 'Kleidungsstück hochladen'
			: `${CATEGORY_LABELS_SINGULAR[activeTab]} hochladen`}
		hint="Foto frontal, heller Hintergrund — bessere Try-On-Ergebnisse"
		disabled={uploading}
		onFiles={ingestFiles}
	/>

	{#if uploadError}
		<div class="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error" role="alert">
			{uploadError}
		</div>
	{/if}

	<!-- Grid -->
	{#if filtered.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each filtered as g (g.id)}
				<GarmentCard garment={g} />
			{/each}
		</div>
	{:else if garments.length === 0}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center">
			<p class="text-sm font-medium text-foreground">Noch nichts im Schrank.</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Zieh ein Foto in die Zone oben — oder klick sie an, um eins auszuwählen.
			</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center">
			<p class="text-sm text-muted-foreground">
				Keine Einträge unter <strong class="text-foreground"
					>{activeTab === 'all' ? 'Alle' : CATEGORY_LABELS[activeTab]}</strong
				>.
			</p>
		</div>
	{/if}

	<!-- Non-personal-space footer hint: the wardrobe is per-Space, so in
	     a Brand/Family/Club/Team/Practice space it's worth signalling that
	     uploads don't leak into personal. Hidden in personal to keep the
	     view clean. -->
	{#if activeSpace && activeSpace.type !== 'personal'}
		<p class="text-xs text-muted-foreground">
			Dieser Schrank gehört zu <strong class="text-foreground">{activeSpace.name}</strong> — Uploads landen
			nur hier, nicht in deinem persönlichen Schrank.
		</p>
	{/if}
</div>
