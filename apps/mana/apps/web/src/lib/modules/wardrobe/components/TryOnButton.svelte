<!--
  Try-On action for the outfit detail page. Handles three states:
  ready (face + body present, click to render), waiting (user hasn't
  uploaded references yet, show link to /profile/me-images), and
  loading (request in flight).
-->
<script lang="ts">
	import { Sparkle, UserCircle, Info } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { ingestMeImageFile } from '$lib/modules/profile/api/me-images';
	import { isAccessoryOnlyOutfit, runOutfitTryOn } from '../api/try-on';
	import { CATEGORY_LABELS_SINGULAR } from '../constants';
	import type { Garment, Outfit } from '../types';

	interface Props {
		outfit: Outfit;
		garments: Garment[]; // the resolved LocalWardrobeGarment rows for this outfit
	}

	let { outfit, garments }: Props = $props();

	const face$ = useImageByPrimary('face-ref');
	const body$ = useImageByPrimary('body-ref');
	const activeSpace = $derived(getActiveSpace());

	const face = $derived(face$.value);
	const body = $derived(body$.value);
	const accessoryOnly = $derived(isAccessoryOnlyOutfit(garments));

	// Face is always required. Body only matters for non-accessory outfits.
	const missingFace = $derived(!face);
	const missingBody = $derived(!accessoryOnly && !body);
	const canTryOn = $derived(!missingFace && !missingBody && garments.length > 0);

	let running = $state(false);
	let error = $state<string | null>(null);

	// Inline ref-upload state. Deliberately local — the missing-ref
	// experience lives right here instead of deep-linking to /profile/
	// me-images, because leaving the outfit detail to upload a face photo
	// and coming back is jarring (especially inside the workbench card).
	let uploadingRef = $state(false);
	let uploadRefError = $state<string | null>(null);

	// Rough credit estimate — mirrors the server tariff from the M3 plan
	// (3 low / 10 medium / 25 high; we default to medium). Shown on the
	// button so the user knows the hit before clicking.
	const estimatedCredits = 10;

	async function handleClick() {
		if (!face || (!accessoryOnly && !body)) return;
		running = true;
		error = null;
		try {
			await runOutfitTryOn({
				outfit,
				garments,
				faceRefMediaId: face.mediaId,
				bodyRefMediaId: accessoryOnly ? null : (body?.mediaId ?? null),
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Try-On fehlgeschlagen';
		} finally {
			running = false;
		}
	}

	async function handleRefUpload(
		files: File[],
		kind: 'face' | 'fullbody',
		slot: 'face-ref' | 'body-ref'
	) {
		if (files.length === 0) return;
		uploadingRef = true;
		uploadRefError = null;
		try {
			// Only take the first file — these slots are single-image.
			await ingestMeImageFile(files[0], { kind, claimSlot: slot });
			// face$ / body$ live-queries re-run automatically, so the
			// missing-block disappears and the button becomes active.
		} catch (err) {
			uploadRefError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploadingRef = false;
		}
	}
</script>

{#if missingFace || missingBody}
	<div class="space-y-3 rounded-xl border border-dashed border-border bg-background/50 p-4">
		<div class="flex items-start gap-3 text-sm">
			<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0 text-primary" />
			<div class="space-y-1">
				<p class="font-medium text-foreground">Für Try-On brauchen wir dich auf Bild.</p>
				<p class="text-xs text-muted-foreground">
					{accessoryOnly
						? 'Ein Gesichtsbild reicht — der Rest bleibt wie auf deinem Foto.'
						: 'Ein Gesichts- und ein Ganzkörperbild. Beide werden nur für deine eigenen Generierungen genutzt.'}
				</p>
			</div>
		</div>

		{#if missingFace}
			<MeImageUploadZone
				variant="compact"
				label="Gesichtsbild hochladen"
				hint="Kopf + Schulter, möglichst neutrale Beleuchtung"
				disabled={uploadingRef}
				onFiles={(files) => handleRefUpload(files, 'face', 'face-ref')}
			/>
		{/if}
		{#if missingBody}
			<MeImageUploadZone
				variant="compact"
				label="Ganzkörperbild hochladen"
				hint="Stehend, freier Hintergrund, gut erkennbare Haltung"
				disabled={uploadingRef}
				onFiles={(files) => handleRefUpload(files, 'fullbody', 'body-ref')}
			/>
		{/if}

		{#if uploadRefError}
			<div
				class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
				role="alert"
			>
				{uploadRefError}
			</div>
		{/if}

		<p class="text-xs text-muted-foreground">
			Weitere Referenzen oder AI-Opt-ins pro Bild:
			<a href="/profile/me-images" class="font-medium text-primary hover:underline">
				Meine Bilder
			</a>.
		</p>
	</div>
{:else}
	<div class="space-y-2">
		<button
			type="button"
			onclick={handleClick}
			disabled={running || !canTryOn}
			class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if running}
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
				></div>
				Rendere…
			{:else}
				<Sparkle size={16} weight="fill" />
				Anprobieren · {estimatedCredits} Credits
			{/if}
		</button>

		{#if accessoryOnly}
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="flex-shrink-0" />
				Accessoire-Modus — nur das Gesicht wird gerendert (spart Credits).
			</p>
		{:else if garments.length > 6}
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="flex-shrink-0" />
				Mit {garments.length} Kleidungsstücken ist der Referenz-Slot knapp — ältere Items werden evtl.
				nicht mitgezogen.
			</p>
		{/if}

		{#if activeSpace && activeSpace.type !== 'personal'}
			<p class="flex items-start gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="mt-0.5 flex-shrink-0" />
				<span>
					Try-On nutzt deine Referenzbilder aus diesem Space
					<strong class="text-foreground">({activeSpace.name})</strong>, nicht aus Persönlich.
					{#if activeSpace.type === 'family'}
						Kinder-Outfits werden trotzdem auf dein Gesicht gerendert.
					{/if}
				</span>
			</p>
		{/if}

		{#if error}
			<div
				class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
				role="alert"
			>
				{error}
			</div>
		{/if}
	</div>
{/if}

{#if !missingFace && !missingBody && garments.length === 0}
	<p class="text-xs text-muted-foreground">
		Füge mindestens ein {CATEGORY_LABELS_SINGULAR.top ?? 'Kleidungsstück'} hinzu, um Try-On zu aktivieren.
	</p>
{/if}
