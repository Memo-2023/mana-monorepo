<!--
  Comic-Characters list view — grid of all characters in the active
  space, with a "+ Neuer Character" CTA. Mirrors the StoryView layout
  for visual consistency between the two tabs.
-->
<script lang="ts">
	import { Plus, UserCircle } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import { useAllCharacters } from '../queries';
	import CharacterCard from '../components/CharacterCard.svelte';

	const characters$ = useAllCharacters();
	const characters = $derived(characters$.value ?? []);

	const activeSpace = $derived(getActiveSpace());
	const face$ = useImageByPrimary('face-ref');
	const hasFace = $derived(Boolean(face$.value?.mediaId));
</script>

<div class="space-y-4">
	<header class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Deine Comic-Characters</h2>
			<p class="text-xs text-muted-foreground">
				{characters.length}
				{characters.length === 1 ? 'Character' : 'Characters'} in
				<strong class="text-foreground">{activeSpace?.name ?? 'diesem Space'}</strong>
			</p>
		</div>
		<a
			href="/comic/character/new"
			class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
		>
			<Plus size={12} />
			Neuer Character
		</a>
	</header>

	{#if !hasFace && !face$.loading}
		<div class="rounded-xl border border-dashed border-border bg-background/50 p-4">
			<div class="flex items-start gap-3 text-sm">
				<UserCircle size={18} class="mt-0.5 flex-shrink-0 text-primary" />
				<div class="space-y-1">
					<p class="font-medium text-foreground">Lade erst dein Gesichtsbild hoch</p>
					<p class="text-xs text-muted-foreground">
						Charakter-Generierung braucht ein Face-Bild als Source. Hochladen in
						<a href="/profile/me-images" class="text-primary hover:underline">Profil → Bilder</a>.
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if characters.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each characters as character (character.id)}
				<CharacterCard {character} />
			{/each}
		</div>
	{:else if !characters$.loading}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
			<p class="text-sm font-medium text-foreground">Noch keine Characters.</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Bau deinen ersten Comic-Character aus deinem Foto — Stil wählen, 4 Varianten generieren,
				beste pinnen, fertig.
			</p>
			<a
				href="/comic/character/new"
				class="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				<Plus size={14} />
				Ersten Character bauen
			</a>
		</div>
	{/if}
</div>
