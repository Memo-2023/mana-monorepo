<!--
  VariantTile — one variant of a Comic-Character with pin / remove
  controls. Used in the character-detail's variant grid.

  Two states matter: pinned (= the canonical look, gets a primary
  ring and a star) vs. unpinned (regular border, hover shows action
  icons). Removing a pinned variant cascades the pin to the first
  remaining variant (handled in `comicCharactersStore.removeVariant`).
-->
<script lang="ts">
	import { Star, Trash } from '@mana/shared-icons';
	import { usePanelImage } from '../queries';

	interface Props {
		variantId: string;
		variantIndex: number;
		isPinned: boolean;
		onPin: () => void;
		onRemove?: () => void;
	}

	let { variantId, variantIndex, isPinned, onPin, onRemove }: Props = $props();

	// svelte-ignore state_referenced_locally
	const image$ = usePanelImage(variantId);
	const image = $derived(image$.value);
</script>

<div
	class="group relative aspect-square overflow-hidden rounded-lg border-2 transition-all
		{isPinned ? 'border-primary shadow-md shadow-primary/20' : 'border-border hover:border-primary/40'}"
>
	{#if image?.publicUrl}
		<img
			src={image.publicUrl}
			alt="Variante {variantIndex + 1}"
			loading="lazy"
			class="h-full w-full object-cover"
		/>
	{:else if image$.loading}
		<div class="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
			Lädt…
		</div>
	{:else}
		<div class="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
			Variante nicht gefunden
		</div>
	{/if}

	<!-- Variant index in corner -->
	<span
		class="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur"
	>
		#{variantIndex + 1}
	</span>

	<!-- Pin star — always visible if pinned, otherwise on hover -->
	{#if isPinned}
		<span
			class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-background"
			aria-label="Gepinned"
			title="Diese Variante ist gepinned"
		>
			<Star size={14} weight="fill" />
		</span>
	{/if}

	<!-- Bottom action bar — appears on hover -->
	<div
		class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100"
	>
		{#if !isPinned}
			<button
				type="button"
				onclick={onPin}
				class="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
				title="Als kanonischen Look pinnen"
			>
				<Star size={10} weight="fill" />
				Pinnen
			</button>
		{:else}
			<span class="text-[11px] font-medium text-white drop-shadow">Aktiv</span>
		{/if}

		{#if onRemove}
			<button
				type="button"
				onclick={onRemove}
				class="flex h-7 w-7 items-center justify-center rounded-md bg-error/90 text-white shadow-sm transition-colors hover:bg-error"
				aria-label="Variante entfernen"
				title="Variante aus Character entfernen (Bild bleibt in Galerie)"
			>
				<Trash size={12} />
			</button>
		{/if}
	</div>
</div>
