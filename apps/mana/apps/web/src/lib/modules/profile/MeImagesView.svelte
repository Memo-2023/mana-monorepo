<!--
  Me-Images settings page — lets the user curate the reference pool
  that AI generation (M3+) may pull from. Two primary slots (Face,
  Fullbody) live up top; the grid below catches every other upload.

  Upload flow: MeImageUploadZone hands us a File[]. For each file we
  read dimensions client-side, upload to the auth-protected
  /profile/me-images/upload endpoint (M1), and write a LocalMeImage
  through the store so encryption + sync happen. If the upload came
  from a slot drop-zone, we also claim that primary slot in the same
  tick.

  All image-level privacy controls (AI opt-in, delete, primary star)
  live on the tile/slot components; this file just orchestrates.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Info, Sparkle } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import MeImageSlotCard from './components/MeImageSlotCard.svelte';
	import MeImageTile from './components/MeImageTile.svelte';
	import MeImageUploadZone from './components/MeImageUploadZone.svelte';
	import { useAllMeImages, useImageByPrimary } from './queries';
	import { meImagesStore } from './stores/me-images.svelte';
	import { readImageDimensions, uploadMeImageFile } from './api/me-images';
	import { migrateLegacyAvatarIfNeeded } from './migration/legacy-avatar';
	import type { MeImage, MeImageKind, MeImagePrimarySlot } from './types';

	// Active-space indicator for the intro card. After v40 meImages are
	// space-scoped — when the user switches spaces the pool changes. The
	// badge makes that transparent without cluttering the rest of the UI.
	const activeSpace = $derived(getActiveSpace());

	// One-shot bootstrap: pull the pre-M1 auth.users.image into meImages
	// as the avatar primary. Idempotent — see migration/legacy-avatar.ts.
	onMount(() => {
		migrateLegacyAvatarIfNeeded().catch((err) => {
			console.error('[profile] legacy avatar migration failed', err);
		});
	});

	const allImages$ = useAllMeImages();
	const faceSlot$ = useImageByPrimary('face-ref');
	const bodySlot$ = useImageByPrimary('body-ref');

	const allImages = $derived(allImages$.value ?? []);
	const faceImage = $derived(faceSlot$.value ?? null);
	const bodyImage = $derived(bodySlot$.value ?? null);

	/**
	 * Images shown in the "weitere Bilder" grid. Anything that isn't
	 * currently holding a primary slot goes here, so the user sees the
	 * full pool and can promote any tile into a slot via the star.
	 */
	const extraImages = $derived(
		allImages.filter((img) => img.id !== faceImage?.id && img.id !== bodyImage?.id)
	);

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);

	function primarySlotForKind(kind: MeImageKind): MeImagePrimarySlot | null {
		if (kind === 'face') return 'face-ref';
		if (kind === 'fullbody') return 'body-ref';
		return null;
	}

	async function ingestFiles(files: File[], kind: MeImageKind, claimSlot?: MeImagePrimarySlot) {
		uploading = true;
		uploadError = null;
		try {
			for (const file of files) {
				const dims = (await readImageDimensions(file)) ?? { width: 0, height: 0 };
				const uploaded = await uploadMeImageFile(file);
				const created = await meImagesStore.createMeImage({
					kind,
					mediaId: uploaded.mediaId,
					storagePath: uploaded.storagePath,
					publicUrl: uploaded.publicUrl,
					thumbnailUrl: uploaded.thumbnailUrl ?? null,
					width: dims.width,
					height: dims.height,
				});
				if (claimSlot) {
					// setPrimary transactionally clears any previous slot-holder,
					// so the old Face/Fullbody automatically drops into the grid.
					await meImagesStore.setPrimary(created.id, claimSlot);
				}
			}
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploading = false;
		}
	}

	async function handleToggleAi(id: string, enabled: boolean) {
		await meImagesStore.setAiReferenceEnabled(id, enabled);
	}

	async function handleTogglePrimary(img: MeImage) {
		const slot = primarySlotForKind(img.kind);
		if (!slot) return;
		const isPrimary = img.primaryFor === slot;
		await meImagesStore.setPrimary(img.id, isPrimary ? null : slot);
	}

	async function handleDelete(id: string) {
		if (!confirm('Bild wirklich löschen?')) return;
		await meImagesStore.deleteMeImage(id);
	}
