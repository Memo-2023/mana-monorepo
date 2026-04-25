<!--
  Reusable full-screen image lightbox.

  Extracted from picture/ListView so other modules (wardrobe garment
  detail, outfit detail, any future "show me the full image"-surface)
  can render the same viewer without duplicating the markup. Picture
  keeps ownership because the component is typed against
  `picture.types.Image` and speaks prompt/model/dims vocabulary.

  Design: borderless, image-first. The picture fills the entire
  viewport (object-contain so aspect ratio is preserved). No card
  chrome — the dark backdrop alone frames the image. Metadata sits
  in the bottom-right corner as small grey text overlay so the eye
  goes to the image first; the only persistent control is a close
  affordance in the top-right. Module-specific buttons (Favorit /
  Archiv / "In Picture öffnen") render in the bottom-left via the
  `actions` snippet. Backdrop click and ESC both close.

  Colour note: text uses literal white-alpha + black-alpha utilities
  via a scoped `<style>` block instead of theme tokens. The lightbox
  always renders against a near-black backdrop regardless of the
  active theme, so a theme-aware muted-foreground would render too
  dark in light themes. Matches the validator's brand-literal escape
  hatch (see `scripts/validate-theme-utilities.mjs`).
-->
<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { onMount, type Snippet } from 'svelte';
	import { SquaresFour, X } from '@mana/shared-icons';
	import type { Image } from '../types';

	interface Props {
		/** Non-null to render, null/undefined to hide. */
		image: Image | null | undefined;
		onClose: () => void;
		/** Caller-specific controls rendered in the bottom-left. Picture
		 *  gallery uses this for Favorit / Archiv; wardrobe uses it for
		 *  a deep-link to the Picture gallery. */
		actions?: Snippet;
	}

	let { image, onClose, actions }: Props = $props();

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
	<!-- z-[100] sits above the layout's `.bottom-stack` (z-index: 90,
	     hosts PillNav + QuickInputBar + the sync-status row) so the
	     lightbox actually covers it. Tailwind's `z-50` would have left
	     the bottom chrome poking through. -->
	<div
		class="lightbox-root fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-label="Bildvorschau"
		tabindex="-1"
	>
		<!-- Image: fills the available area, centred, aspect-preserving. -->
		{#if image.publicUrl}
			<img
				src={image.publicUrl}
				alt={image.prompt}
				class="block max-h-full max-w-full object-contain"
			/>
		{:else}
			<div class="lightbox-empty flex h-64 w-64 items-center justify-center rounded-2xl">
				<SquaresFour size={64} />
			</div>
		{/if}

		<!-- Close: top-right, minimal. -->
		<button
			type="button"
			onclick={onClose}
			aria-label="Schließen"
			title="Schließen (Esc)"
			class="lightbox-close absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"
		>
			<X size={18} weight="bold" />
		</button>

		<!-- Caller-supplied actions: bottom-left. -->
		{#if actions}
			<div class="lightbox-actions absolute bottom-6 left-6 flex gap-2">
				{@render actions()}
			</div>
		{/if}

		<!-- Metadata: bottom-right, small, grey. Tight column (max-w
		     ≈ 14rem) so even long prompts hug the right edge instead of
		     stretching halfway across the image. Right-aligned so the
		     wrap stays anchored to the corner. `pointer-events-none`
		     keeps clicks falling through to the backdrop dismiss. -->
		<div
			class="lightbox-meta pointer-events-none absolute bottom-6 right-6 max-w-[14rem] text-right"
		>
			<p class="lightbox-meta-prompt">{image.prompt}</p>
			<div class="lightbox-meta-detail">
				{#if image.model}<span>{image.model}</span>{/if}
				{#if image.width && image.height}
					<span>{image.width}×{image.height}</span>
				{/if}
				<span>
					{formatDate(new Date(image.createdAt), {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
					})}
				</span>
			</div>
		</div>
	</div>
{/if}

<style>
	/* The lightbox always renders against a literal near-black backdrop,
	   regardless of the active theme — using theme-aware tokens here
	   would tint or wash out unpredictably under non-dark themes. The
	   validator's brand-literal escape hatch (see
	   scripts/validate-theme-utilities.mjs) covers exactly this case. */
	.lightbox-root {
		background-color: rgba(0, 0, 0, 0.92);
	}
	.lightbox-empty {
		color: rgba(255, 255, 255, 0.25);
		background-color: rgba(255, 255, 255, 0.04);
	}
	.lightbox-close {
		color: rgba(255, 255, 255, 0.7);
		background-color: rgba(255, 255, 255, 0.08);
		transition:
			background-color 0.15s,
			color 0.15s;
	}
	.lightbox-close:hover {
		color: rgba(255, 255, 255, 1);
		background-color: rgba(255, 255, 255, 0.15);
	}
	.lightbox-meta-prompt {
		font-size: 0.8125rem;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.55);
	}
	.lightbox-meta-detail {
		margin-top: 0.25rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		justify-content: flex-end;
		font-size: 0.6875rem;
		color: rgba(255, 255, 255, 0.4);
		font-variant-numeric: tabular-nums;
	}
	.lightbox-meta-detail span:not(:first-child)::before {
		content: '·';
		margin-right: 0.625rem;
		color: rgba(255, 255, 255, 0.25);
	}
</style>
