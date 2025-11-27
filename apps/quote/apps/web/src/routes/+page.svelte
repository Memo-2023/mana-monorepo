<script lang="ts">
	import { quotesDE, authorsDE, getRandomQuote } from '@quote/shared';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	// Get a random quote for the homepage
	const randomQuote = getRandomQuote(quotesDE);
	const quote = randomQuote
		? {
				...randomQuote,
				author: authorsDE.find((a) => a.id === randomQuote.authorId),
				isFavorite: false,
			}
		: null;

	let favorites = $state<Set<string>>(new Set());

	// Load favorites from localStorage
	if (typeof window !== 'undefined') {
		const savedFavorites = localStorage.getItem('favorites');
		if (savedFavorites) {
			favorites = new Set(JSON.parse(savedFavorites));
		}
	}

	function handleToggleFavorite(event: CustomEvent) {
		const { quoteId } = event.detail;
		if (favorites.has(quoteId)) {
			favorites.delete(quoteId);
		} else {
			favorites.add(quoteId);
		}
		favorites = new Set(favorites);

		// Save to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('favorites', JSON.stringify([...favorites]));
		}
	}

	function handleAuthorClick(event: CustomEvent) {
		const { authorId } = event.detail;
		if (authorId) {
			window.location.href = `/authors/${authorId}`;
		}
	}
</script>

<svelte:head>
	<title>Quotes Web App - Home</title>
	<meta name="description" content="Discover inspiring quotes from great thinkers" />
</svelte:head>

<div class="home">
	{#if quote}
		<QuoteCard
			{quote}
			variant="daily"
			on:toggleFavorite={handleToggleFavorite}
			on:authorClick={handleAuthorClick}
		/>
	{/if}
</div>

<style>
	.home {
		width: 100%;
		max-width: 600px;
		padding: var(--spacing-xl);
	}

	@media (max-width: 768px) {
		.home {
			max-width: 100%;
			padding: var(--spacing-lg);
		}
	}
</style>
