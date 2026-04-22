<!--
  DetailView — article reader + action bar.

  Composes the ReaderView typography shell with an action bar (status,
  favourite, archive, delete, external link) and a size/theme-picker
  that sits sticky at the top.

  Reading progress is persisted per scroll event (throttled in the
  Reader). Re-opening the article restores the last scroll position.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { TagField } from '@mana/shared-ui';
	import { useArticle, useArticleTagIds } from '../queries';
	import { articlesStore } from '../stores/articles.svelte';
	import { articleTagOps, useAllTags } from '../stores/tags.svelte';
	import ReaderView from '../components/ReaderView.svelte';
	import HighlightLayer from '../components/HighlightLayer.svelte';

	interface Props {
		id: string;
	}
	let { id }: Props = $props();

	// Re-create the live query when [id] changes. Without $derived.by the
	// subscription binds to the initial id only, so navigating directly from
	// one article's detail view to another's (same mount) would keep showing
	// the old one.
	const article$ = $derived.by(() => useArticle(id));
	const article = $derived(article$.value);

	// Tags: globally-available tag pool + the ids linked to *this* article.
	// TagField takes the full pool + selected ids; on change we fan-out
	// through articleTagOps.setTags which handles add/remove diff internally.
	const allTags$ = useAllTags();
	const tagIds$ = $derived.by(() => useArticleTagIds(id));

	// Typography state — per-session only for now. Persisting into userSettings
	// comes later; M2 just gets the UX loop working.
	let fontSize = $state(1);
	// Default reader theme follows the global app theme so opening an
	// article from a dark-mode Mana doesn't flash a white reader. The
	// swatch buttons still let the user override per-article (e.g. sepia
	// for late-evening reading regardless of the app's theme).
	let theme = $state<'light' | 'dark' | 'sepia'>('light');
	let fontFamily = $state<'serif' | 'sans'>('serif');

	onMount(() => {
		if (typeof document === 'undefined') return;
		if (document.documentElement.classList.contains('dark')) {
			theme = 'dark';
		}
	});

	// Refs handed off to HighlightLayer: `shell` is the positioning anchor
	// for the floating menu, `readerScroller` is where text lives + where
	// selection events fire.
	let shell: HTMLDivElement | undefined = $state();
	let readerScroller = $state<HTMLDivElement | null>(null);

	async function toggleRead() {
		if (!article) return;
		await articlesStore.setStatus(
			article.id,
			article.status === 'finished' ? 'unread' : 'finished'
		);
	}

	async function toggleFavorite() {
		if (!article) return;
		await articlesStore.toggleFavorite(article.id);
	}

	async function archive() {
		if (!article) return;
		await articlesStore.setStatus(article.id, 'archived');
		goto('/articles');
	}

	async function deleteArticle() {
		if (!article) return;
		if (!confirm('Artikel wirklich löschen?')) return;
		await articlesStore.deleteArticle(article.id);
		goto('/articles');
	}

	async function onProgress(progress: number) {
		if (!article) return;
		// First meaningful scroll flips unread → reading; reader handles the
		// rest of the lifecycle (mark-finished is an explicit user action).
		if (article.status === 'unread' && progress > 0.05) {
			await articlesStore.setStatus(article.id, 'reading');
		}
		await articlesStore.setProgress(article.id, progress);
	}

	async function onTagsChange(ids: string[]) {
		if (!article) return;
		await articleTagOps.setTags(article.id, ids);
	}
</script>

<svelte:head>
	<title>{article?.title ?? 'Artikel'} — Mana</title>
</svelte:head>

