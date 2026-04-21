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
	let theme = $state<'light' | 'dark' | 'sepia'>('light');
	let fontFamily = $state<'serif' | 'sans'>('serif');

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
	<header class="topbar">
		<button type="button" class="topbtn" onclick={() => goto('/articles')} aria-label="Zurück">
			← Zurück
		</button>

		{#if article}
			<div class="type-controls">
				<button
					type="button"
					class="topbtn"
					onclick={() => (fontSize = Math.max(0.85, fontSize - 0.075))}
					title="Kleiner"
					aria-label="Schrift kleiner"
				>
					A−
				</button>
				<button
					type="button"
					class="topbtn"
					onclick={() => (fontSize = Math.min(1.35, fontSize + 0.075))}
					title="Größer"
					aria-label="Schrift größer"
				>
					A+
				</button>
				<span class="divider"></span>
				<button
					type="button"
					class="topbtn"
					class:active={fontFamily === 'serif'}
					onclick={() => (fontFamily = 'serif')}
					title="Serif"
				>
					Serif
				</button>
				<button
					type="button"
					class="topbtn"
					class:active={fontFamily === 'sans'}
					onclick={() => (fontFamily = 'sans')}
					title="Sans"
				>
					Sans
				</button>
				<span class="divider"></span>
				<button
					type="button"
					class="topbtn swatch swatch-light"
					class:active={theme === 'light'}
					onclick={() => (theme = 'light')}
					aria-label="Heller Modus"
					title="Hell"
				></button>
				<button
					type="button"
					class="topbtn swatch swatch-sepia"
					class:active={theme === 'sepia'}
					onclick={() => (theme = 'sepia')}
					aria-label="Sepia-Modus"
					title="Sepia"
				></button>
				<button
					type="button"
					class="topbtn swatch swatch-dark"
					class:active={theme === 'dark'}
					onclick={() => (theme = 'dark')}
					aria-label="Dunkler Modus"
					title="Dunkel"
				></button>
			</div>
		{/if}
	</header>

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

		<footer class="actionbar">
			<button
				type="button"
				class="actionbtn"
				class:active={article.status === 'finished'}
				onclick={toggleRead}
			>
				{article.status === 'finished' ? '✓ Gelesen' : 'Als gelesen markieren'}
			</button>
			<button
				type="button"
				class="actionbtn"
				class:active={article.isFavorite}
				onclick={toggleFavorite}
				aria-label="Favorit umschalten"
			>
				{article.isFavorite ? '★ Favorit' : '☆ Favorit'}
			</button>
			<button type="button" class="actionbtn" onclick={archive}>Archivieren</button>
			<a class="actionbtn" href={article.originalUrl} target="_blank" rel="noopener noreferrer">
				Original ↗
			</a>
			<span class="spacer"></span>
			<button type="button" class="actionbtn danger" onclick={deleteArticle}>Löschen</button>
		</footer>
	{/if}
</div>

<style>
	.detail-shell {
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
	.topbar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 0.9rem;
		border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
		background: inherit;
	}
	.type-controls {
		display: flex;
		gap: 0.3rem;
		margin-left: auto;
		flex-wrap: wrap;
	}
	.divider {
		width: 1px;
		height: 1.2em;
		background: color-mix(in srgb, currentColor 25%, transparent);
		align-self: center;
		margin: 0 0.2rem;
	}
	.topbtn {
		font: inherit;
		font-size: 0.82rem;
		padding: 0.3rem 0.65rem;
		background: transparent;
		color: inherit;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 0.45rem;
		cursor: pointer;
		text-decoration: none;
		line-height: 1.1;
	}
	.topbtn:hover {
		border-color: color-mix(in srgb, currentColor 35%, transparent);
	}
	.topbtn.active {
		background: color-mix(in srgb, currentColor 10%, transparent);
		border-color: color-mix(in srgb, currentColor 35%, transparent);
	}
	.swatch {
		width: 1.7rem;
		height: 1.7rem;
		padding: 0;
		border-radius: 50%;
		overflow: hidden;
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
	.meta-bar {
		max-width: 700px;
		margin: 1.2rem auto 0;
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
	.actionbar {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: 0.4rem;
		padding: 0.55rem 0.9rem;
		border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
		background: inherit;
		flex-wrap: wrap;
		align-items: center;
	}
	.actionbtn {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.4rem 0.75rem;
		background: transparent;
		color: inherit;
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 0.45rem;
		cursor: pointer;
		text-decoration: none;
	}
	.actionbtn:hover {
		border-color: color-mix(in srgb, currentColor 35%, transparent);
	}
	.actionbtn.active {
		background: color-mix(in srgb, #f97316 85%, transparent);
		color: white;
		border-color: #f97316;
	}
	.actionbtn.danger {
		color: #ef4444;
		border-color: color-mix(in srgb, #ef4444 30%, transparent);
	}
	.actionbtn.danger:hover {
		background: color-mix(in srgb, #ef4444 10%, transparent);
	}
	.spacer {
		flex: 1;
	}
	.placeholder {
		text-align: center;
		margin: 3rem auto;
		opacity: 0.7;
	}
</style>
