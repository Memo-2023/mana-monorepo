<script lang="ts">
	import type { EnhancedQuote } from '@quote/shared';
	import { createEventDispatcher } from 'svelte';
	import { toast } from '$lib/stores/toast';

	interface Props {
		quote: EnhancedQuote;
		variant?: 'simple' | 'daily';
	}

	let { quote, variant = 'simple' }: Props = $props();

	const dispatch = createEventDispatcher();

	// Get gradient colors based on category
	function getCategoryGradient(category?: string): string {
		const gradients: Record<string, string> = {
			life: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			wisdom: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
			success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
			motivation: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
			love: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
			happiness: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
			philosophy: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
			courage: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
			creativity: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
			peace: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
		};

		if (category && gradients[category.toLowerCase()]) {
			return gradients[category.toLowerCase()];
		}

		// Default gradient
		return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
	}

	function handleCopy() {
		const text = `"${quote.text}" — ${quote.author?.name || 'Unknown'}`;
		navigator.clipboard.writeText(text);
		dispatch('copy', { quote });

		// Show feedback
		showCopyFeedback();
		toast.success('Zitat kopiert!');
	}

	function handleShare() {
		const text = `"${quote.text}" — ${quote.author?.name || 'Unknown'}`;

		if (navigator.share) {
			navigator
				.share({
					title: 'Quote',
					text: text,
				})
				.then(() => {
					toast.success('Zitat geteilt!');
				})
				.catch((error) => {
					// Only show error if user didn't cancel
					if (error.name !== 'AbortError') {
						// Fallback to copy
						handleCopy();
					}
				});
		} else {
			// Fallback to copy
			handleCopy();
		}

		dispatch('share', { quote });
	}

	function handleFavorite() {
		dispatch('toggleFavorite', { quoteId: quote.id });
	}

	function handleAuthorClick() {
		dispatch('authorClick', { authorId: quote.author?.id });
	}

	let showCopySuccess = $state(false);

	function showCopyFeedback() {
		showCopySuccess = true;
		setTimeout(() => {
			showCopySuccess = false;
		}, 2000);
	}

	const gradientStyle = getCategoryGradient(quote.categories?.[0]);
	const isDaily = variant === 'daily';
</script>

<article class="quote-card" class:daily={isDaily} style="background: {gradientStyle}">
	<div class="card-inner">
		<!-- Quote Text -->
		<blockquote class="quote-text">
			<p>"{quote.text}"</p>
		</blockquote>

		<!-- Source Info -->
		{#if !isDaily && quote.source}
			<p class="source-info">
				From: {quote.source}
				{#if quote.year}
					({quote.year})
				{/if}
			</p>
		{/if}

		<!-- Author Section -->
		<div class="author-section">
			<button class="author-info" onclick={handleAuthorClick} type="button">
				<div>
					<p class="author-name">
						{quote.author?.name || 'Unknown'}
					</p>
					{#if quote.author?.profession && quote.author.profession.length > 0}
						<p class="author-profession">
							{quote.author.profession[0]}
						</p>
					{/if}
				</div>
			</button>

			<!-- Action Buttons -->
			<div class="action-buttons">
				<!-- Copy Button -->
				<button
					class="action-btn"
					onclick={handleCopy}
					title="Copy quote"
					aria-label="Copy quote to clipboard"
				>
					{#if showCopySuccess}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
					{/if}
				</button>

				<!-- Share Button -->
				<button
					class="action-btn"
					onclick={handleShare}
					title="Share quote"
					aria-label="Share quote"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="18" cy="5" r="3"></circle>
						<circle cx="6" cy="12" r="3"></circle>
						<circle cx="18" cy="19" r="3"></circle>
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
					</svg>
				</button>

				<!-- Favorite Button -->
				<button
					class="action-btn favorite-btn"
					class:is-favorite={quote.isFavorite}
					onclick={handleFavorite}
					title={quote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
					aria-label={quote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
				>
					{#if quote.isFavorite}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
							/>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
							></path>
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
</article>

<style>
	.quote-card {
		position: relative;
		border-radius: var(--radius-xl);
		padding: 1px;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		transition:
			transform var(--transition-base),
			box-shadow var(--transition-base);
	}

	.quote-card.daily {
		border-radius: 32px;
	}

	.quote-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.card-inner {
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: calc(var(--radius-xl) - 1px);
		padding: var(--spacing-xl);
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.daily .card-inner {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 31px;
		padding: var(--spacing-lg);
	}

	.quote-text {
		margin: 0 0 var(--spacing-md) 0;
		padding: 0;
		text-align: center;
	}

	.quote-text p {
		font-family: Georgia, serif;
		font-size: 1.375rem;
		line-height: 2rem;
		color: white;
		font-weight: 300;
		letter-spacing: 0.3px;
		margin: 0;
	}

	.daily .quote-text p {
		font-size: 1.5rem;
		line-height: 2.125rem;
	}

	.source-info {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0 0 var(--spacing-md) 0;
		text-align: center;
	}

	.author-section {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: var(--spacing-md);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-md);
	}

	.daily .author-section {
		padding-top: var(--spacing-lg);
	}

	.author-info {
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.author-info:hover {
		opacity: 0.8;
	}

	.author-name {
		font-size: 1rem;
		font-weight: 500;
		color: white;
		margin: 0 0 2px 0;
	}

	.author-profession {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.action-btn {
		background: none;
		border: none;
		padding: var(--spacing-xs);
		cursor: pointer;
		color: rgba(255, 255, 255, 0.7);
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
	}

	.action-btn:hover {
		color: white;
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	.action-btn:active {
		transform: scale(0.95);
	}

	.favorite-btn.is-favorite {
		color: #ff6b9d;
	}

	.favorite-btn.is-favorite:hover {
		color: #ff4081;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.quote-text p {
			font-size: 1.125rem;
			line-height: 1.75rem;
		}

		.action-buttons {
			gap: var(--spacing-sm);
		}

		.action-btn svg {
			width: 20px;
			height: 20px;
		}
	}
</style>
