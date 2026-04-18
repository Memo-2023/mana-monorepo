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
	// the viewport (with horizontal overshoot so the next card is ready
	// before the user scrolls to it), then swap in the real snippet.
	//
	// LRU cache: keep the MAX_MOUNTED most-recently-intersected cards
	// mounted and let older ones drop back to a placeholder. Re-mounting
	// a re-intersected card costs one more liveQuery + chunk request,
	// but memory now stays bounded regardless of how many apps the user
	// scrolls through. The cap is set high enough to cover typical
	// working sets (3–6 apps) with headroom.
	const MAX_MOUNTED = 8;
	/** Pre-mount cards this far (horizontal, each side) outside the viewport
	 *  so the neighbour is ready when the user starts scrolling. */
	const PREMOUNT_MARGIN = '0px 50% 0px 50%';
	/** Intersection ratio at which we consider a card "visible enough" to
	 *  mount. Kept tiny so even a sliver-visible card counts. */
	const INTERSECTION_THRESHOLD = 0.01;
	let mountedIds = $state<Set<string>>(new Set());
	function markMounted(id: string) {
		// Set preserves insertion order → MRU sits at the back. Already-MRU
		// is a no-op so we don't churn reactivity on every intersect tick.
		if (Array.from(mountedIds).at(-1) === id) return;
		const next = new Set(mountedIds);
		// delete+add re-seats the id at the back of insertion order.
		next.delete(id);
		next.add(id);
		while (next.size > MAX_MOUNTED) {
			const oldest = next.values().next().value;
			if (!oldest) break;
			next.delete(oldest);
		}
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
	let io = $state<IntersectionObserver | null>(null);
	// Per-id element refs so we can diff add/remove instead of disconnecting
	// and re-observing every wrapper on each pages change. Svelte's keyed
	// {#each} preserves DOM nodes per id, so a given id → element mapping is
	// stable for the id's lifetime.
	const observed = new Map<string, HTMLElement>();

	// Create the IntersectionObserver exactly once — when the track element
	// mounts. Previously the IO was torn down and rebuilt on every
	// pages.length change, forcing every still-visible wrapper to re-fire
	// the intersection callback. Now it persists across adds/removes.
	$effect(() => {
		if (!trackEl || typeof IntersectionObserver === 'undefined') return;
		const instance = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const id = (entry.target as HTMLElement).dataset.pageId;
					if (id) markMounted(id);
				}
			},
			{
				root: trackEl,
				rootMargin: PREMOUNT_MARGIN,
				threshold: INTERSECTION_THRESHOLD,
			}
		);
		io = instance;
		return () => {
			instance.disconnect();
			observed.clear();
			io = null;
		};
	});

	// Sync the observed set with the current `pages`: observe new wrappers,
	// unobserve wrappers that were removed. Re-runs only when `pages`
	// identity (add/remove/reorder) or `io` changes.
	$effect(() => {
		const instance = io;
		if (!instance || !trackEl) return;
		// Reading pages.length subscribes this effect to additions/removals.
		void pages.length;
		const wrappers = trackEl.querySelectorAll<HTMLElement>('[data-page-id]');
		const nextIds = new Set<string>();
		for (const el of wrappers) {
			const id = el.dataset.pageId;
			if (!id) continue;
			nextIds.add(id);
			if (!observed.has(id)) {
				instance.observe(el);
				observed.set(id, el);
			}
		}
		for (const [id, el] of observed) {
			if (!nextIds.has(id)) {
				instance.unobserve(el);
				observed.delete(id);
			}
		}
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
