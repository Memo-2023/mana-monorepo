<!--
  Wardrobe module root — two tabs: Kleidung (GridView, default) and
  Outfits (OutfitsView). Keep the tab state local; SvelteKit keeps
  ListView mounted across navigations within /wardrobe/, so scrolling
  back to "/wardrobe" preserves which tab the user last opened.

  No mx-auto / max-w wrapper here: the workbench AppPage renders us
  inside a width-sized ModuleShell (~480px by default), and the /wardrobe
  RoutePage is wrapped by (app)/+layout.svelte's `mx-auto max-w-7xl`.
  Adding our own cap stacks paddings and looks wrong in both places.
  container-type: inline-size lets inner views react to the card width
  the same way picture/ListView does.
-->
<script lang="ts">
	import { UserCircle } from '@mana/shared-icons';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { ingestMeImageFile } from '$lib/modules/profile/api/me-images';
	import GridView from './views/GridView.svelte';
	import OutfitsView from './views/OutfitsView.svelte';

	type Tab = 'garments' | 'outfits';

	let activeTab = $state<Tab>('garments');

	const TABS: { key: Tab; label: string }[] = [
		{ key: 'garments', label: 'Kleidung' },
		{ key: 'outfits', label: 'Outfits' },
	];

	// Face-ref banner: the minimum requirement for *any* wardrobe try-on
	// (outfit or solo-garment, accessory or full). Body-ref is asked for
	// later in the detail flow — keeping the top-level banner to one slot
	// avoids a two-upload wall on first open.
	const face$ = useImageByPrimary('face-ref');
	const face = $derived(face$.value);

	let uploadingFace = $state(false);
	let faceUploadError = $state<string | null>(null);

	async function handleFaceUpload(files: File[]) {
		if (files.length === 0) return;
		uploadingFace = true;
		faceUploadError = null;
		try {
			await ingestMeImageFile(files[0], { kind: 'face', claimSlot: 'face-ref' });
		} catch (err) {
			faceUploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploadingFace = false;
		}
	}
</script>

<div class="wardrobe-root">
	<nav class="wardrobe-tabs" aria-label="Ansicht wechseln">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				class="wardrobe-tab"
				class:active={activeTab === tab.key}
				aria-pressed={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	{#if !face$.loading && !face}
		<div class="space-y-3 rounded-xl border border-dashed border-border bg-background/50 p-4">
			<div class="flex items-start gap-3 text-sm">
				<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0 text-primary" />
				<div class="space-y-1">
					<p class="font-medium text-foreground">Lade ein Gesichtsbild hoch</p>
					<p class="text-xs text-muted-foreground">
						Wir brauchen dich auf Bild, damit Try-On Kleidung an dir visualisieren kann. Das Bild
						bleibt lokal und wird nur für deine eigenen Generierungen genutzt.
					</p>
				</div>
			</div>
			<MeImageUploadZone
				variant="compact"
				label="Gesichtsbild hochladen"
				hint="Kopf + Schulter, möglichst neutrale Beleuchtung"
				disabled={uploadingFace}
				onFiles={handleFaceUpload}
			/>
			{#if faceUploadError}
				<div
					class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
					role="alert"
				>
					{faceUploadError}
				</div>
			{/if}
		</div>
	{/if}

	<div class="wardrobe-body">
		{#if activeTab === 'garments'}
			<GridView />
		{:else}
			<OutfitsView />
		{/if}
	</div>
</div>

<style>
	.wardrobe-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		padding: 0.5rem 0.75rem 0.75rem;
		container-type: inline-size;
	}
	.wardrobe-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}
	.wardrobe-tab {
		position: relative;
		padding: 0.5rem 0.75rem;
		margin-bottom: -1px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.wardrobe-tab:hover {
		color: hsl(var(--color-foreground));
	}
	.wardrobe-tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
	}
	.wardrobe-body {
		flex: 1;
		min-height: 0;
	}
	@container (min-width: 640px) {
		.wardrobe-root {
			padding: 0.75rem 1rem 1rem;
			gap: 1rem;
		}
	}
</style>
