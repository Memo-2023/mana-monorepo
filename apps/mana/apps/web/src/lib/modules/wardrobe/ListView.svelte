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
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { CheckCircle, SpinnerGap, UserCircle } from '@mana/shared-icons';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { ingestMeImageFile } from '$lib/modules/profile/api/me-images';
	import { repairSilentTwinAvatarRows } from '$lib/modules/profile/migration/repair-silent-twin';
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

	// Banner has three phases: prompt (empty) → uploading → success.
	// The face$ live-query flips to the new image as soon as the Dexie
	// write lands, which would normally unmount the banner instantly —
	// so we gate the unmount on `uploadPhase` returning to 'idle' after
	// a short celebration window. Gives the user a concrete "✓ saved"
	// moment and a pointer to the next step instead of a silent pop.
	type UploadPhase = 'idle' | 'uploading' | 'success';
	let uploadPhase = $state<UploadPhase>('idle');
	let uploadedPreviewUrl = $state<string | null>(null);
	let faceUploadError = $state<string | null>(null);
	let successTimeout: ReturnType<typeof setTimeout> | null = null;

	const showBanner = $derived(!face$.loading && (!face || uploadPhase === 'success'));

	async function handleFaceUpload(files: File[]) {
		if (files.length === 0) return;
		if (successTimeout) {
			clearTimeout(successTimeout);
			successTimeout = null;
		}
		uploadPhase = 'uploading';
		faceUploadError = null;
		try {
			const image = await ingestMeImageFile(files[0], {
				kind: 'face',
				claimSlot: 'face-ref',
			});
			uploadedPreviewUrl = image.thumbnailUrl ?? image.publicUrl ?? null;
			uploadPhase = 'success';
			// face$ is already flipped via liveQuery; hold the success card
			// visible briefly so the user sees the confirmation, then let
			// the banner unmount and GridView take over as the next step.
			successTimeout = setTimeout(() => {
				uploadPhase = 'idle';
				uploadedPreviewUrl = null;
				successTimeout = null;
			}, 2500);
		} catch (err) {
			faceUploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
			uploadPhase = 'idle';
		}
	}

	function dismissSuccess() {
		if (successTimeout) {
			clearTimeout(successTimeout);
			successTimeout = null;
		}
		uploadPhase = 'idle';
		uploadedPreviewUrl = null;
	}

	// Repair rows that the M2.5 silent-twin bug left with
	// primaryFor='avatar' instead of 'face-ref'. Idempotent + guarded
	// by a localStorage flag. Runs here (not only in MeImagesView) so
	// a user who uploaded a face photo via the wardrobe banner under
	// the buggy code gets their row flipped to the correct slot on
	// the next mount, without having to visit /profile/me-images.
	onMount(() => {
		repairSilentTwinAvatarRows().catch((err) => {
			console.error('[wardrobe] silent-twin repair failed', err);
		});
	});
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

	{#if showBanner}
		<div
			class="face-banner space-y-3 rounded-xl border border-dashed p-4"
			class:face-banner-success={uploadPhase === 'success'}
			transition:fade={{ duration: 250 }}
		>
			{#if uploadPhase === 'success'}
				<div class="flex items-center gap-3" role="status" aria-live="polite">
					{#if uploadedPreviewUrl}
						<img
							src={uploadedPreviewUrl}
							alt=""
							class="h-12 w-12 flex-shrink-0 rounded-full border border-primary/30 object-cover"
						/>
					{:else}
						<span
							class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
						>
							<CheckCircle size={24} weight="fill" />
						</span>
					{/if}
					<div class="flex-1 space-y-0.5">
						<p class="flex items-center gap-1.5 text-sm font-medium text-foreground">
							<CheckCircle size={14} weight="fill" class="text-primary" />
							Gesichtsbild gespeichert
						</p>
						<p class="text-xs text-muted-foreground">
							Perfekt — als nächstes lädst du unten dein erstes Kleidungsstück hoch.
						</p>
					</div>
					<button
						type="button"
						onclick={dismissSuccess}
						class="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Schließen
					</button>
				</div>
			{:else}
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
				<div class="relative">
					<MeImageUploadZone
						variant="compact"
						label={uploadPhase === 'uploading' ? 'Wird hochgeladen…' : 'Gesichtsbild hochladen'}
						hint="Kopf + Schulter, möglichst neutrale Beleuchtung"
						disabled={uploadPhase === 'uploading'}
						onFiles={handleFaceUpload}
					/>
					{#if uploadPhase === 'uploading'}
						<span
							class="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
							role="status"
							aria-live="polite"
						>
							<SpinnerGap size={12} class="spinner" weight="bold" />
							Lade…
						</span>
					{/if}
				</div>
				{#if faceUploadError}
					<div
						class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
						role="alert"
					>
						{faceUploadError}
					</div>
				{/if}
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
	.face-banner {
		border-color: hsl(var(--color-border));
		background: hsl(var(--color-background) / 0.5);
		transition:
			background-color 0.25s,
			border-color 0.25s;
	}
	.face-banner-success {
		border-style: solid;
		border-color: hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.06);
	}
	/* The spinner class travels through Phosphor's <SpinnerGap class={…}>,
	   which is a child component, so scoped CSS needs :global() to reach
	   the rendered <svg>. Nested under .face-banner keeps it local. */
	.face-banner :global(.spinner) {
		animation: wardrobe-spin 0.9s linear infinite;
	}
	@keyframes wardrobe-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	@container (min-width: 640px) {
		.wardrobe-root {
			padding: 0.75rem 1rem 1rem;
			gap: 1rem;
		}
	}
</style>
