<script lang="ts">
	import type { BlogPostWithMeta } from '../../../content/config';

	// Svelte 5: Props mit $props()
	let {
		post,
		featured = false,
		viewMode = 'cards',
	} = $props<{
		post: BlogPostWithMeta;
		featured?: boolean;
		viewMode?: 'cards' | 'list';
	}>();

	// Svelte 5: $state für Hover-State
	let isHovered = $state(false);

	// Svelte 5: $derived für berechnete Werte
	let formattedDate = $derived(
		new Date(post.date).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	);

	let readingTimeText = $derived(`${post.readingTime} Min. Lesezeit`);

	let cardClasses = $derived(() => {
		if (viewMode === 'list') {
			return 'flex gap-4 p-4';
		}
		return 'flex flex-col h-full';
	});
</script>

<article
	class="group relative overflow-hidden rounded-xl border border-theme-border bg-theme-surface transition-all hover:border-theme-accent hover:shadow-lg {cardClasses()} {featured
		? 'ring-2 ring-theme-primary'
		: ''}"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	{#if post.image && viewMode === 'cards'}
		<div
			class="from-theme-primary/5 to-theme-accent/5 relative h-48 w-full overflow-hidden bg-gradient-to-br"
		>
			<img
				src={post.image}
				alt={post.title}
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				loading="lazy"
			/>
			{#if featured}
				<div class="absolute left-3 top-3">
					<span
						class="inline-flex items-center rounded-full bg-theme-primary px-3 py-1 text-xs font-semibold text-white shadow-lg"
					>
						Featured
					</span>
				</div>
			{/if}
		</div>
	{/if}

	{#if post.image && viewMode === 'list'}
		<div
			class="from-theme-primary/5 to-theme-accent/5 relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br"
		>
			<img src={post.image} alt={post.title} class="h-full w-full object-cover" loading="lazy" />
			{#if featured}
				<div class="absolute left-2 top-2">
					<span
						class="inline-flex items-center rounded-full bg-theme-primary px-2 py-0.5 text-xs font-semibold text-white"
					>
						Featured
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<div class="flex flex-1 flex-col p-6">
		{#if featured && !post.image}
			<span
				class="bg-theme-primary/10 mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-theme-primary"
			>
				Featured
			</span>
		{/if}

		<h3 class="mb-2 line-clamp-2 text-lg font-semibold text-theme-text">
			<a href="/blog/{post.slug}" class="transition-colors hover:text-theme-primary">
				{post.title}
			</a>
		</h3>

		<p class="mb-4 line-clamp-2 text-sm text-theme-text-muted">
			{post.excerpt}
		</p>

		<div class="mt-auto flex items-center justify-between text-xs text-theme-text-muted">
			<time datetime={post.date.toISOString()}>
				{formattedDate}
			</time>
			<span class="flex items-center gap-1">
				<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				{readingTimeText}
			</span>
		</div>

		{#if post.tags.length > 0}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#each post.tags.slice(0, 3) as tag}
					<a
						href="/blog?tag={tag}"
						class="inline-flex items-center rounded-full border border-theme-border bg-theme-background px-2 py-0.5 text-xs text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
					>
						#{tag}
					</a>
				{/each}
				{#if post.tags.length > 3}
					<span class="inline-flex items-center px-2 py-0.5 text-xs text-theme-text-muted">
						+{post.tags.length - 3}
					</span>
				{/if}
			</div>
		{/if}
	</div>
</article>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