</script>

<div class="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
	<!-- Intro + privacy hint -->
	<section class="rounded-2xl border border-border bg-card p-5">
		<div class="mb-2 flex items-center justify-between gap-2 text-foreground">
			<div class="flex items-center gap-2">
				<Sparkle size={18} weight="fill" class="text-primary" />
				<h2 class="text-base font-semibold">Meine Bilder</h2>
			</div>
			{#if activeSpace}
				<span
					class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
					title="Der Pool ist pro Space — Bilder aus anderen Spaces bleiben dort."
				>
					{activeSpace.type === 'personal' ? 'Persönlich' : activeSpace.name}
				</span>
			{/if}
		</div>
		<p class="text-sm text-muted-foreground">
			Hinterlege hier ein Gesichts- und ein Ganzkörper-Bild sowie weitere Referenzen. Die
			Bildgenerierung nutzt diese später, um dich selbst zu visualisieren — etwa um Outfits, Brillen
			oder Frisuren anzuprobieren.
		</p>
		<p class="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
			<Info size={14} weight="regular" class="mt-0.5 flex-shrink-0" />
			<span>
				Pro Bild entscheidest du mit dem "KI darf nutzen"-Schalter, ob es an den Bildgenerator
				gesendet werden darf. Ohne diesen Schalter bleibt das Bild nur für dich sichtbar.
			</span>
		</p>
	</section>

	{#if uploadError}
		<div
			class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
			role="alert"
		>
			{uploadError}
		</div>
	{/if}

	<!-- Primary slots -->
	<section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<MeImageSlotCard
			title="Gesicht"
			kind="face"
			slot="face-ref"
			image={faceImage}
			emptyLabel="Porträt hochladen"
			emptyHint="Kopf + Schulter, möglichst neutrale Beleuchtung"
			{uploading}
			onFiles={(files, kind, slot) => ingestFiles(files, kind, slot)}
			onToggleAi={handleToggleAi}
			onDelete={handleDelete}
		/>
		<MeImageSlotCard
			title="Ganzkörper"
			kind="fullbody"
			slot="body-ref"
			image={bodyImage}
			emptyLabel="Ganzkörperbild hochladen"
			emptyHint="Stehend, freier Hintergrund, gut erkennbare Körperhaltung"
			{uploading}
			onFiles={(files, kind, slot) => ingestFiles(files, kind, slot)}
			onToggleAi={handleToggleAi}
			onDelete={handleDelete}
		/>
	</section>

	<!-- Additional references -->
	<section>
		<header class="mb-3 flex items-baseline justify-between">
			<h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Weitere Bilder
			</h3>
			{#if extraImages.length > 0}
				<span class="text-xs text-muted-foreground">
					{extraImages.length}
					{extraImages.length === 1 ? 'Bild' : 'Bilder'}
				</span>
			{/if}
		</header>

		{#if extraImages.length > 0}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each extraImages as img (img.id)}
					<MeImageTile
						image={img}
						primarySlotForKind={primarySlotForKind(img.kind)}
						onToggleAi={(v) => handleToggleAi(img.id, v)}
						onTogglePrimary={() => handleTogglePrimary(img)}
						onDelete={() => handleDelete(img.id)}
					/>
				{/each}
			</div>
		{/if}

		<div class="mt-3">
			<MeImageUploadZone
				variant="compact"
				label="Weitere Referenzen hochladen"
				hint="z.B. andere Posen, Outfits, Hände — standardmäßig als „Referenz“ markiert"
				disabled={uploading}
				onFiles={(files) => ingestFiles(files, 'reference')}
			/>
		</div>
	</section>
</div>
