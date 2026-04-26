<!--
  CharacterBuilder — Source picken, Stil picken, Add-Prompt, dann
  4 Varianten in einem Batch generieren. Im Detail-View des
  Characters wird derselbe Builder als „Mehr Varianten generieren"
  wieder benutzt (mit pre-selected Source + Style aus dem Character).

  Two modes:
  - "create" — Builder erstellt erst die Character-Row (Name +
    Stil + Source + AddPrompt), dann den ersten Variant-Batch.
  - "extend" — Character existiert schon; Builder feuert nur
    weitere Variants und schreibt sie in den existierenden
    Character.

  Variant-Generierung läuft synchron als ein Server-Call mit
  n=4 (gpt-image-2-Server-Cap). User wartet ~30-60s auf alle 4
  Bilder gleichzeitig.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Sparkle, SpinnerGap, X } from '@mana/shared-icons';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import { comicCharactersStore } from '../stores/characters.svelte';
	import { runCharacterGenerate } from '../api/generate-character';
	import { DEFAULT_PANEL_MODEL, type PanelModel } from '../api/generate-panel';
	import type { ComicCharacter, ComicStyle } from '../types';
	import StylePicker from './StylePicker.svelte';
	import PanelModelPicker from './PanelModelPicker.svelte';

	interface Props {
		/** When set, builder runs in "extend" mode for an existing
		 *  character — name+style+source are locked, only Add-Prompt
		 *  is editable per generation. */
		existing?: ComicCharacter;
		/** Optional pre-fills for create-mode — used by the wardrobe-
		 *  hook (Mc5) to seed an addPrompt like "wearing the
		 *  Bühnenoutfit" when the user clicks "Als Comic-Character"
		 *  on a Wardrobe-Outfit. Ignored in extend-mode. */
		initialName?: string;
		initialAddPrompt?: string;
		initialStyle?: ComicStyle;
		/** Called after the first successful variant batch with the
		 *  resulting character id, so the parent route can navigate. */
		onCreated?: (characterId: string) => void;
		onClose?: () => void;
	}

	let { existing, initialName, initialAddPrompt, initialStyle, onClose, onCreated }: Props =
		$props();

	const isExtend = $derived(Boolean(existing));

	// Builder state. In extend-mode all of these come from `existing`
	// at mount time and aren't editable; in create-mode the user fills
	// them in (with optional pre-fills from URL-params via the route
	// page wrapper). Init-time read is intentional — the
	// character is always remounted via {#key} when the route id
	// changes, so capturing the snapshot here is correct.
	// svelte-ignore state_referenced_locally
	let name = $state(existing?.name ?? initialName ?? '');
	// svelte-ignore state_referenced_locally
	let style = $state<ComicStyle>(existing?.style ?? initialStyle ?? 'comic');
	// svelte-ignore state_referenced_locally
	let addPrompt = $state(existing?.addPrompt ?? initialAddPrompt ?? '');

	type Quality = 'low' | 'medium' | 'high';
	const QUALITIES: readonly Quality[] = ['low', 'medium', 'high'] as const;
	const CREDIT_COST: Record<Quality, number> = { low: 3, medium: 10, high: 25 };
	let quality = $state<Quality>('medium');
	let model = $state<PanelModel>(DEFAULT_PANEL_MODEL);

	const face$ = useImageByPrimary('face-ref');
	const body$ = useImageByPrimary('body-ref');
	const face = $derived(face$.value);
	const body = $derived(body$.value);

	const hasFace = $derived(Boolean(existing?.sourceFaceMediaId || face?.mediaId));
	const sourceFaceMediaId = $derived(existing?.sourceFaceMediaId ?? face?.mediaId ?? null);
	const sourceBodyMediaId = $derived(existing?.sourceBodyMediaId ?? body?.mediaId ?? null);

	let useBodyRef = $state(true); // toggle in create-mode

	let busy = $state(false);
	let errorMsg = $state<string | null>(null);

	const VARIANT_COUNT = 4;
	const totalCost = $derived(CREDIT_COST[quality] * VARIANT_COUNT);

	const canSubmit = $derived(
		!busy && hasFace && (isExtend || name.trim().length > 0) // create-mode requires a name
	);

	async function handleGenerate(event: SubmitEvent) {
		event.preventDefault();
		if (!canSubmit || !sourceFaceMediaId) return;
		busy = true;
		errorMsg = null;
		try {
			let character: ComicCharacter;
			if (existing) {
				character = existing;
				// Optionally update addPrompt on the existing character
				// so future "Mehr Varianten"-Calls remember the latest.
				if (addPrompt.trim() !== (existing.addPrompt ?? '')) {
					await comicCharactersStore.updateCharacter(existing.id, {
						addPrompt: addPrompt.trim() || null,
					});
				}
			} else {
				character = await comicCharactersStore.createCharacter({
					name: name.trim(),
					style,
					sourceFaceMediaId,
					sourceBodyMediaId: useBodyRef ? sourceBodyMediaId : null,
					addPrompt: addPrompt.trim() || null,
				});
			}

			await runCharacterGenerate({
				character,
				count: VARIANT_COUNT,
				quality,
				model,
			});

			busy = false;
			onCreated?.(character.id);
			if (!isExtend) {
				await goto(`/comic/character/${character.id}`);
			}
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Variant-Generierung fehlgeschlagen';
			busy = false;
		}
	}
