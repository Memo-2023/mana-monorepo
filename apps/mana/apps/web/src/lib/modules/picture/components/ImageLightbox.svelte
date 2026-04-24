<!--
  Reusable full-screen image lightbox.

  Extracted from picture/ListView so other modules (wardrobe garment
  detail, outfit detail, any future "show me the full image"-surface)
  can render the same viewer without duplicating the markup. Picture
  keeps ownership because the component is typed against
  `picture.types.Image` and speaks prompt/model/dims vocabulary.

  The lightbox is dumb: it accepts an optional `image` and an
  `onClose` callback. Pass a non-null image to open, null/undefined
  to hide. Module-specific actions (Favorit-Toggle, Archiv, Download,
  "In Picture öffnen" …) go through the `actions` snippet so each
  caller wires only what makes sense there. A plain backdrop click
  and ESC both close the modal.
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { onMount, type Snippet } from 'svelte';
	import { SquaresFour } from '@mana/shared-icons';
	import type { Image } from '../types';

	interface Props {
		/** Non-null to render, null/undefined to hide. */
		image: Image | null | undefined;
		onClose: () => void;
		/** Caller-specific controls rendered to the left of "Schließen".
		 *  Picture gallery uses this for Favorit / Archiv; wardrobe uses
		 *  it for a deep-link to the Picture gallery. */
		actions?: Snippet;
	}

	let { image, onClose, actions }: Props = $props();

	// Escape-to-close. Rebind on mount only once — the handler itself
	// checks `image` at call time so we don't need to wire it to the
	// prop's lifecycle.
	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape' && image) {
				e.preventDefault();
				onClose();
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

{#if image}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-label="Bildvorschau"
		tabindex="-1"
	>
		<div
			class="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl border border-border bg-card"
		>
			<div class="relative flex items-center justify-center bg-black">
				{#if image.publicUrl}
					<img
						src={image.publicUrl}
						alt={image.prompt}
						class="max-h-[60vh] w-full object-contain"
					/>
				{:else}
					<div class="flex h-64 items-center justify-center">
						<SquaresFour size={64} class="text-muted-foreground/30" />
					</div>
				{/if}
			</div>

			<div class="p-4">
				<p class="text-sm text-foreground">{image.prompt}</p>
				{#if image.model}
					<p class="mt-1 text-xs text-muted-foreground">Modell: {image.model}</p>
				{/if}
				{#if image.width && image.height}
					<p class="text-xs text-muted-foreground">
						{image.width} × {image.height}
					</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					{formatDate(new Date(image.createdAt), {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
					})}
				</p>

				<div class="mt-3 flex gap-2">
					{#if actions}
						{@render actions()}
					{/if}
					<div class="flex-1"></div>
					<button
						type="button"
						onclick={onClose}
						class="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
					>
						Schließen
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
