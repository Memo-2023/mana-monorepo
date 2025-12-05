<script lang="ts">
	import { page } from '$app/stores';
	import { authorsDE, quotesDE } from '@zitare/shared';
	import QuoteCard from '$lib/components/QuoteCard.svelte';
	import { onMount } from 'svelte';

	let authorId = $derived($page.params.id);
	let author = $derived(authorsDE.find((a) => a.id === authorId));

	// State variables
	let activeTab = $state<'quotes' | 'bio'>('quotes');
	let isFavorite = $state(false);
	let quoteFavorites = $state<Set<string>>(new Set());

	// Get all quotes for this author (without favorites initially)
	let authorQuotes = $state<any[]>([]);

	// Update quotes when author changes
	$effect(() => {
		if (authorId) {
			const quotes = quotesDE.filter((q) => q.authorId === authorId);
			authorQuotes = quotes.map((q) => ({
				...q,
				author,
				isFavorite: quoteFavorites.has(q.id),
			}));
		}
	});

	// Load favorites from localStorage
	onMount(() => {
		const savedAuthorFavorites = localStorage.getItem('authorFavorites');
		if (savedAuthorFavorites && author) {
			const favorites = new Set<string>(JSON.parse(savedAuthorFavorites));
			isFavorite = favorites.has(author.id);
		}

		const savedQuoteFavorites = localStorage.getItem('favorites');
		if (savedQuoteFavorites) {
			quoteFavorites = new Set(JSON.parse(savedQuoteFavorites));
		}
	});

	function getLifeYears(): string | null {
		if (!author || !author.lifespan) return null;

		const birth = author.lifespan.birth?.substring(0, 4);
		const death = author.lifespan.death?.substring(0, 4);

		if (birth && death) {
			const birthYear = parseInt(birth);
			const deathYear = parseInt(death);
			const age = deathYear - birthYear;
			return `${birth} – ${death} (${age} Jahre)`;
		}
		if (birth) {
			const birthYear = parseInt(birth);
			const currentYear = new Date().getFullYear();
			const age = currentYear - birthYear;
			return `Geboren ${birth} (${age} Jahre)`;
		}
		return null;
	}

	function handleFavoriteToggle() {
		if (!author) return;

		isFavorite = !isFavorite;

		// Save to localStorage
		if (typeof window !== 'undefined') {
			const savedFavorites = localStorage.getItem('authorFavorites');
			const favorites = savedFavorites
				? new Set<string>(JSON.parse(savedFavorites))
				: new Set<string>();

			if (isFavorite) {
				favorites.add(author.id);
			} else {
				favorites.delete(author.id);
			}

			localStorage.setItem('authorFavorites', JSON.stringify([...favorites]));
		}
	}

	function handleQuoteFavoriteToggle(event: CustomEvent) {
		const { quoteId } = event.detail;
		if (quoteFavorites.has(quoteId)) {
			quoteFavorites.delete(quoteId);
		} else {
			quoteFavorites.add(quoteId);
		}
		quoteFavorites = new Set(quoteFavorites);

		// Save to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('favorites', JSON.stringify([...quoteFavorites]));
		}
	}
</script>

<svelte:head>
	<title>{author ? `${author.name} - Quotes Web App` : 'Author Not Found - Quotes Web App'}</title>
	<meta name="description" content={author ? `Quotes by ${author.name}` : 'Author not found'} />
</svelte:head>

