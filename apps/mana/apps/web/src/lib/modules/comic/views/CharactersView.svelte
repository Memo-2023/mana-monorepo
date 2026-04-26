<!--
  Comic-Characters list view — grid of all characters in the active
  space, with a "+ Neuer Character" CTA. The face-ref upload banner
  lives one level up in the module-root ListView (above the tabs),
  so we don't repeat it here per tab.
-->
<script lang="ts">
	import { Plus } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { useAllCharacters } from '../queries';
	import CharacterCard from '../components/CharacterCard.svelte';

	const characters$ = useAllCharacters();
	const characters = $derived(characters$.value ?? []);

	const activeSpace = $derived(getActiveSpace());
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
