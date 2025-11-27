<script lang="ts">
	import type { BlogPostWithMeta } from '../../../content/config';

	let { posts = [] } = $props<{ posts?: BlogPostWithMeta[] }>();

	let formattedPosts = $derived(
		posts.slice(0, 3).map((post) => ({
			...post,
			formattedDate: new Date(post.date).toLocaleDateString('de-DE', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
		}))
	);
</script>

<section class="bg-theme-surface py-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold text-theme-text">Insights & Wissen</h2>
			<p class="mx-auto max-w-2xl text-lg text-theme-text-muted">
				Entdecken Sie Artikel über URL-Psychologie, Marketing-Strategien und Best Practices für
				erfolgreiches Link-Management.
			</p>
		</div>

		{#if formattedPosts.length > 0}
			<div class="mb-8 grid gap-8 md:grid-cols-3">
				{#each formattedPosts as post}
					<article
						class="overflow-hidden rounded-lg bg-theme-background shadow-md transition-shadow hover:shadow-lg"
					>
						{#if post.image}
							<img
								src={post.image}
								alt={post.title}
								class="h-48 w-full object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
						{/if}

						<div class="p-6">
							<div class="mb-3 flex items-center gap-2">
								<span class="text-xs text-theme-text-muted">
									{post.formattedDate}
								</span>
								<span class="text-xs text-theme-text-muted">•</span>
								<span class="text-xs text-blue-600">
									{post.category}
								</span>
							</div>

							<h3 class="mb-2 text-xl font-semibold text-theme-text">
								<a href="/blog/{post.slug}" class="transition hover:text-theme-primary">
									{post.title}
								</a>
							</h3>

							<p class="mb-4 line-clamp-2 text-theme-text-muted">
								{post.excerpt}
							</p>

							<a
								href="/blog/{post.slug}"
								class="inline-flex items-center gap-1 font-medium text-theme-primary hover:text-theme-primary-hover"
							>
								Weiterlesen
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</a>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="py-12 text-center">
				<p class="mb-4 text-theme-text-muted">
					Bald verfügbar: Spannende Artikel über URL-Optimierung und digitales Marketing.
				</p>
			</div>
		{/if}

		<div class="text-center">
			<a
				href="/blog"
				class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-6 py-3 text-white transition hover:bg-theme-primary-hover"
			>
				Alle Artikel ansehen
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7l5 5m0 0l-5 5m5-5H6"
					/>
				</svg>
			</a>
		</div>
	</div>
</section>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
