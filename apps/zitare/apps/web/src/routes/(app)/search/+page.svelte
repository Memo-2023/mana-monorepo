<script lang="ts">
	import { quotesDE, authorsDE } from '@zitare/shared';
	import type { Quote, Author } from '@zitare/shared';
	import QuoteCard from '$lib/components/QuoteCard.svelte';
	import AuthorCard from '$lib/components/AuthorCard.svelte';

	let searchTerm = $state('');
	let activeTab = $state<'all' | 'quotes' | 'authors'>('all');
	let favorites = $state<Set<string>>(new Set());
	let authorFavorites = $state<Set<string>>(new Set());

	// Pagination
	const ITEMS_PER_PAGE = 20;
	let currentPage = $state(1);

	// Load favorites from localStorage
	if (typeof window !== 'undefined') {
		const savedFavorites = localStorage.getItem('favorites');
		if (savedFavorites) {
			favorites = new Set(JSON.parse(savedFavorites));
		}
		const savedAuthorFavorites = localStorage.getItem('authorFavorites');
		if (savedAuthorFavorites) {
			authorFavorites = new Set(JSON.parse(savedAuthorFavorites));
		}
	}

	// Search results
	let filteredQuotes = $derived(
		searchTerm.length >= 2
			? quotesDE
					.filter(
						(q) =>
							q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
							authorsDE
								.find((a) => a.id === q.authorId)
								?.name.toLowerCase()
								.includes(searchTerm.toLowerCase())
					)
					.map((q) => ({
						...q,
						author: authorsDE.find((a) => a.id === q.authorId),
						isFavorite: favorites.has(q.id),
					}))
			: []
	);

	let filteredAuthors = $derived(
		searchTerm.length >= 2
			? authorsDE
					.filter(
						(a) =>
							a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
							a.profession?.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
					)
					.map((a) => ({
						...a,
						quoteCount: quotesDE.filter((q) => q.authorId === a.id).length,
						isFavorite: authorFavorites.has(a.id),
					}))
			: []
	);

	// Paginated results
	let displayedQuotes = $derived(filteredQuotes.slice(0, currentPage * ITEMS_PER_PAGE));
	let displayedAuthors = $derived(filteredAuthors.slice(0, currentPage * ITEMS_PER_PAGE));

	// Total results
	let totalResults = $derived(
		activeTab === 'quotes'
			? filteredQuotes.length
			: activeTab === 'authors'
				? filteredAuthors.length
				: filteredQuotes.length + filteredAuthors.length
	);

	let hasMoreQuotes = $derived(displayedQuotes.length < filteredQuotes.length);
	let hasMoreAuthors = $derived(displayedAuthors.length < filteredAuthors.length);

	// Reset page when search or tab changes
	$effect(() => {
		searchTerm;
		activeTab;
		currentPage = 1;
	});

	function loadMore() {
		currentPage++;
	}

	function handleToggleFavorite(event: CustomEvent) {
		const { quoteId } = event.detail;
		if (favorites.has(quoteId)) {
			favorites.delete(quoteId);
		} else {
			favorites.add(quoteId);
		}
		favorites = new Set(favorites);
		if (typeof window !== 'undefined') {
			localStorage.setItem('favorites', JSON.stringify([...favorites]));
		}
	}

	function handleAuthorToggleFavorite(event: CustomEvent) {
		const { authorId } = event.detail;
		if (authorFavorites.has(authorId)) {
			authorFavorites.delete(authorId);
		} else {
			authorFavorites.add(authorId);
		}
		authorFavorites = new Set(authorFavorites);
		if (typeof window !== 'undefined') {
			localStorage.setItem('authorFavorites', JSON.stringify([...authorFavorites]));
		}
	}

	function handleAuthorClick(event: CustomEvent) {
		const { author, authorId } = event.detail;
		const id = author?.id || authorId;
		if (id) {
			window.location.href = `/authors/${id}`;
		}
	}
</script>

<svelte:head>
	<title>Suche - Zitare</title>
	<meta name="description" content="Durchsuche Zitate und Autoren" />
</svelte:head>

