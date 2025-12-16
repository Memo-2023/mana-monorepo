<script lang="ts">
	import type { Author } from '@zitare/shared';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		author: Author & { quoteCount?: number };
		variant?: 'simple' | 'enhanced';
		isFavorite?: boolean;
	}

	let { author, variant = 'enhanced', isFavorite = false }: Props = $props();

	const dispatch = createEventDispatcher();

	// Get gradient colors based on profession
	function getGradientColors(author: Author): string {
		if (author.featured) {
			return 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'; // Amber to Red for featured
		}

		const profession = author.profession?.[0]?.toLowerCase() || '';

		if (profession.includes('philosoph')) {
			return 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)'; // Purple to Indigo
		} else if (profession.includes('dichter') || profession.includes('poet')) {
			return 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'; // Pink to Rose
		} else if (profession.includes('wissenschaft')) {
			return 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'; // Blue to Cyan
		} else if (profession.includes('schrift')) {
			return 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'; // Emerald to Teal
		}

		return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'; // Default: Indigo to Violet
	}

	function getLifeYears(): string | null {
		if (!author.lifespan) return null;

		const birth = author.lifespan.birth?.substring(0, 4);
		const death = author.lifespan.death?.substring(0, 4);

		if (birth && death) {
			return `${birth} – ${death}`;
		}
		if (birth) {
			return `Born ${birth}`;
		}
		return null;
	}

	function handleCopy() {
		const lifeYears = getLifeYears();
		const text = `${author.name}${lifeYears ? ` (${lifeYears})` : ''}\n${author.profession?.join(', ') || ''}`;
		navigator.clipboard.writeText(text);
		dispatch('copy', { author });
		showCopyFeedback();
	}

	function handleShare() {
		const lifeYears = getLifeYears();
		const authorInfo = `${author.name}${lifeYears ? ` (${lifeYears})` : ''}\n${author.profession?.join(', ') || ''}\n\n${author.biography?.short || ''}`;

		if (navigator.share) {
			navigator
				.share({
					title: author.name,
					text: authorInfo,
				})
				.catch(() => {
					handleCopy();
				});
		} else {
			handleCopy();
		}

		dispatch('share', { author });
	}

	function handleFavorite() {
		dispatch('toggleFavorite', { authorId: author.id });
	}

	function handleClick(e: MouseEvent) {
		// Only navigate if not clicking action buttons
		if (!(e.target as HTMLElement).closest('.action-btn')) {
			dispatch('click', { author });
		}
	}

	let showCopySuccess = $state(false);

	function showCopyFeedback() {
		showCopySuccess = true;
		setTimeout(() => {
			showCopySuccess = false;
		}, 2000);
	}

	const gradientStyle = getGradientColors(author);
	const lifeYears = getLifeYears();
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<article
	class="author-card"
	class:enhanced={variant === 'enhanced'}
	class:simple={variant === 'simple'}
	style="background: {gradientStyle}"
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick(e as any)}
>
	<div class="card-inner">
		<!-- Main Content -->
		<div class="author-header">
			<!-- Avatar -->
			<div class="author-avatar">
				{author.name.charAt(0)}
			</div>

			<!-- Author Info -->
			<div class="author-info">
				<h3 class="author-name">{author.name}</h3>

				{#if lifeYears}
					<p class="lifespan">{lifeYears}</p>
				{/if}
			</div>

			<!-- Arrow -->
			<div class="arrow">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="25"
					height="25"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</div>
		</div>

		<!-- Biography -->
		{#if author.biography?.short}
			<div class="bio-section">
				<p class="bio">{author.biography.short}</p>
			</div>
		{/if}

		<!-- Professions and Action Buttons -->
		<div class="footer-section">
			<!-- Professions -->
			<div class="professions">
				{#if author.profession && author.profession.length > 0}
					{#each author.profession.slice(0, 2) as profession}
						<span class="profession-tag">{profession}</span>
					{/each}
					{#if author.profession.length > 2}
						<span class="profession-more">+{author.profession.length - 2}</span>
					{/if}
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="action-buttons">
				<!-- Copy Button -->
				<button
					class="action-btn"
					onclick={(e) => {
						e.stopPropagation();
						handleCopy();
					}}
					title="Copy author info"
					aria-label="Copy author info to clipboard"
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
					onclick={(e) => {
						e.stopPropagation();
						handleShare();
					}}
					title="Share author"
					aria-label="Share author"
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
					class:is-favorite={isFavorite}
					onclick={(e) => {
						e.stopPropagation();
						handleFavorite();
					}}
					title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
					aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
				>
					{#if isFavorite}
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
	.author-card {
		position: relative;
		border-radius: 24px;
		padding: 1.5px;
		transition:
			transform var(--transition-base),
			box-shadow var(--transition-base);
		cursor: pointer;
	}

	.author-card:hover {
		transform: scale(0.98);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
	}

	.card-inner {
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: calc(24px - 1.5px);
		padding: var(--spacing-lg);
	}

	/* Author Header */
	.author-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.author-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.5rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.author-info {
		flex: 1;
		min-width: 0;
	}

	.author-name {
		margin: 0 0 4px 0;
		font-size: 1.125rem;
		font-weight: 500;
		color: white;
	}

	.lifespan {
		margin: 0;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.arrow {
		color: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	/* Bio Section */
	.bio-section {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-sm);
	}

	.bio {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.7);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Footer Section */
	.footer-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-top: var(--spacing-sm);
		gap: var(--spacing-md);
	}

	.professions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		flex: 1;
		min-width: 0;
	}

	.profession-tag {
		display: inline-block;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		opacity: 0.7;
		white-space: nowrap;
	}

	.profession-more {
		align-self: center;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
		flex-shrink: 0;
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
		.author-avatar {
			width: 48px;
			height: 48px;
			font-size: 1.25rem;
		}

		.author-name {
			font-size: 1rem;
		}

		.action-btn svg {
			width: 20px;
			height: 20px;
		}
	}
</style>
