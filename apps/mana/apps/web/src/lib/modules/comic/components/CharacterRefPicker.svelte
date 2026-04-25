<!--
  CharacterRefPicker — Mc3-Replacement für CharacterPicker beim
  Story-Create.

  Two modes:
    1. **character-mode** (default wenn Characters existieren):
       Grid existierender Comic-Characters (filterbar nach Stil).
       Pick → die pinnedVariantMediaId ist die einzige
       Story-Character-Ref. "+ Neuer Character" navigiert mit
       Return-URL zur Builder-Route.
    2. **quick-mode** (Toggle, oder default wenn keine Characters):
       Fällt zurück auf das alte Pattern: face-ref + body-ref +
       optional Wardrobe-Garments. Für "mal eben schnell aus dem
       Tagebuch ohne Setup".

  Output ist die gleiche `mediaIds: string[]`-Form wie der alte
  CharacterPicker — der Story-Store bekommt am Ende die gleiche
  Struktur und runPanelGenerate kennt seinen Pfad nicht mal. Die
  Story bekommt zusätzlich `characterId` (für Display + Click-
  Through) wenn character-mode genutzt wurde.
-->
<script lang="ts">
	import { Plus, UserCircle, Sparkle, Wrench } from '@mana/shared-icons';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import { useAllCharacters } from '../queries';
	import { STYLE_LABELS } from '../constants';
	import { usePanelImage } from '../queries';
	import CharacterPicker from './CharacterPicker.svelte';
	import type { ComicCharacter } from '../types';

	interface Props {
		/** Selected character (in character-mode) — null in quick-mode. */
		selectedCharacterId: string | null;
		/** mediaIds the renderer will use as references. In character-
		 *  mode this is `[pinnedVariantMediaId]`. In quick-mode it's
		 *  the old face/body/garment list. */
		referenceMediaIds: string[];
		onChange: (next: { characterId: string | null; referenceMediaIds: string[] }) => void;
		disabled?: boolean;
	}

	let { selectedCharacterId, referenceMediaIds, onChange, disabled = false }: Props = $props();

	const characters$ = useAllCharacters();
	const characters = $derived(characters$.value ?? []);

	// Filter out archived/in-progress (no pinned variant) characters —
	// can't render a story without a pinnedVariantMediaId.
	const usableCharacters = $derived(characters.filter((c) => !c.isArchived && c.pinnedVariantId));

	const face$ = useImageByPrimary('face-ref');
	const hasFace = $derived(Boolean(face$.value?.mediaId));

	type Mode = 'character' | 'quick';
	// Default: character mode if there's at least one usable character,
	// else quick mode (so first-time users aren't gated on Character-Setup).
	// Init-time read of `usableCharacters` is intentional — we want to
	// pick a sensible default once and let the user toggle afterwards.
	// svelte-ignore state_referenced_locally
	let mode = $state<Mode>(usableCharacters.length > 0 ? 'character' : 'quick');

	// If user came in with no selection but there ARE characters, auto-flip
	// to character-mode after first liveQuery hit.
	let initialModeSet = false;
	$effect(() => {
		if (!initialModeSet && characters$.value !== null) {
			initialModeSet = true;
			if (usableCharacters.length === 0 && mode === 'character') {
				mode = 'quick';
			}
		}
	});

	function pickCharacter(c: ComicCharacter) {
		if (!c.pinnedVariantId) return;
		onChange({
			characterId: c.id,
			referenceMediaIds: [c.pinnedVariantId],
		});
	}

	function handleQuickModeChange(next: string[]) {
		onChange({ characterId: null, referenceMediaIds: next });
	}
</script>

<div class="space-y-3">
	<!-- Mode toggle (only when both modes are available) -->
	{#if usableCharacters.length > 0}
		<div class="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors
					{mode === 'character'
					? 'bg-primary/10 text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (mode = 'character')}
				{disabled}
				aria-pressed={mode === 'character'}
			>
				<Sparkle size={12} />
				Character
			</button>
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors
					{mode === 'quick'
					? 'bg-primary/10 text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				onclick={() => (mode = 'quick')}
				{disabled}
				aria-pressed={mode === 'quick'}
			>
				<Wrench size={12} />
				Quick (Roh-Modus)
			</button>
		</div>
	{/if}

	{#if mode === 'character'}
		<div class="space-y-2">
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Comic-Character wählen
				</h3>
				<p class="mt-0.5 text-xs text-muted-foreground">
					Iterier vorher einen Character mit deinem Stil — alle Panels nutzen dann denselben
					gepinnten Look.
				</p>
			</div>

			{#if usableCharacters.length === 0}
				{#if !hasFace}
					<div
						class="rounded-md border border-error/30 bg-error/5 p-3 text-xs text-error"
						role="alert"
					>
						<div class="flex items-start gap-2">
							<UserCircle size={14} class="mt-0.5 flex-shrink-0" />
							<div>
								Kein Face-Ref im aktiven Space. Lade eines in
								<a href="/profile/me-images" class="underline hover:no-underline">Profil → Bilder</a
								>
								hoch — ohne Face-Ref kann kein Character gebaut werden.
							</div>
						</div>
					</div>
				{:else}
					<div
						class="rounded-xl border border-dashed border-border bg-background/50 p-4 text-center text-xs text-muted-foreground"
					>
						<p class="mb-2 font-medium text-foreground">Noch keine Characters mit Pin.</p>
						<p>
							Bau einen Comic-Character aus deinem Foto — Stil wählen, 4 Varianten generieren, beste
							pinnen.
						</p>
						<a
							href="/comic/character/new"
							class="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<Plus size={12} />
							Character bauen
						</a>
					</div>
				{/if}
			{:else}
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
					{#each usableCharacters as character (character.id)}
						{@const isSelected = selectedCharacterId === character.id}
						{@const cover$ = usePanelImage(character.pinnedVariantId ?? null)}
						{@const cover = cover$.value}
						<button
							type="button"
							{disabled}
							onclick={() => pickCharacter(character)}
							class="group flex flex-col overflow-hidden rounded-lg border-2 transition-all active:translate-y-px
								{isSelected
								? 'border-primary shadow-md shadow-primary/20'
								: 'border-border hover:border-primary/40 hover:shadow-sm'}"
							aria-pressed={isSelected}
						>
							<div class="relative aspect-square overflow-hidden bg-muted">
								{#if cover?.publicUrl}
									<img
										src={cover.publicUrl}
										alt={character.name}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div
										class="flex h-full w-full items-center justify-center text-xs text-muted-foreground"
									>
										<Sparkle size={20} />
									</div>
								{/if}
								<span
									class="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-medium text-foreground shadow-sm backdrop-blur"
								>
									{STYLE_LABELS[character.style].de}
								</span>
							</div>
							<div class="px-2 py-1.5 text-left">
								<p class="truncate text-xs font-medium text-foreground">{character.name}</p>
							</div>
						</button>
					{/each}

					<a
						href="/comic/character/new"
						class="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground hover:shadow-sm"
					>
						<Plus size={20} />
						<span class="text-[11px] font-medium">Neuer Character</span>
					</a>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Quick-Modus: das alte Face-/Body-/Garment-Picker-Pattern -->
		<div class="space-y-2">
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Quick-Modus (Roh-Refs)
				</h3>
				<p class="mt-0.5 text-xs text-muted-foreground">
					Direkt face-ref + optional body-ref + Garments aus dem Schrank — ohne Character-Iteration.
					Konsistenz zwischen Panels schwächer.
				</p>
			</div>
			<CharacterPicker value={referenceMediaIds} onChange={handleQuickModeChange} {disabled} />
		</div>
	{/if}
</div>
