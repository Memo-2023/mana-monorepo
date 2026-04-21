<!--
  ReaderView — pure typography shell.

  Renders the sanitised htmlContent that came back from Readability. We
  DON'T sanitise client-side: Readability already emits a clean subset
  (no <script>, no inline handlers) and the content landed in IndexedDB
  only after an authenticated server call to our own extraction route.
  Same approach as the news reader at /news/[id].

  The shell is completely dumb — parent passes html + typography props
  and listens for progress updates on scroll. No mutation happens here.
-->
<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		html: string | null;
		plainFallback: string;
		theme?: 'light' | 'dark' | 'sepia';
		fontSize?: number;
		fontFamily?: 'serif' | 'sans';
		initialProgress?: number;
		onprogress?: (progress: number) => void;
		/** Callback fires once the scroller div is mounted — the HighlightLayer
		 *  needs this ref to attach selection listeners and wrap text-node
		 *  ranges. Fires with null on unmount for cleanup.
		 */
		onscroller?: (el: HTMLDivElement | null) => void;
	}

	let {
		html,
		plainFallback,
		theme = 'light',
		fontSize = 1,
		fontFamily = 'serif',
		initialProgress = 0,
		onprogress,
		onscroller,
	}: Props = $props();

	let scroller: HTMLDivElement | undefined = $state();
	let lastReported = $state(0);

	$effect(() => {
		onscroller?.(scroller ?? null);
		return () => onscroller?.(null);
	});

	$effect(() => {
		if (!scroller) return;
		// Restore last-read position ONCE when the scroller mounts. Reading
		// `initialProgress` inside `untrack` stops our own progress updates
		// — which flow back as new initialProgress values — from kicking the
		// scroll back every time the user moves.
		untrack(() => {
			if (!scroller) return;
			const target = initialProgress * (scroller.scrollHeight - scroller.clientHeight);
			if (target > 0 && Number.isFinite(target)) scroller.scrollTop = target;
			lastReported = initialProgress;
		});
	});

	let scrollRaf = 0;
	function onScroll() {
		if (!scroller || !onprogress) return;
		// Coalesce scroll events — reporting every pixel would hammer Dexie.
		if (scrollRaf) cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(() => {
			if (!scroller) return;
			const max = scroller.scrollHeight - scroller.clientHeight;
			const progress = max > 0 ? scroller.scrollTop / max : 0;
			// Only emit on meaningful deltas (>1%) to spare the DB.
			if (Math.abs(progress - lastReported) > 0.01) {
				lastReported = progress;
				onprogress?.(progress);
			}
		});
	}
</script>

<div
	bind:this={scroller}
	class="reader reader-{theme} reader-{fontFamily}"
	style:--reader-font-size="{fontSize}rem"
	onscroll={onScroll}
>
	{#if html}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	{:else}
		<pre class="plain">{plainFallback}</pre>
	{/if}
</div>

<style>
	.reader {
		overflow-y: auto;
		padding: 1.5rem clamp(1rem, 5vw, 3rem) 4rem;
		font-size: var(--reader-font-size);
		line-height: 1.65;
		max-width: 700px;
		margin: 0 auto;
		width: 100%;
	}
	.reader-serif {
		font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
	}
	.reader-sans {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	.reader-light {
		color: #1e293b;
		background: #ffffff;
	}
	.reader-dark {
		color: #e2e8f0;
		background: #0f172a;
	}
	.reader-sepia {
		color: #433422;
		background: #f4ecd8;
	}
	.reader :global(h1),
	.reader :global(h2),
	.reader :global(h3) {
		line-height: 1.3;
		margin-top: 1.6em;
		margin-bottom: 0.5em;
	}
	.reader :global(h1) {
		font-size: 1.55em;
	}
	.reader :global(h2) {
		font-size: 1.3em;
	}
	.reader :global(h3) {
		font-size: 1.1em;
	}
	.reader :global(p) {
		margin: 0 0 1.05em 0;
	}
	.reader :global(a) {
		color: #ea580c;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}
	.reader-dark :global(a) {
		color: #fdba74;
	}
	.reader :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.35rem;
		margin: 1em 0;
	}
	.reader :global(blockquote) {
		border-left: 3px solid currentColor;
		opacity: 0.85;
		margin: 1.2em 0;
		padding: 0.15em 0 0.15em 1em;
		font-style: italic;
	}
	.reader :global(pre),
	.reader :global(code) {
		font-family: 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.88em;
	}
	.reader :global(pre) {
		background: rgba(0, 0, 0, 0.06);
		padding: 0.8em 1em;
		border-radius: 0.4rem;
		overflow-x: auto;
	}
	.reader-dark :global(pre) {
		background: rgba(255, 255, 255, 0.08);
	}
	.reader :global(ul),
	.reader :global(ol) {
		padding-left: 1.4em;
		margin: 0 0 1.05em 0;
	}
	.plain {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: inherit;
		margin: 0;
	}
</style>
