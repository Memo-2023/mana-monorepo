<!--
  News Feed — the main view.

  Two render branches: if the user has not finished onboarding yet,
  show the topic + language picker inline. Otherwise, render the
  ranked feed with reaction buttons.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		usePreferences,
		useCachedFeed,
		useReactions,
		formatRelativeTime,
	} from '$lib/modules/news/queries';
	import { rankFeed, buildReactionSets } from '$lib/modules/news/feed-engine';
	import { preferencesStore } from '$lib/modules/news/stores/preferences.svelte';
	import { reactionsStore } from '$lib/modules/news/stores/reactions.svelte';
	import { articlesStore } from '$lib/modules/news/stores/articles.svelte';
	import { feedCacheStore } from '$lib/modules/news/stores/feed-cache.svelte';
	import {
		ALL_TOPICS,
		type Topic,
		type Language,
		type LocalCachedArticle,
	} from '$lib/modules/news/types';
	import { TOPIC_LABELS, sourcesForTopic } from '$lib/modules/news/sources-meta';

	const prefs$ = usePreferences();
	const pool$ = useCachedFeed();
	const reactions$ = useReactions();

	const prefs = $derived(prefs$.value);
	const pool = $derived(pool$.value);
	const reactions = $derived(reactions$.value);

	// ─── Onboarding state (only used in the onboarding branch) ─
	let pickedTopics = $state<Topic[]>([]);
	let pickedLanguages = $state<Language[]>(['de', 'en']);
	let pickedBlocked = $state<string[]>([]);
	let onboardingStep = $state<1 | 2 | 3>(1);
	// Local "just finished" override so the wizard hides immediately on
	// click instead of waiting for Dexie's liveQuery to debounce + emit
	// the new prefs.onboardingCompleted = true. Without this, the user
	// clicks "Fertig", the write goes through, but the UI re-renders
	// the same wizard step until the next liveQuery tick (~50-100ms),
	// so people instinctively click again before noticing the change.
	let onboardingJustFinished = $state(false);
	let onboardingSubmitting = $state(false);

	function toggleTopic(t: Topic) {
		pickedTopics = pickedTopics.includes(t)
			? pickedTopics.filter((x) => x !== t)
			: [...pickedTopics, t];
	}
	function toggleLang(l: Language) {
		pickedLanguages = pickedLanguages.includes(l)
			? pickedLanguages.filter((x) => x !== l)
			: [...pickedLanguages, l];
	}
	function toggleBlocked(slug: string) {
		pickedBlocked = pickedBlocked.includes(slug)
			? pickedBlocked.filter((x) => x !== slug)
			: [...pickedBlocked, slug];
	}

	async function finishOnboarding() {
		if (onboardingSubmitting) return;
		onboardingSubmitting = true;
		try {
			// $state.snapshot strips the Svelte 5 reactive proxies — without it
			// the arrays travel into Dexie hooks as proxies and trip
			// DataCloneError on the structured-clone into _pendingChanges.
			const topicsSnap = $state.snapshot(pickedTopics) as Topic[];
			const langsSnap = $state.snapshot(pickedLanguages) as Language[];
			const blockedSnap = $state.snapshot(pickedBlocked) as string[];

			await preferencesStore.completeOnboarding({
				topics: topicsSnap,
				languages: langsSnap,
				blockedSources: blockedSnap,
			});

			// Flip to the feed branch immediately. Without this we'd be at
			// the mercy of Dexie's liveQuery debounce — the prefs read
			// behind `prefs.onboardingCompleted` only updates a few ticks
			// after the write, so the wizard would re-render the same
			// step for ~50-100ms and the user would click "Fertig" twice.
			onboardingJustFinished = true;

			// Eagerly trigger the first feed pull instead of waiting for
			// the layout's $effect to notice the prefs change. The layout
			// effect WILL also fire shortly after, but its refresh is a
			// no-op via the store's inFlight guard.
			void feedCacheStore.refresh({
				topics: topicsSnap,
				lang: langsSnap.length === 1 ? langsSnap[0] : 'all',
			});
		} finally {
			onboardingSubmitting = false;
		}
	}

	// ─── Feed branch ──────────────────────────────────────────
	const { dismissedIds, interestedIds } = $derived(buildReactionSets(reactions));
	// Treat the local "just finished" override as fully onboarded so the
	// feed renders immediately after the user clicks Fertig, before the
	// liveQuery has had a chance to refresh prefs.
	const isOnboarded = $derived(prefs.onboardingCompleted || onboardingJustFinished);
	const ranked = $derived(
		isOnboarded ? rankFeed(pool, { prefs, dismissedIds, interestedIds }) : []
	);

	async function react(
		article: LocalCachedArticle,
		kind: 'interested' | 'not_interested' | 'source_blocked'
	) {
		await reactionsStore.react({
			articleId: article.id,
			reaction: kind,
			topic: article.topic,
			sourceSlug: article.sourceSlug,
		});
		// "Interessiert" is the implicit save — copy into reading list.
		if (kind === 'interested') {
			await articlesStore.saveFromCurated(article);
		}
	}

	function openReader(article: LocalCachedArticle) {
		// We pass the curated id; the reader pulls the row from the
		// cached feed table itself (no prop drilling).
		goto(`/news/${article.id}`);
	}

	async function manualRefresh() {
		await feedCacheStore.refresh({
			topics: prefs.selectedTopics,
			lang: prefs.preferredLanguages.length === 1 ? prefs.preferredLanguages[0] : 'all',
		});
	}
