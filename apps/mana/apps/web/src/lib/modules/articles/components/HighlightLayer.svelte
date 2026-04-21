<!--
  HighlightLayer — orchestrates highlight overlays + selection menu.

  Pattern:
    - On every `highlights` change (or when the Reader re-renders because
      `html` changed) we unwrap all previously-applied highlight spans
      and re-apply fresh. The DOM is the source of truth for offset
      resolution, so we tolerate the "rebuild on change" cost.
    - `mouseup` on the scroller checks for a live selection; if found, we
      show the create-menu at the selection rect.
    - `click` on an existing highlight span (`span[data-hl-id]`) opens
      the edit-menu for that one.
    - `mousedown` elsewhere dismisses the menu.

  Coordinates: the menu is positioned relative to `container` (the
  `detail-shell` from DetailView). We project viewport rects into the
  container's local frame by subtracting its bounding-rect origin.
-->
<script lang="ts">
	import { useArticleHighlights } from '../queries';
	import { highlightsStore } from '../stores/highlights.svelte';
	import {
		extractSelectionSnapshot,
		textOffsetsToSlices,
		type SelectionSnapshot,
	} from '../lib/offsets';
	import HighlightMenu from './HighlightMenu.svelte';
	import type { Highlight, HighlightColor } from '../types';

	interface Props {
		articleId: string;
		/** The Reader's scrollable content root — where text lives. */
		scroller: HTMLElement | null;
		/** The positioning ancestor — menu coordinates are relative to this. */
		container: HTMLElement | null;
		/** Re-apply when the Reader's HTML changes (theme swap → re-render). */
		htmlVersion: unknown;
	}
	let { articleId, scroller, container, htmlVersion }: Props = $props();

	const highlights$ = $derived.by(() => useArticleHighlights(articleId));
	const highlights = $derived(highlights$.value);

	type MenuState =
		| { kind: 'create'; snapshot: SelectionSnapshot; top: number; left: number }
		| { kind: 'edit'; highlight: Highlight; top: number; left: number }
		| null;

	let menu = $state<MenuState>(null);

	// ─── Overlay application ──────────────────────────────
	//
	// Re-runs whenever `highlights` or `htmlVersion` changes. `htmlVersion`
	// is bumped by the parent whenever ReaderView replaces its DOM (e.g. a
	// new article loaded), so we know to re-wrap.
	$effect(() => {
		// Track dependencies. Without these reads Svelte wouldn't know to
		// re-run when highlights or htmlVersion changes.
		const list = highlights;
		void htmlVersion;
		if (!scroller) return;
		unwrapAll(scroller);
		for (const h of list) applyHighlight(scroller, h);
	});

	function unwrapAll(root: HTMLElement) {
		const spans = root.querySelectorAll<HTMLSpanElement>('span[data-hl-id]');
		for (const span of Array.from(spans)) {
			const parent = span.parentNode;
			if (!parent) continue;
			while (span.firstChild) parent.insertBefore(span.firstChild, span);
			parent.removeChild(span);
			// Merge adjacent text nodes so future offset walks stay stable.
			parent.normalize();
		}
	}

	function applyHighlight(root: HTMLElement, h: Highlight) {
		const slices = textOffsetsToSlices(root, h.startOffset, h.endOffset);
		for (const slice of slices) {
			const range = document.createRange();
			range.setStart(slice.node, slice.start);
			range.setEnd(slice.node, slice.end);
			const span = document.createElement('span');
			span.dataset.hlId = h.id;
			span.dataset.hlColor = h.color;
			span.className = `article-highlight article-highlight-${h.color}`;
			if (h.note) span.dataset.hlNote = h.note;
			try {
				range.surroundContents(span);
			} catch {
				// surroundContents throws when the range crosses element
				// boundaries — shouldn't happen here since textOffsetsToSlices
				// splits per text node, but we still guard so a single bad
				// highlight doesn't kill the whole overlay pass.
			}
		}
	}

	// ─── Selection → create menu ─────────────────────────

	function onSelectionEnd(event: MouseEvent) {
		// Ignore mouseups that land on existing highlights — those open the
		// edit menu via the separate click handler.
		const target = event.target as HTMLElement | null;
		if (target?.closest('span[data-hl-id]')) return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			return;
		}
		if (!scroller || !container) return;
		const range = selection.getRangeAt(0);
		if (!scroller.contains(range.commonAncestorContainer)) return;

		const snapshot = extractSelectionSnapshot(range, scroller);
		if (!snapshot) return;

		const { top, left } = rectToLocal(range.getBoundingClientRect(), container);
		menu = { kind: 'create', snapshot, top, left };
	}

	// ─── Click on existing highlight → edit menu ──────────

	function onClick(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		const span = target?.closest('span[data-hl-id]') as HTMLSpanElement | null;
		if (!span) return;
		const id = span.dataset.hlId;
		if (!id) return;
		const existing = highlights.find((h) => h.id === id);
		if (!existing || !container) return;
		const { top, left } = rectToLocal(span.getBoundingClientRect(), container);
		menu = { kind: 'edit', highlight: existing, top, left };
		event.stopPropagation();
	}

	function onMousedown(event: MouseEvent) {
		if (!menu) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('.article-highlight-menu-anchor')) return;
		if (target?.closest('span[data-hl-id]')) return;
		// Clicking into the menu itself is fine; it lives under
		// .article-highlight-menu-anchor too.
		menu = null;
	}

	function rectToLocal(rect: DOMRect, anchor: HTMLElement) {
		const origin = anchor.getBoundingClientRect();
		return {
			top: rect.bottom - origin.top + 8,
			left: rect.left - origin.left,
		};
	}

	$effect(() => {
		if (!scroller) return;
		scroller.addEventListener('mouseup', onSelectionEnd);
		scroller.addEventListener('click', onClick);
		document.addEventListener('mousedown', onMousedown);
		return () => {
			scroller.removeEventListener('mouseup', onSelectionEnd);
			scroller.removeEventListener('click', onClick);
			document.removeEventListener('mousedown', onMousedown);
		};
	});

	// ─── Menu actions ─────────────────────────────────────

	async function handleCreate(color: HighlightColor, note: string | null) {
		if (menu?.kind !== 'create') return;
		const s = menu.snapshot;
		menu = null;
		window.getSelection()?.removeAllRanges();
		await highlightsStore.addHighlight({
			articleId,
			text: s.text,
			color,
			note,
			startOffset: s.start,
			endOffset: s.end,
			contextBefore: s.contextBefore,
			contextAfter: s.contextAfter,
		});
	}

	async function handleUpdate(color: HighlightColor, note: string | null) {
		if (menu?.kind !== 'edit') return;
		const id = menu.highlight.id;
		menu = null;
		await highlightsStore.setColor(id, color);
		await highlightsStore.setNote(id, note);
	}

	async function handleDelete() {
		if (menu?.kind !== 'edit') return;
		const id = menu.highlight.id;
		menu = null;
		await highlightsStore.deleteHighlight(id);
	}
