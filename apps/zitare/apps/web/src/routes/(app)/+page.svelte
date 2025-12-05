<script lang="ts">
	import { onMount } from 'svelte';
	import { quotesDE, authorsDE, getRandomQuote } from '@zitare/shared';
	import QuoteCard from '$lib/components/QuoteCard.svelte';

	// Load multiple quotes for scrolling
	let quotes = $state<any[]>([]);
	let favorites = $state<Set<string>>(new Set());
	let containerRef = $state<HTMLElement | null>(null);

	function loadMoreQuotes(count = 5) {
		const newQuotes = [];
		for (let i = 0; i < count; i++) {
			const randomQuote = getRandomQuote(quotesDE);
			if (randomQuote) {
				newQuotes.push({
					...randomQuote,
					author: authorsDE.find((a) => a.id === randomQuote.authorId),
					isFavorite: favorites.has(randomQuote.id),
				});
			}
		}
		quotes = [...quotes, ...newQuotes];
	}

	// Load favorites from localStorage
	onMount(() => {
		const savedFavorites = localStorage.getItem('favorites');
		if (savedFavorites) {
			favorites = new Set(JSON.parse(savedFavorites));
		}
		// Initial load
		loadMoreQuotes(10);
	});

	function handleToggleFavorite(event: CustomEvent) {
		const { quoteId } = event.detail;
		if (favorites.has(quoteId)) {
			favorites.delete(quoteId);
		} else {
			favorites.add(quoteId);
		}
		favorites = new Set(favorites);

		// Update quote's favorite status
		quotes = quotes.map((q) =>
			q.id === quoteId ? { ...q, isFavorite: favorites.has(quoteId) } : q
		);

		// Save to localStorage
		localStorage.setItem('favorites', JSON.stringify([...favorites]));
	}

	function handleAuthorClick(event: CustomEvent) {
		const { authorId } = event.detail;
		if (authorId) {
			window.location.href = `/authors/${authorId}`;
		}
	}

	// Infinite scroll - load more when near bottom
	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
		if (scrollBottom < 500) {
			loadMoreQuotes(5);
		}
	}
</script>

<svelte:head>
	<title>Zitare - Inspirierende Zitate</title>
	<meta name="description" content="Entdecke inspirierende Zitate von großen Denkern" />
</svelte:head>

<div class="scroll-container" bind:this={containerRef} onscroll={handleScroll}>
	{#each quotes as quote, index (quote.id + '-' + index)}
		<div class="quote-slide">
			<QuoteCard
				{quote}
				variant="daily"
				on:toggleFavorite={handleToggleFavorite}
				on:authorClick={handleAuthorClick}
			/>
		</div>
	{/each}

	{#if quotes.length > 0}
		<div class="scroll-hint">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
			<span>Scrollen für mehr</span>
		</div>
	{/if}
</div>

<style>
	.scroll-container {
		height: 100%;
		flex: 1;
		overflow-y: auto;
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		padding-top: 100px; /* Space for floating nav */
	}

	.quote-slide {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}

	.quote-slide:first-child {
		padding-top: 0;
		min-height: calc(100vh - 100px);
	}

	.quote-slide :global(.quote-card) {
		width: 100%;
		max-width: 600px;
	}

	.scroll-hint {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-tertiary);
		font-size: 0.8125rem;
		pointer-events: none;
		opacity: 0.7;
	}

	.scroll-hint svg {
		animation: bounce-arrow 2s infinite;
	}

	@keyframes bounce-arrow {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(6px);
		}
		60% {
			transform: translateY(3px);
		}
	}

	@media (max-width: 768px) {
		.scroll-container {
			padding-top: 80px;
		}

		.quote-slide {
			padding: 1rem;
		}

		.quote-slide:first-child {
			min-height: calc(100vh - 80px);
		}

		.scroll-hint {
			bottom: 1.5rem;
		}
	}
</style>
