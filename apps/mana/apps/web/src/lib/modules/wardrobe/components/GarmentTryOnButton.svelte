<!--
  Single-garment try-on action for the garment detail page. Thinner
  sibling of TryOnButton — no outfit context, no occasion hint. Still
  handles the three states (ready / missing refs / loading) and
  disclaimer in non-personal spaces.

  Plan follow-up: docs/plans/wardrobe-module.md M4 called out solo-
  garment try-on ("mit impliziten 'Solo-Outfit'"); the runGarmentTryOn
  helper writes a picture.images row WITHOUT a wardrobeOutfitId, so
  the result lives in the Picture gallery but doesn't pollute any
  outfit's try-on history.
-->
<script lang="ts">
	import { Sparkle, UserCircle, Info } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import MeImageUploadZone from '$lib/modules/profile/components/MeImageUploadZone.svelte';
	import { ingestMeImageFile } from '$lib/modules/profile/api/me-images';
	import {
		DEFAULT_TRY_ON_MODEL,
		isAccessoryGarment,
		runGarmentTryOn,
		type TryOnModel,
	} from '../api/try-on';
	import TryOnModelPicker from './TryOnModelPicker.svelte';
	import type { Garment } from '../types';

	interface Props {
		garment: Garment;
	}

	let { garment }: Props = $props();

	const face$ = useImageByPrimary('face-ref');
	const body$ = useImageByPrimary('body-ref');
	const activeSpace = $derived(getActiveSpace());

	const face = $derived(face$.value);
	const body = $derived(body$.value);
	const accessoryOnly = $derived(isAccessoryGarment(garment));

	const missingFace = $derived(!face);
	const missingBody = $derived(!accessoryOnly && !body);
	const hasPhoto = $derived((garment.mediaIds?.length ?? 0) > 0);
	const canTryOn = $derived(!missingFace && !missingBody && hasPhoto);

	let running = $state(false);
	let error = $state<string | null>(null);
	let lastResultUrl = $state<string | null>(null);

	let uploadingRef = $state(false);
	let uploadRefError = $state<string | null>(null);

	let selectedModel = $state<TryOnModel>(DEFAULT_TRY_ON_MODEL);

	// Credit estimate per model — mirror of server-side `creditsFor`.
	// Keep in sync with apps/api/src/modules/picture/routes.ts. OpenAI
	// default 'medium' = 10 cr; Gemini Pro = 18, Gemini Flash 3.1 = 6.
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
		lastResultUrl = null;
		try {
			const result = await runGarmentTryOn({
				garment,
				faceRefMediaId: face.mediaId,
				bodyRefMediaId: accessoryOnly ? null : (body?.mediaId ?? null),
				model: selectedModel,
			});
			lastResultUrl = result.imageUrl;
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
			await ingestMeImageFile(files[0], { kind, claimSlot: slot });
		} catch (err) {
			uploadRefError = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
		} finally {
			uploadingRef = false;
		}
	}
</script>

{#if !hasPhoto}
	<p class="text-xs text-muted-foreground">
		Lade erst ein Foto hoch, um dieses Stück an dir zu visualisieren.
	</p>
{:else if missingFace || missingBody}
	<div class="space-y-3 rounded-xl border border-dashed border-border bg-background/50 p-4">
		<div class="flex items-start gap-3 text-sm">
			<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0 text-primary" />
			<div class="space-y-1">
				<p class="font-medium text-foreground">Für Solo-Try-On brauchen wir dich auf Bild.</p>
				<p class="text-xs text-muted-foreground">
					{accessoryOnly
						? 'Ein Gesichtsbild reicht — das Stück wird darauf montiert.'
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
				An mir anprobieren · {estimatedCredits} Credits
			{/if}
		</button>

		{#if accessoryOnly}
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="flex-shrink-0" />
				Accessoire-Modus — nur das Gesicht wird gerendert (spart Credits).
			</p>
		{/if}

		{#if activeSpace && activeSpace.type !== 'personal'}
			<p class="flex items-start gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="mt-0.5 flex-shrink-0" />
				<span>
					Try-On nutzt deine Referenzbilder aus diesem Space
					<strong class="text-foreground">({activeSpace.name})</strong>, nicht aus Persönlich.
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

		{#if lastResultUrl}
			<div class="space-y-1.5 rounded-xl border border-border bg-card p-3">
				<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ergebnis</p>
				<img
					src={lastResultUrl}
					alt="Try-On"
					class="w-full rounded-md border border-border bg-muted"
				/>
				<p class="text-xs text-muted-foreground">
					Gefunden in der
					<a href="/picture" class="font-medium text-primary hover:underline">Picture-Galerie</a>
					als normale Generierung.
				</p>
			</div>
		{/if}
	</div>
{/if}
