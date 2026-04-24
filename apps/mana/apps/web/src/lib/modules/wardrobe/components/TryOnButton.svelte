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
	import {
		DEFAULT_TRY_ON_MODEL,
		isAccessoryOnlyOutfit,
		runOutfitTryOn,
		type TryOnModel,
	} from '../api/try-on';
	import TryOnModelPicker from './TryOnModelPicker.svelte';
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

	let selectedModel = $state<TryOnModel>(DEFAULT_TRY_ON_MODEL);

	// Credit estimate mirrors the server-side `creditsFor` — keep in sync
	// with apps/api/src/modules/picture/routes.ts. OpenAI default medium
	// = 10 credits; Gemini Pro = 18, Gemini Flash 3.1 = 6.
	const estimatedCredits = $derived(
		selectedModel === 'openai/gpt-image-2'
			? 10
			: selectedModel === 'google/gemini-3-pro-image-preview'
				? 18
				: 6
	);

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
				model: selectedModel,
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
		<TryOnModelPicker
			value={selectedModel}
			onChange={(next) => (selectedModel = next)}
			disabled={running}
		/>

		<!-- Primary CTA — matches GarmentTryOnButton's lift + ring +
		     shadow treatment so both surfaces use the same visual
		     weight for "produce the generation". See that file for
		     the full rationale on ring / shadow / translate choices. -->
		<button
			type="button"
			onclick={handleClick}
			disabled={running || !canTryOn}
			class="flex w-full flex-col items-center justify-center gap-1 rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg ring-2 ring-primary/40 transition-all hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-xl hover:ring-4 hover:ring-primary/50 active:translate-y-0 active:shadow-md active:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg disabled:hover:ring-2"
		>
			{#if running}
				<span class="flex items-center gap-2.5">
					<span
						class="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent"
					></span>
					Rendere…
				</span>
			{:else}
				<span class="flex items-center gap-2.5">
					<Sparkle size={20} weight="fill" />
					Anprobieren
				</span>
				<span class="text-xs font-normal opacity-80">{estimatedCredits} Credits</span>
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
