<!--
  PageCarousel — Shared horizontal carousel with add button.
  The scene+app bar is rendered in the layout's bottom-stack via bottomBarStore.
-->
<script lang="ts">
	import { Plus } from '@mana/shared-icons';
	import type { Snippet } from 'svelte';
	import type { CarouselPage } from './types';

	interface Props {
		pages: CarouselPage[];
		defaultWidth?: number;
		showPicker: boolean;
		onRestore?: (id: string) => void;
		onMaximize?: (id: string) => void;
		onRemove?: (id: string) => void;
		onTogglePicker: () => void;
		onTabContextMenu?: (e: MouseEvent, pageId: string) => void;
		addLabel?: string;
		page: Snippet<[CarouselPage, number]>;
		picker?: Snippet;
		/** Optional content rendered before the first page inside the same
		 *  scroll track. Used for the scene header on the homepage. Scrolls
		 *  with the pages (doesn't stay pinned) so it reads as an intro
		 *  block rather than app chrome. */
		leading?: Snippet;
	}

	let {
		pages,
		defaultWidth = 480,
		showPicker,
		onRestore: _onRestore,
		onMaximize: _onMaximize,
		onRemove: _onRemove,
		onTogglePicker,
		onTabContextMenu: _onTabContextMenu,
		addLabel = 'Hinzufügen',
		page: pageSnippet,
		picker,
		leading,
	}: Props = $props();

	let pickerEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		if (showPicker && pickerEl)
			pickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
	});

	// ── Lazy-mount via IntersectionObserver ─────────────────
	// Each card mounts a full ListView with its own Dexie liveQuery on
	// first render. With 5+ open apps that's 5+ parallel IndexedDB reads
	// + 5+ async chunk fetches before first paint, even though only the
	// 1-2 cards in the horizontal viewport are actually visible.
	//
	// Strategy: render a fixed-size placeholder until the wrapper enters
	// the viewport (50% horizontal overshoot so the next card is ready
	// before the user scrolls to it), then swap in the real snippet.
	// Sticky-cache: once a card has been mounted we never tear it down
	// — re-running a liveQuery + re-fetching a chunk costs more than
	// keeping the DOM tree resident. Memory still scales with how many
	// apps the user has actively scrolled through, not how many they
	// have open.
	let mountedIds = $state<Set<string>>(new Set());
	function markMounted(id: string) {
		if (mountedIds.has(id)) return;
		// Replace the Set so $state notices the change.
		const next = new Set(mountedIds);
		next.add(id);
		mountedIds = next;
	}
	// Mount the first card eagerly so initial paint always shows
	// content even before the IntersectionObserver fires its first
	// callback (which would otherwise leave a 1-frame placeholder
	// flash on cold load).
	$effect(() => {
		if (pages.length > 0) markMounted(pages[0].id);
	});

	let trackEl = $state<HTMLDivElement | null>(null);
	$effect(() => {
		if (!trackEl || typeof IntersectionObserver === 'undefined') return;
		// Track pages.length so the effect re-runs (and re-observes
		// freshly-added wrappers) when the user adds or removes an app.
		// Cheap to tear down and recreate; the IO has no internal state
		// we care to preserve.
		void pages.length;
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const id = (entry.target as HTMLElement).dataset.pageId;
					if (id) markMounted(id);
				}
			},
			{
				root: trackEl,
				// Pre-mount the immediate neighbours so the next card on
				// either side is ready when the user starts scrolling.
				rootMargin: '0px 50% 0px 50%',
				threshold: 0.01,
			}
		);
		const wrappers = trackEl.querySelectorAll<HTMLElement>('[data-page-id]');
		wrappers.forEach((el) => io.observe(el));
		return () => io.disconnect();
	});
</script>

<div class="carousel-root">
	<div class="fokus-track" style="--sheet-width: {defaultWidth}px" bind:this={trackEl}>
		{#if leading}
			<div class="leading-slot">{@render leading()}</div>
		{/if}
		{#each pages as p, idx (p.id)}
			<div class="page-wrapper" role="listitem" data-page-id={p.id}>
				{#if mountedIds.has(p.id)}
					{@render pageSnippet(p, idx)}
				{:else}
					<div
						class="page-placeholder"
						style="width: {p.widthPx ?? defaultWidth}px;"
						aria-hidden="true"
					></div>
				{/if}
			</div>
		{/each}

		{#if pages.length === 0}
			<div class="empty-wrapper">
				{#if showPicker && picker}
					{@render picker()}
				{:else}
					<div class="empty-state">
						<p class="empty-title">Diese Szene ist leer</p>
						<p class="empty-hint">
							Füge eine App hinzu, um loszulegen — oder drücke <kbd>0</kbd>.
						</p>
						<button class="add-card alone" onclick={onTogglePicker}>
							<Plus size={24} /><span class="add-label">{addLabel}</span>
						</button>
					</div>
				{/if}
			</div>
		{:else if showPicker && picker}
			<div bind:this={pickerEl}>{@render picker()}</div>
		{:else}
			<button class="add-card" onclick={onTogglePicker} title={addLabel}><Plus size={18} /></button>
		{/if}
	</div>
</div>

<style>
	.carousel-root {
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.fokus-track {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 0.5rem 2rem 0.5rem calc(50vw - 240px);
		scrollbar-width: none;
		flex: 1;
	}
	@media (max-width: 639px) {
		.fokus-track {
			padding: 0.5rem 1rem;
			gap: 0.75rem;
		}
	}
	.fokus-track::-webkit-scrollbar {
		display: none;
	}
	.page-wrapper {
		flex: 0 0 auto;
	}
	.leading-slot {
		flex: 0 0 auto;
		align-self: stretch;
		display: flex;
		align-items: center;
	}
	/* Sized stand-in for a not-yet-mounted card. Matches the card's
	   widthPx so scroll position and the surrounding flex layout stay
	   stable while the IntersectionObserver decides which cards to
	   mount. Height falls back to 60vh (the same minimum the empty
	   state uses), which keeps the track from collapsing on initial
	   paint. Card bodies scroll internally — per-card heights were
	   dropped in favour of a single viewport-height policy. */
	.page-placeholder {
		min-height: 60vh;
		border-radius: 1.25rem;
		background: hsl(var(--color-surface) / 0.4);
	}
	.add-card {
		flex: 0 0 auto;
		width: 48px;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border: 2px dashed hsl(var(--color-border));
		border-radius: 1.25rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.2s;
	}
	.empty-wrapper {
		flex: 0 0 auto;
		width: var(--sheet-width, 480px);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		max-width: 100%;
	}
	.empty-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.empty-hint {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		line-height: 1.5;
	}
	.empty-hint kbd {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border: 1px solid hsl(var(--color-border));
		border-bottom-width: 2px;
		border-radius: 0.25rem;
		background: hsl(var(--color-surface, var(--color-muted)));
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}
	.add-card.alone {
		width: 100%;
		min-height: 60vh;
		border-color: hsl(var(--color-border-strong));
	}
	.add-card:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: color-mix(in srgb, hsl(var(--color-primary)) 4%, transparent);
	}
	.add-label {
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
