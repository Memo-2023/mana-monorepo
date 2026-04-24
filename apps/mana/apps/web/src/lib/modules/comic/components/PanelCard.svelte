<!--
  PanelCard — single rendered panel with its caption/dialogue sidecar.
  In M2 captions/dialogue are baked into the image by gpt-image-2, so
  the text under the image is redundant meta for the author's own
  reference (quick scan without opening the full image). It's still
  useful for accessibility and for regenerating / reviewing prompts.
-->
<script lang="ts">
	import { X } from '@mana/shared-icons';
	import { usePanelImage } from '../queries';
	import type { ComicPanelMeta } from '../types';

	interface Props {
		panelId: string;
		panelIndex: number;
		meta: ComicPanelMeta | undefined;
		/** Shows a small remove-from-story button. Wired by the DetailView. */
		onRemove?: () => void;
	}

	let { panelId, panelIndex, meta, onRemove }: Props = $props();

	// svelte-ignore state_referenced_locally
	const image$ = usePanelImage(panelId);
	const image = $derived(image$.value);
</script>

<div
	class="relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card"
>
	<div class="relative aspect-square bg-muted">
		{#if image?.publicUrl}
			<img
				src={image.publicUrl}
				alt="Panel {panelIndex + 1}"
				loading="lazy"
				class="h-full w-full object-cover"
			/>
		{:else if image$.loading}
			<div class="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
				Lädt…
			</div>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
				Panel nicht gefunden
			</div>
		{/if}

		<span
			class="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur"
		>
			#{panelIndex + 1}
		</span>

		{#if onRemove}
			<button
				type="button"
				onclick={onRemove}
				class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-error"
				aria-label="Panel aus Story entfernen"
				title="Panel aus Story entfernen (Bild bleibt in der Galerie)"
			>
				<X size={12} />
			</button>
		{/if}
	</div>

	{#if meta?.caption || meta?.dialogue}
		<div class="space-y-1 px-2.5 py-1.5 text-[11px] leading-snug">
			{#if meta.caption}
				<p class="text-muted-foreground"><em>{meta.caption}</em></p>
			{/if}
			{#if meta.dialogue}
				<p class="text-foreground">„{meta.dialogue}"</p>
			{/if}
		</div>
	{/if}
</div>
