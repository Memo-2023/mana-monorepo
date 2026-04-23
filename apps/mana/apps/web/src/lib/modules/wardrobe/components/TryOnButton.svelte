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
</script>

{#if missingFace || missingBody}
	<div
		class="flex items-start gap-3 rounded-xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground"
	>
		<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0 text-primary" />
		<div class="space-y-1">
			<p class="text-foreground">Lade erst Referenzbilder hoch, um dich im Outfit zu sehen.</p>
			<p class="text-xs">
				Try-On braucht mindestens ein {accessoryOnly
					? 'Gesichtsbild'
					: 'Gesichts- und ein Ganzkörperbild'}
				in diesem Space. Öffne dafür
				<a href="/profile/me-images" class="font-medium text-primary hover:underline">
					Meine Bilder
				</a>.
			</p>
		</div>
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
