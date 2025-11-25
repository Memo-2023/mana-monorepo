<script lang="ts">
	import type { BlogPostWithMeta } from '../../../content/config';
	
	let { posts = [] } = $props<{ posts?: BlogPostWithMeta[] }>();
	
	let formattedPosts = $derived(
		posts.slice(0, 3).map(post => ({
			...post,
			formattedDate: new Date(post.date).toLocaleDateString('de-DE', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			})
		}))
	);
</script>

<section class="py-16 bg-theme-surface">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-theme-text mb-4">
				Insights & Wissen
			</h2>
			<p class="text-lg text-theme-text-muted max-w-2xl mx-auto">
				Entdecken Sie Artikel über URL-Psychologie, Marketing-Strategien und Best Practices für erfolgreiches Link-Management.
			</p>
		</div>
		
		{#if formattedPosts.length > 0}
			<div class="grid md:grid-cols-3 gap-8 mb-8">
				{#each formattedPosts as post}
					<article class="bg-theme-background rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
						{#if post.image}
							<img 
								src={post.image} 
								alt={post.title}
								class="w-full h-48 object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600"></div>
						{/if}
						
						<div class="p-6">
							<div class="flex items-center gap-2 mb-3">
								<span class="text-xs text-theme-text-muted">
									{post.formattedDate}
								</span>
								<span class="text-xs text-theme-text-muted">•</span>
								<span class="text-xs text-blue-600">
									{post.category}
								</span>
							</div>
							
							<h3 class="text-xl font-semibold text-theme-text mb-2">
								<a href="/blog/{post.slug}" class="hover:text-theme-primary transition">
									{post.title}
								</a>
							</h3>
							
							<p class="text-theme-text-muted mb-4 line-clamp-2">
								{post.excerpt}
							</p>
							
							<a 
								href="/blog/{post.slug}"
								class="text-theme-primary hover:text-theme-primary-hover font-medium inline-flex items-center gap-1"
							>
								Weiterlesen
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12">
				<p class="text-theme-text-muted mb-4">
					Bald verfügbar: Spannende Artikel über URL-Optimierung und digitales Marketing.
				</p>
			</div>
		{/if}
		
		<div class="text-center">
			<a 
				href="/blog"
				class="inline-flex items-center gap-2 px-6 py-3 bg-theme-primary text-white rounded-lg hover:bg-theme-primary-hover transition"
			>
				Alle Artikel ansehen
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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