<div class="detail-shell detail-{theme}" bind:this={shell}>
	{#if article$.loading}
		<p class="placeholder">Lädt…</p>
	{:else if !article}
		<div class="placeholder">
			<p>Artikel nicht gefunden.</p>
			<button type="button" class="topbtn" onclick={() => goto('/articles')}>
				Zurück zur Liste
			</button>
		</div>
	{:else}
		<div class="meta-bar">
			<h1 class="title">{article.title}</h1>
			<div class="meta-row">
				{#if article.siteName}<span>{article.siteName}</span>{/if}
				{#if article.author}<span>· {article.author}</span>{/if}
				{#if article.readingTimeMinutes}<span>· {article.readingTimeMinutes} min</span>{/if}
				{#if article.wordCount}<span>· {article.wordCount} Wörter</span>{/if}
			</div>
			<div class="tags-row">
				<TagField
					tags={allTags$.value}
					selectedIds={tagIds$.value}
					onChange={onTagsChange}
					addLabel="Tag"
					placeholder="Tag suchen oder erstellen…"
				/>
			</div>
		</div>

		<ReaderView
			html={article.htmlContent}
			plainFallback={article.content}
			{theme}
			{fontSize}
			{fontFamily}
			initialProgress={article.readingProgress}
			onprogress={onProgress}
			onscroller={(el) => (readerScroller = el)}
		/>

		<HighlightLayer
			articleId={article.id}
			scroller={readerScroller}
			container={shell ?? null}
			htmlVersion={article.htmlContent}
		/>

		<footer class="floating-bar" aria-label="Lese-Werkzeuge">
			<div class="bar-group nav-group">
				<button
					type="button"
					class="bar-btn"
					onclick={() => goto('/articles')}
					aria-label="Zurück zur Liste"
					data-tip="Zurück zur Leseliste"
				>
					←
				</button>
			</div>

			<span class="bar-divider" aria-hidden="true"></span>

			<div class="bar-group type-group">
				<button
					type="button"
					class="bar-btn"
					onclick={() => (fontSize = Math.max(0.85, fontSize - 0.075))}
					aria-label="Schrift kleiner"
					data-tip="Schrift kleiner"
				>
					A−
				</button>
				<button
					type="button"
					class="bar-btn"
					onclick={() => (fontSize = Math.min(1.35, fontSize + 0.075))}
					aria-label="Schrift größer"
					data-tip="Schrift größer"
				>
					A+
				</button>
				<button
					type="button"
					class="bar-btn"
					class:active={fontFamily === 'serif'}
					onclick={() => (fontFamily = 'serif')}
					data-tip="Serif-Schrift"
				>
					Serif
				</button>
				<button
					type="button"
					class="bar-btn"
					class:active={fontFamily === 'sans'}
					onclick={() => (fontFamily = 'sans')}
					data-tip="Sans-Serif-Schrift"
				>
					Sans
				</button>
				<button
					type="button"
					class="bar-btn swatch swatch-light"
					class:active={theme === 'light'}
					onclick={() => (theme = 'light')}
					aria-label="Heller Modus"
					data-tip="Heller Modus"
				></button>
				<button
					type="button"
					class="bar-btn swatch swatch-sepia"
					class:active={theme === 'sepia'}
					onclick={() => (theme = 'sepia')}
					aria-label="Sepia-Modus"
					data-tip="Sepia-Modus"
				></button>
				<button
					type="button"
					class="bar-btn swatch swatch-dark"
					class:active={theme === 'dark'}
					onclick={() => (theme = 'dark')}
					aria-label="Dunkler Modus"
					data-tip="Dunkler Modus"
				></button>
			</div>

			<span class="bar-divider" aria-hidden="true"></span>

			<div class="bar-group action-group">
				<button
					type="button"
					class="bar-btn"
					class:active={article.status === 'finished'}
					onclick={toggleRead}
					aria-label={article.status === 'finished'
						? 'Als ungelesen markieren'
						: 'Als gelesen markieren'}
					data-tip={article.status === 'finished'
						? 'Als ungelesen markieren'
						: 'Als gelesen markieren'}
				>
					{article.status === 'finished' ? '✓' : '○'}
				</button>
				<button
					type="button"
					class="bar-btn"
					class:active={article.isFavorite}
					onclick={toggleFavorite}
					aria-label={article.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
					data-tip={article.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
				>
					{article.isFavorite ? '★' : '☆'}
				</button>
				<button
					type="button"
					class="bar-btn"
					onclick={archive}
					aria-label="Artikel archivieren"
					data-tip="Artikel archivieren"
				>
					⤓
				</button>
				<a
					class="bar-btn"
					href={article.originalUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Original-Seite öffnen"
					data-tip="Original-Seite öffnen"
				>
					↗
				</a>
				<button
					type="button"
					class="bar-btn danger"
					onclick={deleteArticle}
					aria-label="Artikel löschen"
					data-tip="Artikel löschen"
				>
					🗑
				</button>
			</div>
		</footer>
	{/if}
</div>

<style>
	.detail-shell {
		/* Break out of the (app) layout's padded container so the reader    */
		/* fills the whole viewport edge-to-edge. The horizontal escape is   */
		/* the `100vw` + negative-margin-X trick that cancels the centered   */
		/* `max-w-7xl mx-auto px-3 sm:px-6 lg:px-8` wrapper. The vertical    */
		/* escape uses equally-negative margins to consume <main>'s pt-2    */
		/* AND its dynamic padding-bottom (which was reserving space for the */
		/* bottom chrome). The reader theme then paints behind the floating  */
		/* PillNav too — far better than a theme-background island floating  */
		/* in a page-background sea.                                          */
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		margin-top: calc(-1 * (0.5rem + 0.5rem)); /* <main pt-2> + inner py-2 */
		margin-bottom: calc(-1 * (var(--bottom-chrome-height, 0px) + 8px + 0.5rem));
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		/* Positioning anchor for the floating HighlightMenu: its `top`/`left` */
		/* coordinates are computed relative to this box.                     */
		position: relative;
	}
	.detail-light {
		background: #ffffff;
		color: #1e293b;
	}
	.detail-sepia {
		background: #f4ecd8;
		color: #433422;
	}
	.detail-dark {
		background: #0f172a;
		color: #e2e8f0;
	}
	.meta-bar {
		max-width: 700px;
		margin: 4rem auto 0;
		padding: 0 clamp(1rem, 5vw, 3rem);
		width: 100%;
	}
	.title {
		font-size: 1.8rem;
		line-height: 1.25;
		margin: 0 0 0.4rem 0;
	}
	.meta-row {
		font-size: 0.85rem;
		opacity: 0.75;
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.tags-row {
		margin-top: 0.75rem;
	}
	.placeholder {
		text-align: center;
		margin: 3rem auto;
		opacity: 0.7;
	}

	/* ─── Floating unified toolbar ────────────────────────────
	 *
	 * One bar at the bottom replaces what used to be a top bar (back +
	 * typography) and a bottom bar (article actions). Three groups
	 * divided by vertical rules: nav | typography | actions.
	 *
	 * `position: fixed` + center-X transform produces the floating-pill
	 * look; it stays put while the reader scrolls. `bottom: 1rem` leaves
	 * enough gap from the viewport edge to feel like a pill, not a docked
	 * toolbar. On narrow screens the groups wrap onto multiple rows via
	 * flex-wrap — still readable, just taller.
	 */
	.floating-bar {
		position: fixed;
		/* Clear Mana's own bottom-stack (PillNavigation + QuickInputBar +   */
		/* TagStrip). The layout publishes its total height as               */
		/* `--bottom-chrome-height` on <main>, which cascades down into our  */
		/* detail-shell even though we're position: fixed (inheritance is    */
		/* DOM-based, not layout-based). Fallback 0 keeps the bar sensible   */
		/* if this page ever renders outside the app shell (e.g. a test).    */
		bottom: calc(var(--bottom-chrome-height, 0px) + 1rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.65rem;
		border-radius: 999px;
		background: color-mix(in srgb, currentColor 3%, Canvas);
		border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
		box-shadow:
			0 8px 24px -8px color-mix(in srgb, currentColor 35%, transparent),
			0 2px 6px -2px color-mix(in srgb, currentColor 20%, transparent);
		backdrop-filter: blur(10px);
		max-width: calc(100vw - 2rem);
		flex-wrap: wrap;
		justify-content: center;
	}
	/* Reader-theme surface overrides — Canvas above is the browser-neutral
	 * default; each theme pins a proper opaque backdrop so text on/around
	 * the bar stays legible. */
	.detail-light .floating-bar {
		background: color-mix(in srgb, #ffffff 92%, transparent);
	}
	.detail-sepia .floating-bar {
		background: color-mix(in srgb, #f4ecd8 92%, transparent);
	}
	.detail-dark .floating-bar {
		background: color-mix(in srgb, #0f172a 88%, transparent);
	}
	.bar-group {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}
	.bar-divider {
		width: 1px;
		height: 1.3rem;
		background: color-mix(in srgb, currentColor 20%, transparent);
		margin: 0 0.15rem;
	}
	.bar-btn {
		font: inherit;
		font-size: 0.82rem;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.55rem;
		background: transparent;
		color: inherit;
		border: 1px solid transparent;
		border-radius: 999px;
		cursor: pointer;
		text-decoration: none;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}
	.bar-btn:hover {
		background: color-mix(in srgb, currentColor 8%, transparent);
	}
	/* Custom tooltip: small label bubble above the button on hover. The
	 * native `title` tooltip has a ~1s delay and inherits the OS style,
	 * which feels sluggish for a reader-toolbar where the user is
	 * scanning icons. `data-tip` is set declaratively on each button so
	 * swapping copy per state (read / unread, favorite / unmark) stays
	 * a Svelte attribute reactivity concern, not a CSS one. */
	.bar-btn[data-tip]::after {
		content: attr(data-tip);
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.3rem 0.55rem;
		border-radius: 0.4rem;
		font-size: 0.72rem;
		font-weight: 500;
		white-space: nowrap;
		color: #f1f5f9;
		background: #0f172a;
		box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.25);
		opacity: 0;
		pointer-events: none;
		transition: opacity 120ms ease;
		/* Keep the tooltip above the bar's own backdrop. */
		z-index: 1;
	}
	.bar-btn[data-tip]:hover::after,
	.bar-btn[data-tip]:focus-visible::after {
		opacity: 1;
		transition-delay: 120ms;
	}
	/* Light-mode readers get an inverted bubble so the tooltip doesn't
	 * look like just a darker blob — pops off the light page. */
	.detail-light .bar-btn[data-tip]::after {
		color: #f1f5f9;
		background: #1e293b;
	}
	.detail-sepia .bar-btn[data-tip]::after {
		color: #f4ecd8;
		background: #433422;
	}
	.detail-dark .bar-btn[data-tip]::after {
		color: #0f172a;
		background: #e2e8f0;
	}
	.bar-btn.active {
		background: color-mix(in srgb, #f97316 18%, transparent);
		color: #ea580c;
	}
	.detail-dark .bar-btn.active {
		color: #fdba74;
	}
	.bar-btn.danger:hover {
		background: color-mix(in srgb, #ef4444 15%, transparent);
		color: #ef4444;
	}
	.swatch {
		width: 1.5rem;
		height: 1.5rem;
		min-width: 1.5rem;
		padding: 0;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
	}
	.swatch:hover {
		border-color: color-mix(in srgb, currentColor 55%, transparent);
	}
	.swatch.active {
		background: currentColor;
		outline: 2px solid color-mix(in srgb, #f97316 80%, transparent);
		outline-offset: 1px;
	}
	.swatch-light {
		background: #ffffff;
	}
	.swatch-sepia {
		background: #f4ecd8;
	}
	.swatch-dark {
		background: #0f172a;
	}
	/* Override `.swatch.active { background: currentColor }` so the color
	 * chip stays the theme-preview color even when selected. */
	.swatch-light.active {
		background: #ffffff;
	}
	.swatch-sepia.active {
		background: #f4ecd8;
	}
	.swatch-dark.active {
		background: #0f172a;
	}
</style>