{#if author}
	<div class="author-detail">
		<!-- Author Header -->
		<div class="author-header">
			<div class="author-avatar">
				{author.name.charAt(0)}
			</div>

			<h1 class="author-name">{author.name}</h1>

			{#if getLifeYears()}
				<p class="lifespan">{getLifeYears()}</p>
			{/if}

			<!-- Professions -->
			{#if author.profession && author.profession.length > 0}
				<div class="professions">
					{#each author.profession.slice(0, 2) as profession}
						<span class="profession-tag">{profession}</span>
					{/each}
					{#if author.profession.length > 2}
						<span class="profession-more">+{author.profession.length - 2}</span>
					{/if}
				</div>
			{/if}

			<!-- Favorite Button -->
			<button
				class="favorite-btn"
				class:is-favorite={isFavorite}
				onclick={handleFavoriteToggle}
				aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
			>
				{#if isFavorite}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="22"
						height="22"
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
						width="22"
						height="22"
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

			<!-- Stats -->
			<div class="stats">
				<div class="stat">
					<p class="stat-value">{authorQuotes.length}</p>
					<p class="stat-label">Zitate</p>
				</div>
			</div>
		</div>

		<!-- Tabs -->
		<div class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'quotes'}
				onclick={() => (activeTab = 'quotes')}
			>
				Zitate ({authorQuotes.length})
			</button>
			<button class="tab" class:active={activeTab === 'bio'} onclick={() => (activeTab = 'bio')}>
				Biografie
			</button>
		</div>

		<!-- Content -->
		<div class="content">
			{#if activeTab === 'quotes'}
				<!-- Quotes Tab -->
				<div class="quotes-list">
					{#if authorQuotes.length > 0}
						{#each authorQuotes as quote (quote.id)}
							<QuoteCard {quote} on:toggleFavorite={handleQuoteFavoriteToggle} />
						{/each}
					{:else}
						<div class="empty-state">
							<p>Keine Zitate verfügbar.</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Biography Tab -->
				<div class="biography">
					{#if author.biography?.long || author.biography?.short}
						<div class="bio-section">
							<p class="bio-text">{author.biography.long || author.biography.short}</p>
						</div>
					{/if}

					{#if author.biography?.sections && typeof author.biography.sections === 'object'}
						{#each Object.entries(author.biography.sections) as [key, section]}
							{#if section && typeof section === 'object' && 'title' in section && 'content' in section}
								<div class="bio-section">
									<h3 class="section-title">{section.title}</h3>
									<p class="bio-text">{section.content}</p>
								</div>
							{/if}
						{/each}
					{/if}

					{#if author.biography?.keyAchievements && author.biography.keyAchievements.length > 0}
						<div class="bio-section">
							<h3 class="section-title">Wichtige Errungenschaften</h3>
							<ul class="achievements">
								{#each author.biography.keyAchievements as achievement}
									<li>{achievement}</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if author.biography?.famousQuote}
						<div class="bio-section famous-quote">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
								opacity="0.4"
							>
								<path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
							</svg>
							<p class="quote-text">"{author.biography.famousQuote}"</p>
						</div>
					{/if}

					{#if !author.biography?.short && !author.biography?.long && !author.biography?.sections}
						<div class="empty-state">
							<p>Keine Biografie verfügbar.</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Back Link -->
		<div class="actions">
			<a href="/authors" class="back-link">← Zurück zu allen Autoren</a>
		</div>
	</div>
{:else}
	<div class="not-found">
		<h1>Author Not Found</h1>
		<p>The author you're looking for doesn't exist.</p>
		<a href="/authors">Back to all authors</a>
	</div>
{/if}

<style>
	.author-detail {
		max-width: 700px;
		margin: 0 auto;
		padding-bottom: var(--spacing-2xl);
	}

	/* Author Header */
	.author-header {
		text-align: center;
		padding: var(--spacing-2xl) 0;
		margin-bottom: var(--spacing-xl);
	}

	.author-avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			rgb(var(--color-primary)) 0%,
			rgb(var(--color-primary-dark)) 100%
		);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 3rem;
		font-weight: bold;
		margin: 0 auto var(--spacing-lg);
	}

	.author-name {
		font-size: 2rem;
		font-weight: bold;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-sm) 0;
	}

	.lifespan {
		color: rgb(var(--color-text-secondary));
		font-size: 1rem;
		margin: 0 0 var(--spacing-md) 0;
	}

	.professions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-md);
	}

	.profession-tag {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-secondary));
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		border: 1px solid rgb(var(--color-border));
	}

	.profession-more {
		align-self: center;
		font-size: 0.75rem;
		color: rgb(var(--color-text-tertiary));
	}

	.favorite-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-full);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.favorite-btn:hover {
		background: rgb(var(--color-surface-elevated));
		transform: scale(1.05);
	}

	.favorite-btn.is-favorite {
		color: #ef4444;
	}

	.stats {
		display: flex;
		justify-content: center;
		gap: var(--spacing-xl);
		margin-top: var(--spacing-lg);
	}

	.stat {
		text-align: center;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: bold;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-xs) 0;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		background: rgb(var(--color-surface));
		border-radius: var(--radius-xl);
		margin-bottom: var(--spacing-xl);
		border: 1px solid rgb(var(--color-border));
	}

	.tab {
		flex: 1;
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		border: none;
		border-radius: var(--radius-lg);
		color: rgb(var(--color-text-secondary));
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.tab:hover {
		background: rgba(var(--color-primary), 0.1);
		color: rgb(var(--color-text-primary));
	}

	.tab.active {
		background: rgb(var(--color-primary));
		color: white;
	}

	/* Content */
	.content {
		margin-bottom: var(--spacing-2xl);
	}

	.quotes-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.biography {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.bio-section {
		padding: var(--spacing-lg);
		background: rgb(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid rgb(var(--color-border));
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-md) 0;
	}

	.bio-text {
		line-height: 1.7;
		color: rgb(var(--color-text-primary));
		margin: 0;
	}

	.achievements {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.achievements li {
		padding-left: var(--spacing-lg);
		position: relative;
		margin-bottom: var(--spacing-sm);
		color: rgb(var(--color-text-primary));
	}

	.achievements li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: rgb(var(--color-text-secondary));
	}

	.famous-quote {
		font-style: italic;
	}

	.famous-quote svg {
		margin-bottom: var(--spacing-sm);
	}

	.quote-text {
		font-size: 1.125rem;
		line-height: 1.7;
		color: rgb(var(--color-text-primary));
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: var(--spacing-2xl) var(--spacing-md);
		color: rgb(var(--color-text-secondary));
	}

	.empty-state p {
		margin: 0;
	}

	/* Actions */
	.actions {
		padding-top: var(--spacing-xl);
		border-top: 1px solid rgb(var(--color-border));
	}

	.back-link {
		display: inline-block;
		color: rgb(var(--color-primary));
		text-decoration: none;
		font-weight: 500;
		transition: color var(--transition-fast);
	}

	.back-link:hover {
		color: rgb(var(--color-primary-dark));
	}

	.not-found {
		max-width: 600px;
		margin: 4rem auto;
		text-align: center;
	}

	.not-found h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: #333;
	}

	.not-found p {
		color: #666;
		margin-bottom: 2rem;
	}

	.not-found a {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: #667eea;
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-weight: 500;
		transition: background 0.2s;
	}

	.not-found a:hover {
		background: rgb(var(--color-primary-dark));
	}

	/* Responsive */
	@media (max-width: 768px) {
		.author-detail {
			padding-bottom: var(--spacing-xl);
		}

		.author-header {
			padding: var(--spacing-xl) 0;
		}

		.author-avatar {
			width: 100px;
			height: 100px;
			font-size: 2.5rem;
		}

		.author-name {
			font-size: 1.75rem;
		}

		.stats {
			flex-direction: row;
			gap: var(--spacing-lg);
		}

		.bio-section {
			padding: var(--spacing-md);
		}
	}
</style>