<div class="search-page">
	<div class="search-header">
		<h2>Suche</h2>
		<div class="search-input-wrapper">
			<svg
				class="search-icon"
				width="20"
				height="20"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<!-- svelte-ignore a11y_autofocus - Intentional for search page UX -->
			<input
				type="text"
				placeholder="Zitate oder Autoren suchen..."
				bind:value={searchTerm}
				class="search-input"
				autofocus
			/>
			{#if searchTerm}
				<button class="clear-btn" onclick={() => (searchTerm = '')} aria-label="Clear search">
					<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	{#if searchTerm.length >= 2}
		<!-- Tabs -->
		<div class="tabs">
			<button class="tab" class:active={activeTab === 'all'} onclick={() => (activeTab = 'all')}>
				Alle ({filteredQuotes.length + filteredAuthors.length})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'quotes'}
				onclick={() => (activeTab = 'quotes')}
			>
				Zitate ({filteredQuotes.length})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'authors'}
				onclick={() => (activeTab = 'authors')}
			>
				Autoren ({filteredAuthors.length})
			</button>
		</div>

		{#if totalResults === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="64"
						height="64"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
					</svg>
				</div>
				<h3>Keine Ergebnisse</h3>
				<p>Versuche es mit anderen Suchbegriffen</p>
			</div>
		{:else}
			<!-- Results -->
			<div class="results">
				<!-- Quotes Section -->
				{#if (activeTab === 'all' || activeTab === 'quotes') && displayedQuotes.length > 0}
					{#if activeTab === 'all'}
						<h3 class="section-title">Zitate ({filteredQuotes.length})</h3>
					{/if}
					<div class="quotes-list">
						{#each displayedQuotes as quote (quote.id)}
							<QuoteCard
								{quote}
								on:toggleFavorite={handleToggleFavorite}
								on:authorClick={handleAuthorClick}
							/>
						{/each}
					</div>
					{#if activeTab === 'quotes' && hasMoreQuotes}
						<div class="load-more-container">
							<button class="load-more-btn" onclick={loadMore}>
								Mehr laden ({filteredQuotes.length - displayedQuotes.length} weitere)
							</button>
						</div>
					{/if}
				{/if}

				<!-- Authors Section -->
				{#if (activeTab === 'all' || activeTab === 'authors') && displayedAuthors.length > 0}
					{#if activeTab === 'all'}
						<h3 class="section-title">Autoren ({filteredAuthors.length})</h3>
					{/if}
					<div class="authors-list">
						{#each displayedAuthors as author (author.id)}
							<AuthorCard
								{author}
								isFavorite={author.isFavorite}
								on:click={handleAuthorClick}
								on:toggleFavorite={handleAuthorToggleFavorite}
							/>
						{/each}
					</div>
					{#if activeTab === 'authors' && hasMoreAuthors}
						<div class="load-more-container">
							<button class="load-more-btn" onclick={loadMore}>
								Mehr laden ({filteredAuthors.length - displayedAuthors.length} weitere)
							</button>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	{:else if searchTerm.length > 0}
		<div class="hint">
			<p>Bitte gib mindestens 2 Zeichen ein</p>
		</div>
	{:else}
		<div class="hint">
			<div class="hint-icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
			</div>
			<p>Suche nach Zitaten, Autoren oder Themen</p>
		</div>
	{/if}
</div>

<style>
	.search-page {
		max-width: 700px;
		margin: 0 auto;
		padding-bottom: var(--spacing-2xl);
	}

	.search-header {
		margin-bottom: var(--spacing-xl);
	}

	h2 {
		font-size: 2rem;
		margin: 0 0 var(--spacing-lg) 0;
		color: rgb(var(--color-text-primary));
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		color: rgb(var(--color-text-tertiary));
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 3rem;
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
		font-size: 1rem;
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
		transition: border-color var(--transition-fast);
	}

	.search-input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.clear-btn {
		position: absolute;
		right: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		background: transparent;
		color: rgb(var(--color-text-tertiary));
		cursor: pointer;
		border-radius: var(--radius-full);
		transition: all var(--transition-fast);
	}

	.clear-btn:hover {
		background: rgb(var(--color-border));
		color: rgb(var(--color-text-primary));
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-xl);
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.tabs::-webkit-scrollbar {
		display: none;
	}

	.tab {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-full);
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-secondary));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all var(--transition-fast);
	}

	.tab:hover {
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-text-primary));
	}

	.tab.active {
		background: rgb(var(--color-primary));
		border-color: rgb(var(--color-primary));
		color: white;
	}

	/* Results */
	.results {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.section-title {
		font-size: 1.25rem;
		color: rgb(var(--color-text-primary));
		margin: 0;
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.quotes-list,
	.authors-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: var(--spacing-2xl);
	}

	.empty-icon {
		margin: 0 auto var(--spacing-lg);
		color: rgb(var(--color-text-tertiary));
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-sm) 0;
	}

	.empty-state p {
		font-size: 1rem;
		color: rgb(var(--color-text-secondary));
		margin: 0;
	}

	/* Hint */
	.hint {
		text-align: center;
		padding: var(--spacing-2xl);
		color: rgb(var(--color-text-secondary));
	}

	.hint-icon {
		margin-bottom: var(--spacing-md);
		color: rgb(var(--color-text-tertiary));
		opacity: 0.5;
	}

	.hint p {
		margin: 0;
		font-size: 1rem;
	}

	/* Load More */
	.load-more-container {
		text-align: center;
		margin-top: var(--spacing-lg);
	}

	.load-more-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-2xl);
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-full);
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.load-more-btn:hover {
		background: rgb(var(--color-primary));
		color: white;
		border-color: rgb(var(--color-primary));
	}

	@media (max-width: 768px) {
		.search-page {
			padding-bottom: var(--spacing-xl);
		}

		h2 {
			font-size: 1.5rem;
		}

		.search-input {
			padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 2.5rem;
		}

		.tabs {
			margin-bottom: var(--spacing-lg);
		}

		.tab {
			padding: var(--spacing-xs) var(--spacing-md);
			font-size: 0.8125rem;
		}
	}
</style>