</script>

<svelte:head>
	<title>News — Mana</title>
</svelte:head>

<div class="news-page">
	{#if !isOnboarded}
		<!-- ─── Onboarding ───────────────────────────────────── -->
		<header class="hero">
			<h1>Willkommen beim News Hub</h1>
			<p>In drei Schritten baust du dir deinen persönlichen Newsfeed.</p>
		</header>

		<div class="steps">
			<span class="step" class:active={onboardingStep === 1}>1. Themen</span>
			<span class="step" class:active={onboardingStep === 2}>2. Sprache</span>
			<span class="step" class:active={onboardingStep === 3}>3. Quellen</span>
		</div>

		{#if onboardingStep === 1}
			<section class="step-panel">
				<h2>Was interessiert dich?</h2>
				<p class="hint">Wähle mindestens zwei Themen.</p>
				<div class="topic-grid">
					{#each ALL_TOPICS as topic}
						<button
							type="button"
							class="topic-pill"
							class:selected={pickedTopics.includes(topic)}
							onclick={() => toggleTopic(topic)}
						>
							<span class="topic-emoji">{TOPIC_LABELS[topic].emoji}</span>
							<span>{TOPIC_LABELS[topic].de}</span>
						</button>
					{/each}
				</div>
				<div class="actions">
					<button
						type="button"
						class="btn-primary"
						disabled={pickedTopics.length < 2}
						onclick={() => (onboardingStep = 2)}
					>
						Weiter
					</button>
				</div>
			</section>
		{:else if onboardingStep === 2}
			<section class="step-panel">
				<h2>In welchen Sprachen liest du?</h2>
				<div class="lang-row">
					<button
						type="button"
						class="lang-pill"
						class:selected={pickedLanguages.includes('de')}
						onclick={() => toggleLang('de')}
					>
						🇩🇪 Deutsch
					</button>
					<button
						type="button"
						class="lang-pill"
						class:selected={pickedLanguages.includes('en')}
						onclick={() => toggleLang('en')}
					>
						🇬🇧 English
					</button>
				</div>
				<div class="actions">
					<button type="button" class="btn-secondary" onclick={() => (onboardingStep = 1)}>
						Zurück
					</button>
					<button
						type="button"
						class="btn-primary"
						disabled={pickedLanguages.length === 0}
						onclick={() => (onboardingStep = 3)}
					>
						Weiter
					</button>
				</div>
			</section>
		{:else}
			<section class="step-panel">
				<h2>Quellen aus deinen Themen</h2>
				<p class="hint">
					Tippe eine Quelle an um sie auszublenden. Du kannst das jederzeit ändern.
				</p>
				<div class="sources-list">
					{#each pickedTopics as topic}
						<div class="topic-block">
							<h3>
								{TOPIC_LABELS[topic].emoji}
								{TOPIC_LABELS[topic].de}
							</h3>
							<div class="source-row">
								{#each sourcesForTopic(topic) as src}
									<button
										type="button"
										class="source-chip"
										class:blocked={pickedBlocked.includes(src.slug)}
										onclick={() => toggleBlocked(src.slug)}
									>
										{src.name}
										<span class="lang">·{src.language}</span>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<div class="actions">
					<button type="button" class="btn-secondary" onclick={() => (onboardingStep = 2)}>
						Zurück
					</button>
					<button
						type="button"
						class="btn-primary"
						onclick={finishOnboarding}
						disabled={onboardingSubmitting}
					>
						{onboardingSubmitting ? 'Speichere…' : 'Fertig'}
					</button>
				</div>
			</section>
		{/if}
	{:else}
		<!-- ─── Feed ─────────────────────────────────────────── -->
		<header class="feed-header">
			<div>
				<h1>News</h1>
				<div class="meta">
					{ranked.length} Artikel
					{#if feedCacheStore.lastError}
						· <span class="error">Fehler beim Laden</span>
					{/if}
				</div>
			</div>
			<div class="header-actions">
				<button
					type="button"
					class="icon-btn"
					onclick={manualRefresh}
					disabled={feedCacheStore.inFlight}
					title="Neu laden"
				>
					{feedCacheStore.inFlight ? '…' : '↻'}
				</button>
				<a class="icon-btn" href="/news/saved" title="Gespeichert">📑</a>
				<a class="icon-btn" href="/news/preferences" title="Einstellungen">⚙</a>
			</div>
		</header>

		<!-- Topic filter strip -->
		<div class="topic-strip">
			{#each prefs.selectedTopics as topic}
				<span class="topic-tag">
					{TOPIC_LABELS[topic].emoji}
					{TOPIC_LABELS[topic].de}
				</span>
			{/each}
		</div>

		{#if ranked.length === 0}
			<div class="empty">
				{#if pool.length === 0}
					<p>Lade Artikel…</p>
				{:else}
					<p>Keine neuen Artikel zu deinen Themen.</p>
					<p class="hint">Probiere "↻" oder erweitere deine Themen.</p>
				{/if}
			</div>
		{:else}
			<div class="card-grid">
				{#each ranked as { article } (article.id)}
					{@const isSaved = interestedIds.has(article.id)}
					<article class="card">
						{#if article.imageUrl}
							<button
								type="button"
								class="card-image-btn"
								onclick={() => openReader(article)}
								aria-label="Artikel öffnen"
							>
								<img src={article.imageUrl} alt="" loading="lazy" />
							</button>
						{/if}
						<div class="card-body" class:is-saved={isSaved}>
							<div class="card-meta">
								<span class="source">{article.siteName}</span>
								<span class="dot">·</span>
								<span>{formatRelativeTime(article.publishedAt)}</span>
								{#if article.readingTimeMinutes}
									<span class="dot">·</span>
									<span>{article.readingTimeMinutes} min</span>
								{/if}
								{#if isSaved}
									<span class="saved-badge" title="In deiner Leseliste">❤️ gespeichert</span>
								{/if}
							</div>
							<button type="button" class="card-title-btn" onclick={() => openReader(article)}>
								{article.title}
							</button>
							{#if article.excerpt}
								<p class="card-excerpt">{article.excerpt}</p>
							{/if}
							<div class="card-actions">
								<button
									type="button"
									class="reaction-btn interested"
									class:active={isSaved}
									onclick={() => react(article, 'interested')}
									title={isSaved
										? 'Schon gespeichert — nochmal klicken bestätigt nur'
										: 'In Leseliste speichern + mehr davon zeigen'}
									disabled={isSaved}
								>
									❤️ {isSaved ? 'Gespeichert' : 'Interessiert'}
								</button>
								<button
									type="button"
									class="reaction-btn not-interested"
									onclick={() => react(article, 'not_interested')}
									title="Weniger davon"
								>
									👎 Nicht für mich
								</button>
								<button
									type="button"
									class="reaction-btn block"
									onclick={() => react(article, 'source_blocked')}
									title="Quelle ausblenden"
								>
									🚫 {article.siteName}
								</button>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.news-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 0 1rem 4rem;
		max-width: 920px;
		margin: 0 auto;
	}

	/* ─── Onboarding ─── */
	.hero {
		text-align: center;
		padding: 1.5rem 0 0.5rem;
	}
	.hero h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}
	.hero p {
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.5rem;
	}
	.steps {
		display: flex;
		justify-content: center;
		gap: 1rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.step {
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
	}
	.step.active {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-weight: 600;
	}

	.step-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
	}
	.step-panel h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.step-panel h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.hint {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.topic-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}
	.topic-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.topic-pill:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}
	.topic-pill.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}
	.topic-emoji {
		font-size: 1.25rem;
	}

	.lang-row {
		display: flex;
		gap: 0.75rem;
	}
	.lang-pill {
		flex: 1;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		cursor: pointer;
	}
	.lang-pill.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.sources-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 50vh;
		overflow-y: auto;
	}
	.topic-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.source-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.source-chip {
		padding: 0.375rem 0.625rem;
		border-radius: 999px;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.source-chip .lang {
		opacity: 0.55;
		margin-left: 0.25rem;
	}
	.source-chip.blocked {
		opacity: 0.4;
		text-decoration: line-through;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.btn-primary,
	.btn-secondary {
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}
	.btn-primary {
		background: hsl(var(--color-primary));
		color: white;
	}
	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-secondary {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: 1px solid hsl(var(--color-border));
	}

	/* ─── Feed ─── */
	.feed-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}
	.feed-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}
	.meta {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}
	.meta .error {
		color: hsl(var(--color-destructive));
	}
	.header-actions {
		display: flex;
		gap: 0.5rem;
	}
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		cursor: pointer;
		text-decoration: none;
	}
	.icon-btn:hover {
		filter: brightness(1.1);
	}
	.icon-btn:disabled {
		opacity: 0.5;
	}

	.topic-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.topic-tag {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}

	.empty {
		text-align: center;
		padding: 3rem 0;
		color: hsl(var(--color-muted-foreground));
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		overflow: hidden;
		transition: transform 0.15s;
	}
	.card:hover {
		transform: translateY(-2px);
	}

	.card-image-btn {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: hsl(var(--color-background));
		border: none;
		padding: 0;
		cursor: pointer;
		overflow: hidden;
	}
	.card-image-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem 1rem 1rem;
	}
	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.card-meta .source {
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.card-meta .dot {
		opacity: 0.6;
	}
	.card-title-btn {
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.35;
		color: hsl(var(--color-foreground));
	}
	.card-title-btn:hover {
		color: hsl(var(--color-primary));
	}
	.card-excerpt {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}
	.reaction-btn {
		font-size: 0.75rem;
		padding: 0.375rem 0.625rem;
		border-radius: 999px;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		cursor: pointer;
	}
	.reaction-btn:hover {
		filter: brightness(1.1);
	}
	.reaction-btn.interested:hover {
		border-color: hsl(var(--color-primary));
	}
	.reaction-btn.interested.active {
		background: hsl(var(--color-primary) / 0.18);
		border-color: hsl(var(--color-primary) / 0.5);
		color: hsl(var(--color-primary));
		cursor: default;
		opacity: 0.85;
	}
	.reaction-btn.interested.active:hover {
		filter: none;
	}
	.saved-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-size: 0.6875rem;
		font-weight: 600;
		margin-left: auto;
	}
	.card-body.is-saved {
		/* Subtle visual cue that this article is in the reading list,
		 * but still readable as a feed card. */
		background: hsl(var(--color-primary) / 0.04);
	}
</style>
