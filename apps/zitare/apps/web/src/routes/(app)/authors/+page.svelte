<script lang="ts">
	import { authorsDE, quotesDE } from '@zitare/shared';
	import type { Author } from '@zitare/shared';
	import { PageHeader } from '@manacore/shared-ui';
	import AuthorCard from '$lib/components/AuthorCard.svelte';

	// Get quote counts for each author
	const authorsWithQuotes = authorsDE
		.map((author) => {
			const quoteCount = quotesDE.filter((q) => q.authorId === author.id).length;
			return { ...author, quoteCount };
		})
		.sort((a, b) => b.quoteCount - a.quoteCount);

	let searchTerm = $state('');
	let favorites = $state<Set<string>>(new Set());
	let isSearchOpen = $state(false);

	// Pagination state
	const ITEMS_PER_PAGE = 20;
	let currentPage = $state(1);
	let isLoadingMore = $state(false);

	// Load favorites from localStorage
	if (typeof window !== 'undefined') {
		const savedFavorites = localStorage.getItem('authorFavorites');
		if (savedFavorites) {
			favorites = new Set(JSON.parse(savedFavorites));
		}
	}

	// Filter authors by search term (all matching authors)
	let allFilteredAuthors = $derived(
		authorsWithQuotes
			.map((author) => ({
				...author,
				isFavorite: favorites.has(author.id),
			}))
			.filter(
				(author) =>
					author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					author.profession?.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
			)
	);

	// Paginated authors (only show what should be visible)
	let filteredAuthors = $derived(allFilteredAuthors.slice(0, currentPage * ITEMS_PER_PAGE));

	// Check if there are more items to load
	let hasMore = $derived(filteredAuthors.length < allFilteredAuthors.length);

	function toggleSearch() {
		isSearchOpen = !isSearchOpen;
		if (!isSearchOpen) {
			searchTerm = '';
			currentPage = 1;
		}
	}

	function loadMore() {
		isLoadingMore = true;
		setTimeout(() => {
			currentPage++;
			isLoadingMore = false;
		}, 300);
	}

	// Reset page when search changes
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	function handleToggleFavorite(event: CustomEvent) {
		const { authorId } = event.detail;
		if (favorites.has(authorId)) {
			favorites.delete(authorId);
		} else {
			favorites.add(authorId);
		}
		favorites = new Set(favorites);

		// Save to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('authorFavorites', JSON.stringify([...favorites]));
		}
	}

	function handleAuthorClick(event: CustomEvent) {
		const { author } = event.detail;
		window.location.href = `/authors/${author.id}`;
	}
</script>

<svelte:head>
	<title>Autoren - Zitare</title>
	<meta name="description" content="Durchsuche alle Autoren und ihre Zitate" />
</svelte:head>

<div class="authors-page">
	<div class="header-container">
		<PageHeader title="Autoren" size="lg">
			{#snippet actions()}
				<button class="search-fab" onclick={toggleSearch} aria-label="Toggle search">
					<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{#if isSearchOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						{/if}
					</svg>
				</button>
			{/snippet}
		</PageHeader>

		{#if isSearchOpen}
			<div class="search-bar">
				<input type="text" placeholder="Search authors..." bind:value={searchTerm} class="search" />
			</div>
		{/if}
	</div>

	{#if allFilteredAuthors.length === 0 && searchTerm}
		<!-- Empty Search Results -->
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
			<h3>Keine Autoren gefunden</h3>
			<p>Versuche es mit anderen Suchbegriffen</p>
		</div>
	{:else}
		<div class="authors-grid">
			{#each filteredAuthors as author (author.id)}
				<AuthorCard
					{author}
					isFavorite={author.isFavorite}
					on:click={handleAuthorClick}
					on:toggleFavorite={handleToggleFavorite}
				/>
			{/each}
		</div>

		<!-- Load More Button -->
		{#if hasMore}
			<div class="load-more-container">
				<button class="load-more-btn" onclick={loadMore} disabled={isLoadingMore}>
					{#if isLoadingMore}
						<svg
							class="spinner"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<circle cx="12" cy="12" r="10" stroke-width="3" stroke-opacity="0.25"></circle>
							<path d="M12 2a10 10 0 0 1 10 10" stroke-width="3" stroke-linecap="round"></path>
						</svg>
						Laden...
					{:else}
						Mehr laden ({allFilteredAuthors.length - filteredAuthors.length} weitere)
					{/if}
				</button>
			</div>
		{/if}
	{/if}

	{#if isSearchOpen}
		<div class="floating-results">
			{allFilteredAuthors.length} von {authorsDE.length} Autoren
			{#if filteredAuthors.length < allFilteredAuthors.length}
				• {filteredAuthors.length} angezeigt
			{/if}
		</div>
	{/if}
</div>

<style>
	.authors-page {
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
		padding-bottom: var(--spacing-2xl);
	}

	.header-container {
		max-width: 700px;
		margin: 0 auto var(--spacing-xl);
	}

	.search-fab {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 9999px;
		background: rgb(var(--color-primary));
		color: white;
		border: none;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-md);
	}

	.search-fab:hover {
		transform: scale(1.05);
		box-shadow: var(--shadow-lg);
	}

	.search-fab:active {
		transform: scale(0.95);
	}

	.search-bar {
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background: rgb(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid rgb(var(--color-border));
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.search {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: rgb(var(--color-background));
		color: rgb(var(--color-text-primary));
		transition: border-color var(--transition-fast);
	}

	.search:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.authors-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		max-width: 700px;
		margin: 0 auto;
	}

	.floating-results {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		padding: var(--spacing-sm) var(--spacing-lg);
		background: rgba(var(--color-surface), 0.95);
		backdrop-filter: blur(10px);
		border-radius: var(--radius-full);
		border: 1px solid rgba(var(--color-border), 0.5);
		box-shadow: var(--shadow-lg);
		color: rgb(var(--color-text-secondary));
		font-size: 0.875rem;
		font-weight: 500;
		z-index: 20;
		animation: fadeInUp 0.3s ease;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translate(-50%, 10px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	/* Empty State */
	.empty-state {
		max-width: 500px;
		margin: var(--spacing-2xl) auto;
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

	/* Load More Button */
	.load-more-container {
		max-width: 700px;
		margin: var(--spacing-xl) auto 0;
		text-align: center;
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

	.load-more-btn:hover:not(:disabled) {
		background: rgb(var(--color-primary));
		color: white;
		border-color: rgb(var(--color-primary));
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.load-more-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.authors-page {
			padding-bottom: var(--spacing-xl);
		}

		.header-container {
			max-width: 100%;
			margin-bottom: var(--spacing-lg);
		}

		.search-fab {
			width: 2.5rem;
			height: 2.5rem;
		}

		.search-bar {
			padding: var(--spacing-sm);
		}

		.authors-grid {
			gap: var(--spacing-lg);
			max-width: 100%;
		}

		.floating-results {
			bottom: 5rem; /* Above mobile bottom nav */
			font-size: 0.8125rem;
			padding: var(--spacing-xs) var(--spacing-md);
		}

		.empty-state {
			padding: var(--spacing-xl);
		}

		.empty-state h3 {
			font-size: 1.25rem;
		}

		.empty-state p {
			font-size: 0.9375rem;
		}
	}
</style>