</script>

<div class="rounded-2xl border border-border bg-card p-4 sm:p-5">
	<header class="mb-3 flex items-start justify-between gap-3">
		<div>
			<h3 class="text-sm font-semibold text-foreground">
				{isExtend ? 'Mehr Varianten generieren' : 'Neuer Character'}
			</h3>
			<p class="text-xs text-muted-foreground">
				{isExtend
					? `Erweitert "${existing?.name}" um ${VARIANT_COUNT} weitere Varianten — gleicher Stil, gleiche Source.`
					: `Erstellt einen Character und rendert direkt ${VARIANT_COUNT} Varianten zur Auswahl.`}
			</p>
		</div>
		{#if onClose}
			<button
				type="button"
				onclick={onClose}
				class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Schließen"
			>
				<X size={14} />
			</button>
		{/if}
	</header>

	<form onsubmit={handleGenerate} class="space-y-4">
		{#if !isExtend}
			<!-- Name -->
			<div class="space-y-1.5">
				<label
					for="character-name"
					class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
				>
					Name
				</label>
				<input
					id="character-name"
					type="text"
					bind:value={name}
					placeholder="Manga-Me, Cartoon-Casual, Action-Pose-Me…"
					maxlength={120}
					autocomplete="off"
					class="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
					disabled={busy}
					required
				/>
			</div>

			<!-- Style picker -->
			<div class="space-y-2">
				<div class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					Stil
				</div>
				<StylePicker value={style} onChange={(next) => (style = next)} disabled={busy} />
			</div>
		{/if}

		<!-- Add-Prompt -->
		<div class="space-y-1.5">
			<label
				for="character-add-prompt"
				class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
			>
				Zusätzlicher Prompt
				<span class="font-normal normal-case text-muted-foreground">(optional)</span>
			</label>
			<input
				id="character-add-prompt"
				type="text"
				bind:value={addPrompt}
				placeholder="z.B. freundlicher Ausdruck, casual outfit, action pose"
				maxlength={200}
				class="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
				disabled={busy}
			/>
			<p class="text-[11px] text-muted-foreground">
				Englisch rendert stabiler. Wird auf alle {VARIANT_COUNT} Varianten in dieser Runde angewendet.
			</p>
		</div>

		{#if !hasFace}
			<div class="rounded-md border border-error/30 bg-error/5 p-3 text-xs text-error" role="alert">
				Kein Gesichtsbild im aktiven Space. Lade eines in
				<a href="/profile/me-images" class="underline hover:no-underline">Profil → Bilder</a>
				hoch — ohne Face-Ref kann kein Character generiert werden.
			</div>
		{:else if !isExtend}
			<!-- Source preview + body toggle -->
			<div class="space-y-2">
				<div class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					Quelle
				</div>
				<div class="flex flex-wrap items-start gap-2">
					{#if face?.publicUrl}
						<div class="flex flex-col items-center gap-1">
							<div class="h-20 w-20 overflow-hidden rounded-md border-2 border-primary/40">
								<img
									src={face.thumbnailUrl ?? face.publicUrl}
									alt="Face-Ref"
									class="h-full w-full object-cover"
								/>
							</div>
							<span class="text-[10px] font-medium text-muted-foreground">Face</span>
						</div>
					{/if}
					{#if body?.publicUrl}
						<div class="flex flex-col items-center gap-1">
							<button
								type="button"
								onclick={() => (useBodyRef = !useBodyRef)}
								disabled={busy}
								class="group relative h-20 w-20 overflow-hidden rounded-md border-2 transition-all
									{useBodyRef
									? 'border-primary shadow-sm shadow-primary/20'
									: 'border-border opacity-60 hover:border-primary/50 hover:opacity-100'}"
								aria-pressed={useBodyRef}
								title={useBodyRef ? 'Body-Ref entfernen' : 'Body-Ref hinzufügen'}
							>
								<img
									src={body.thumbnailUrl ?? body.publicUrl}
									alt="Body-Ref"
									class="h-full w-full object-cover"
								/>
							</button>
							<span class="text-[10px] font-medium text-muted-foreground">Body</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<PanelModelPicker value={model} onChange={(m) => (model = m)} disabled={busy} />

		<div class="flex items-center gap-1.5">
			<span class="text-[11px] font-medium text-muted-foreground">Qualität:</span>
			{#each QUALITIES as q (q)}
				<button
					type="button"
					onclick={() => (quality = q)}
					class="rounded-md border px-2 py-0.5 text-[11px] transition-colors
						{quality === q
						? 'border-primary bg-primary/10 text-foreground'
						: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
					disabled={busy}
					aria-pressed={quality === q}
				>
					{q} ({CREDIT_COST[q]}c)
				</button>
			{/each}
		</div>

		{#if errorMsg}
			<div
				class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
				role="alert"
			>
				{errorMsg}
			</div>
		{/if}

		<div class="flex items-center gap-2">
			<button
				type="submit"
				disabled={!canSubmit}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if busy}
					<SpinnerGap size={14} class="spinner" weight="bold" />
					{VARIANT_COUNT} Varianten werden gerendert…
				{:else}
					<Sparkle size={14} />
					{VARIANT_COUNT} Varianten generieren ({totalCost}c)
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	:global(.spinner) {
		animation: char-spin 0.9s linear infinite;
	}
	@keyframes char-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
