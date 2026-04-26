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
	import { _ } from 'svelte-i18n';
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
			error = err instanceof Error ? err.message : $_('wardrobe.try_on_garment.err_failed');
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
			uploadRefError =
				err instanceof Error ? err.message : $_('wardrobe.try_on_garment.err_upload');
		} finally {
			uploadingRef = false;
		}
	}
</script>

{#if !hasPhoto}
	<p class="text-xs text-muted-foreground">
		{$_('wardrobe.try_on_garment.no_photo')}
	</p>
{:else if missingFace || missingBody}
	<div class="space-y-3 rounded-xl border border-dashed border-border bg-background/50 p-4">
		<div class="flex items-start gap-3 text-sm">
			<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0 text-primary" />
			<div class="space-y-1">
				<p class="font-medium text-foreground">{$_('wardrobe.try_on_garment.refs_title')}</p>
				<p class="text-xs text-muted-foreground">
					{accessoryOnly
						? $_('wardrobe.try_on_garment.refs_accessory')
						: $_('wardrobe.try_on_garment.refs_full')}
				</p>
			</div>
		</div>

		{#if missingFace}
			<MeImageUploadZone
				variant="compact"
				label={$_('wardrobe.try_on_garment.upload_face')}
				hint={$_('wardrobe.try_on_garment.face_hint')}
				disabled={uploadingRef}
				onFiles={(files) => handleRefUpload(files, 'face', 'face-ref')}
			/>
		{/if}
		{#if missingBody}
			<MeImageUploadZone
				variant="compact"
				label={$_('wardrobe.try_on_garment.upload_body')}
				hint={$_('wardrobe.try_on_garment.body_hint')}
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
			{$_('wardrobe.try_on_garment.refs_more_prefix')}
			<a href="/profile/me-images" class="font-medium text-primary hover:underline">
				{$_('wardrobe.try_on_garment.refs_link')}
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

		<!-- Primary CTA: the biggest, loudest element on the page.
		     Rests with a visible ring + shadow so the user instantly
		     sees "this is THE action" without hovering. Hover lifts
		     the button by 1px and strengthens the ring; active-press
		     sinks back to 0 for a tactile feel. Shadow uses neutral
		     black (works across light + dark + tinted themes), ring
		     uses the primary color at 40 % for visible glow even on
		     a dark card background. -->
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
					{$_('wardrobe.try_on_garment.rendering')}
				</span>
			{:else}
				<span class="flex items-center gap-2.5">
					<Sparkle size={20} weight="fill" />
					{$_('wardrobe.try_on_garment.cta')}
				</span>
				<span class="text-xs font-normal opacity-80"
					>{$_('wardrobe.try_on_garment.credits', { values: { count: estimatedCredits } })}</span
				>
			{/if}
		</button>

		{#if accessoryOnly}
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="flex-shrink-0" />
				{$_('wardrobe.try_on_garment.accessory_hint')}
			</p>
		{/if}

		{#if activeSpace && activeSpace.type !== 'personal'}
			<p class="flex items-start gap-1.5 text-xs text-muted-foreground">
				<Info size={12} weight="regular" class="mt-0.5 flex-shrink-0" />
				<span>
					{$_('wardrobe.try_on_garment.space_hint_prefix')}
					<strong class="text-foreground">({activeSpace.name})</strong>{$_(
						'wardrobe.try_on_garment.space_hint_suffix'
					)}
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
				<p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
					{$_('wardrobe.try_on_garment.result_label')}
				</p>
				<img
					src={lastResultUrl}
					alt={$_('wardrobe.try_on_garment.try_on_alt')}
					class="w-full rounded-md border border-border bg-muted"
				/>
				<p class="text-xs text-muted-foreground">
					{$_('wardrobe.try_on_garment.result_hint_prefix')}
					<a href="/picture" class="font-medium text-primary hover:underline"
						>{$_('wardrobe.try_on_garment.picture_gallery_link')}</a
					>
					{$_('wardrobe.try_on_garment.result_hint_suffix')}
				</p>
			</div>
		{/if}
	</div>
{/if}
