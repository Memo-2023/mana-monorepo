<!--
  Comic-Character detail — Meta-Card (name + style + favorite +
  archive/delete) + Variant-Grid mit Pin/Remove + "Mehr Varianten
  generieren"-Button (öffnet inline den Builder im extend-mode).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Archive, Heart, Plus, Sparkle, Trash } from '@mana/shared-icons';
	import { comicCharactersStore } from '../stores/characters.svelte';
	import { useCharacter } from '../queries';
	import { STYLE_LABELS } from '../constants';
	import VariantTile from '../components/VariantTile.svelte';
	import CharacterBuilder from '../components/CharacterBuilder.svelte';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	// svelte-ignore state_referenced_locally
	const character$ = useCharacter(id);
	const character = $derived(character$.value);

	let showBuilder = $state(false);

	async function handleToggleFavorite() {
		if (!character) return;
		await comicCharactersStore.toggleFavorite(character.id);
	}

	async function handleArchive() {
		if (!character) return;
		await comicCharactersStore.archiveCharacter(character.id, !character.isArchived);
	}

	async function handleDelete() {
		if (!character) return;
		if (!confirm(`Character "${character.name}" wirklich löschen?`)) return;
		await comicCharactersStore.deleteCharacter(character.id);
		await goto('/comic/character');
	}

	async function handlePin(variantId: string) {
		if (!character) return;
		await comicCharactersStore.pinVariant(character.id, variantId);
	}

	async function handleRemove(variantId: string) {
		if (!character) return;
		if (
			!confirm(
				'Variante aus dem Character entfernen? Das Bild bleibt in deiner Picture-Galerie und kann dort gelöscht werden.'
			)
		)
			return;
		await comicCharactersStore.removeVariant(character.id, variantId);
	}
</script>

<div class="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
	<nav class="flex items-center gap-2 text-sm">
		<a
			href="/comic/character"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			aria-label="Zurück zu Characters"
		>
			<ArrowLeft size={16} />
		</a>
		<span class="text-muted-foreground">Comic · Characters</span>
	</nav>

	{#if !character}
		{#if character$.loading}
			<p class="text-sm text-muted-foreground">Lädt…</p>
		{:else}
			<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
				<p class="text-sm font-medium text-foreground">Character nicht gefunden.</p>
				<p class="mt-1 text-sm text-muted-foreground">Gelöscht oder in einem anderen Space.</p>
			</div>
		{/if}
	{:else}
		<!-- Meta -->
		<div class="space-y-3 rounded-2xl border border-border bg-card p-5">
			<header class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<h1 class="truncate text-lg font-semibold text-foreground">{character.name}</h1>
					<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span class="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
							{STYLE_LABELS[character.style].de}
						</span>
						<span>
							{character.variantMediaIds.length}
							{character.variantMediaIds.length === 1 ? 'Variante' : 'Varianten'}
						</span>
						{#if !character.pinnedVariantId && character.variantMediaIds.length > 0}
							<span class="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700"
								>Pin offen</span
							>
						{/if}
					</div>
				</div>
				<button
					type="button"
					onclick={handleToggleFavorite}
					aria-label={character.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
					title={character.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
					class="flex h-8 w-8 items-center justify-center rounded-md transition-colors {character.isFavorite
						? 'text-rose-500 hover:bg-rose-500/10'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<Heart size={16} weight={character.isFavorite ? 'fill' : 'regular'} />
				</button>
			</header>

			{#if character.description}
				<p class="whitespace-pre-wrap text-sm text-foreground">{character.description}</p>
			{/if}

			{#if character.addPrompt}
				<div class="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
					<strong class="text-foreground">Prompt-Add:</strong>
					{character.addPrompt}
				</div>
			{/if}
		</div>

		<!-- Variants -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					Varianten
				</h2>
				{#if !showBuilder && !character.isArchived}
					<button
						type="button"
						onclick={() => (showBuilder = true)}
						class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<Plus size={12} />
						Mehr Varianten
					</button>
				{/if}
			</div>

			{#if character.variantMediaIds.length === 0}
				<div
					class="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center"
				>
					<p class="text-sm font-medium text-foreground">Noch keine Varianten.</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Klick oben rechts auf <strong class="text-foreground">+ Mehr Varianten</strong>, um die
						ersten 4 zu generieren.
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{#each character.variantMediaIds as variantId, index (variantId)}
						<VariantTile
							{variantId}
							variantIndex={index}
							isPinned={character.pinnedVariantId === variantId}
							onPin={() => handlePin(variantId)}
							onRemove={character.variantMediaIds.length > 1
								? () => handleRemove(variantId)
								: undefined}
						/>
					{/each}
				</div>
			{/if}

			{#if showBuilder && !character.isArchived}
				<CharacterBuilder
					existing={character}
					onClose={() => (showBuilder = false)}
					onCreated={() => {
						// Keep the builder open so the user can iterate without
						// having to re-open. New variants append + appear in
						// the grid above via the liveQuery.
					}}
				/>
			{/if}
		</div>

		<!-- Secondary actions -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={handleArchive}
				class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
			>
				<Archive size={14} />
				{character.isArchived ? 'Wieder aktiv' : 'Archivieren'}
			</button>
			<button
				type="button"
				onclick={handleDelete}
				class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-error transition-colors hover:bg-error/10"
			>
				<Trash size={14} />
				Löschen
			</button>
		</div>

		{#if character.isArchived}
			<p
				class="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
			>
				<Sparkle size={12} class="inline" /> Archivierter Character — keine Variant-Generierung möglich,
				bis wieder aktiviert.
			</p>
		{/if}
	{/if}
</div>
