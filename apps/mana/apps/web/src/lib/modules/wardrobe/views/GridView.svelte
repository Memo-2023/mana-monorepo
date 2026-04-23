<!--
  Wardrobe grid view — category tabs + garment grid + upload drop-zone.
  The active category tab pre-selects the kind for new drops, so "Oberteile"
  tab + drop = garments created as kind='top'. On the "Alle" tab drops
  default to 'other' (user edits later on detail page).

  Upload flow: drop file(s) → read dimensions client-side → POST to
  `/api/v1/wardrobe/garments/upload` → write a LocalWardrobeGarment
  through the store (encryption + sync happen in there). Name defaults
  to the filename-sans-extension, as in the picture module's upload.
-->
<script lang="ts">
	import { Info, Sparkle } from '@mana/shared-icons';
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { readImageDimensions } from '$lib/modules/profile/api/me-images';
	import { useAllGarments } from '../queries';
	import { wardrobeGarmentsStore } from '../stores/garments.svelte';
	import { uploadGarmentPhoto } from '../api/upload';
	import { CATEGORY_LABELS, CATEGORY_LABELS_SINGULAR } from '../constants';
	import CategoryTabs from '../components/CategoryTabs.svelte';
	import GarmentCard from '../components/GarmentCard.svelte';
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

	function stripExt(filename: string): string {
		const i = filename.lastIndexOf('.');
		return i > 0 ? filename.slice(0, i) : filename;
	}

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
					name: stripExt(file.name),
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

<div class="space-y-6">
	<!-- Intro + active-space hint -->
	<section class="rounded-2xl border border-border bg-card p-5">
		<div class="mb-2 flex items-center justify-between gap-2 text-foreground">
			<div class="flex items-center gap-2">
				<Sparkle size={18} weight="fill" class="text-primary" />
				<h2 class="text-base font-semibold">Kleiderschrank</h2>
			</div>
			{#if activeSpace}
				<span
					class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					title="Der Kleiderschrank ist pro Space — andere Spaces haben ihren eigenen."
				>
					{activeSpace.type === 'personal' ? 'Persönlich' : activeSpace.name}
				</span>
			{/if}
		</div>
		<p class="text-sm text-muted-foreground">
			Fotografiere Kleidungsstücke und Accessoires, gruppiere sie in Outfits, und probiere sie mit
			KI an dir selbst an. Du kannst sie später im Generator als Referenz nutzen.
		</p>
		<p class="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
			<Info size={14} weight="regular" class="mt-0.5 flex-shrink-0" />
			<span>
				Aktive Kategorie bestimmt den Typ für neue Uploads — auf "Alle" landen sie als "{CATEGORY_LABELS_SINGULAR.other}"
				und können auf der Detailseite umgestellt werden.
			</span>
		</p>
	</section>

	<!-- Category tabs -->
	<CategoryTabs active={activeTab} {counts} onChange={(next) => (activeTab = next)} />

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
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
			<p class="text-sm font-medium text-foreground">Noch nichts im Schrank.</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Lade dein erstes Kleidungsstück hoch — unten auf "Hinzufügen" oder zieh eine Datei direkt in
				die Zone.
			</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
			<p class="text-sm text-muted-foreground">
				Keine Einträge unter <strong class="text-foreground"
					>{activeTab === 'all' ? 'Alle' : CATEGORY_LABELS[activeTab]}</strong
				>.
			</p>
		</div>
	{/if}

	<!-- Upload zone -->
	<MeImageUploadZone
		variant="compact"
		label={activeTab === 'all'
			? 'Kleidungsstück hochladen'
			: `${CATEGORY_LABELS_SINGULAR[activeTab]} hochladen`}
		hint="Foto frontal, möglichst heller Hintergrund — bessere Try-On-Ergebnisse"
		disabled={uploading}
		onFiles={ingestFiles}
	/>
</div>