</script>

<div class="article-highlight-menu-anchor">
	{#if menu?.kind === 'create'}
		<HighlightMenu
			mode="create"
			top={menu.top}
			left={menu.left}
			onsave={handleCreate}
			oncancel={() => (menu = null)}
		/>
	{:else if menu?.kind === 'edit'}
		<HighlightMenu
			mode="edit"
			top={menu.top}
			left={menu.left}
			initialColor={menu.highlight.color}
			initialNote={menu.highlight.note}
			onupdate={handleUpdate}
			ondelete={handleDelete}
			onclose={() => (menu = null)}
		/>
	{/if}
</div>

<style>
	.article-highlight-menu-anchor {
		position: absolute;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		pointer-events: none;
	}
	.article-highlight-menu-anchor :global(.menu) {
		pointer-events: auto;
	}

	/* Highlight-Spans werden programmatisch eingefügt; die Styles müssen */
	/* global greifen, weil die Spans nicht zum Markup dieser Komponente   */
	/* gehören sondern im Reader-DOM leben.                                */
	:global(.article-highlight) {
		border-radius: 0.1rem;
		padding: 0 0.1em;
		cursor: pointer;
		transition: filter 120ms ease;
	}
	:global(.article-highlight:hover) {
		filter: brightness(0.94);
	}
	:global(.article-highlight-yellow) {
		background: #fde68a;
		color: #1e293b;
	}
	:global(.article-highlight-green) {
		background: #bbf7d0;
		color: #1e293b;
	}
	:global(.article-highlight-blue) {
		background: #bfdbfe;
		color: #1e293b;
	}
	:global(.article-highlight-pink) {
		background: #fbcfe8;
		color: #1e293b;
	}
	/* Dunkler Reader-Modus bekommt eigene Farben: weniger Saturation, Text  */
	/* bleibt lesbar auf dunklem Hintergrund.                                */
	:global(.reader-dark .article-highlight-yellow) {
		background: rgba(253, 224, 71, 0.35);
		color: inherit;
	}
	:global(.reader-dark .article-highlight-green) {
		background: rgba(134, 239, 172, 0.3);
		color: inherit;
	}
	:global(.reader-dark .article-highlight-blue) {
		background: rgba(147, 197, 253, 0.3);
		color: inherit;
	}
	:global(.reader-dark .article-highlight-pink) {
		background: rgba(249, 168, 212, 0.3);
		color: inherit;
	}
</style>
