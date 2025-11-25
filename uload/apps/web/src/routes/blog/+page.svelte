<script lang="ts">
	import type { PageData } from './$types';
	import type { BlogPostWithMeta } from '../../content/config';
	import BlogCard from '$lib/components/blog/BlogCard.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Search, ArrowUpDown } from 'lucide-svelte';
	
	// Svelte 5: Props mit $props()
	let { data }: { data: PageData } = $props();
	
	// Svelte 5: $state für alle reaktiven Variablen
	let selectedCategory = $state<string>('all');
	let selectedTag = $state<string | null>(null);
	let searchQuery = $state('');
	let sortBy = $state<'date' | 'readingTime' | 'category'>('date');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let viewMode = $state<'cards' | 'list' | 'stats'>('cards');
	
	// Svelte 5: $derived für gefilterte/sortierte Posts
	let filteredAndSortedPosts = $derived.by(() => {
		let posts = [...data.posts];
		
		// Kategorie-Filter
		if (selectedCategory !== 'all') {
			posts = posts.filter(p => p.category === selectedCategory);
		}
		
		// Tag-Filter
		if (selectedTag) {
			posts = posts.filter(p => p.tags.includes(selectedTag));
		}
		
		// Suche
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			posts = posts.filter(p => 
				p.title.toLowerCase().includes(query) ||
				p.excerpt.toLowerCase().includes(query) ||
				p.tags.some(t => t.toLowerCase().includes(query))
			);
		}
		
		// Sortierung
		posts.sort((a, b) => {
			let compareValue = 0;
			
			switch (sortBy) {
				case 'date':
					compareValue = new Date(b.date).getTime() - new Date(a.date).getTime();
					break;
				case 'readingTime':
					compareValue = b.readingTime - a.readingTime;
					break;
				case 'category':
					compareValue = a.category.localeCompare(b.category);
					break;
			}
			
			return sortOrder === 'asc' ? -compareValue : compareValue;
		});
		
		return posts;
	});
	
	// Svelte 5: $derived für Tag-Cloud mit Counts
	let tagCloud = $derived(() => {
		const tags = new Map<string, number>();
		data.posts.forEach(post => {
			post.tags.forEach(tag => {
				tags.set(tag, (tags.get(tag) || 0) + 1);
			});
		});
		return Array.from(tags.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 20);
	});
	
	// Svelte 5: $derived für Statistiken
	let stats = $derived({
		totalPosts: filteredAndSortedPosts.length,
		totalCategories: data.categories.length,
		totalTags: tagCloud.length
	});
	
	// Event Handler
	function handleCategorySelect(category: string) {
		selectedCategory = category;
		selectedTag = null;
	}
	
	function handleTagSelect(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
		selectedCategory = 'all';
	}
	
	function clearFilters() {
		selectedCategory = 'all';
		selectedTag = null;
		searchQuery = '';
		sortBy = 'date';
		sortOrder = 'desc';
	}
	
	function toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
	}
</script>

<svelte:head>
	<title>Blog | uload - Insights über URLs, Marketing und Psychologie</title>
	<meta name="description" content="Entdecken Sie Artikel über URL-Psychologie, Marketing-Strategien und Best Practices für Link-Management." />
</svelte:head>

<Navigation user={data.user} currentPath="/blog" />

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header mit Titel und View Toggle -->
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold text-theme-text">Blog</h1>
			<div class="flex items-center gap-4">
				<ViewToggle
					currentView={viewMode}
					onViewChange={(view) => viewMode = view}
					showStats={false}
				/>
			</div>
		</div>
		
		<!-- Search and Sort Controls -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Artikel durchsuchen..."
					class="w-full rounded-lg border border-theme-border bg-theme-surface pl-10 pr-4 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
				/>
			</div>
			
			<div class="flex items-center gap-2">
				<label for="sort-select" class="text-sm font-medium text-theme-text">Sortieren nach:</label>
				<select
					id="sort-select"
					bind:value={sortBy}
					class="rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text focus:ring-2 focus:ring-theme-accent focus:outline-none"
				>
					<option value="date">Datum</option>
					<option value="readingTime">Lesezeit</option>
					<option value="category">Kategorie</option>
				</select>
				<button
					onclick={toggleSortOrder}
					class="rounded-lg border border-theme-border bg-theme-surface p-2 text-theme-text transition-all hover:bg-theme-surface-hover"
					aria-label="Toggle sort order"
				>
					<ArrowUpDown class="h-4 w-4" />
				</button>
			</div>
		</div>
		
		<!-- Filter Section -->
		<div class="mb-6 rounded-xl border border-theme-border bg-theme-surface p-6">
			<!-- Kategorien -->
			<div class="mb-4">
				<h3 class="mb-3 text-sm font-semibold text-theme-text">Kategorien</h3>
				<div class="flex gap-2 flex-wrap">
					<button
						onclick={() => handleCategorySelect('all')}
						class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all {
							selectedCategory === 'all' 
								? 'border-theme-primary bg-theme-primary text-white' 
								: 'border-theme-border bg-theme-surface text-theme-text hover:bg-theme-surface-hover'
						}"
					>
						Alle ({data.posts.length})
					</button>
					{#each data.categories as category}
						<button
							onclick={() => handleCategorySelect(category.slug)}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all {
								selectedCategory === category.slug 
									? 'border-theme-primary bg-theme-primary text-white' 
									: 'border-theme-border bg-theme-surface text-theme-text hover:bg-theme-surface-hover'
							}"
						>
							{category.name} ({category.count})
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Tag-Cloud -->
			{#if tagCloud.length > 0}
				<div>
					<h3 class="mb-3 text-sm font-semibold text-theme-text">Beliebte Tags</h3>
					<div class="flex gap-2 flex-wrap">
						{#each tagCloud as [tag, count]}
							<button
								onclick={() => handleTagSelect(tag)}
								class="rounded-full border px-3 py-1 text-sm transition-all {
									selectedTag === tag 
										? 'border-theme-primary bg-theme-primary/10 text-theme-primary' 
										: 'border-theme-border bg-theme-surface text-theme-text-muted hover:bg-theme-surface-hover'
								}"
							>
								#{tag} ({count})
							</button>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Active Filters -->
			{#if selectedCategory !== 'all' || selectedTag || searchQuery}
				<div class="mt-4 flex items-center gap-2 border-t border-theme-border pt-4">
					<span class="text-sm font-medium text-theme-text-muted">Aktive Filter:</span>
					{#if selectedCategory !== 'all'}
						<span class="inline-flex items-center gap-1 rounded-full bg-theme-primary/10 px-2 py-1 text-xs font-medium text-theme-primary">
							{data.categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
							<button 
								onclick={() => selectedCategory = 'all'}
								class="ml-1 hover:text-theme-primary-hover"
							>
								×
							</button>
						</span>
					{/if}
					{#if selectedTag}
						<span class="inline-flex items-center gap-1 rounded-full bg-theme-primary/10 px-2 py-1 text-xs font-medium text-theme-primary">
							#{selectedTag}
							<button 
								onclick={() => selectedTag = null}
								class="ml-1 hover:text-theme-primary-hover"
							>
								×
							</button>
						</span>
					{/if}
					{#if searchQuery}
						<span class="inline-flex items-center gap-1 rounded-full bg-theme-primary/10 px-2 py-1 text-xs font-medium text-theme-primary">
							"{searchQuery}"
							<button 
								onclick={() => searchQuery = ''}
								class="ml-1 hover:text-theme-primary-hover"
							>
								×
							</button>
						</span>
					{/if}
					<button 
						onclick={clearFilters}
						class="ml-auto text-sm text-theme-text-muted hover:text-theme-text"
					>
						Alle löschen
					</button>
				</div>
			{/if}
		</div>
		
		<!-- Featured Posts -->
		{#if data.featuredPosts.length > 0 && selectedCategory === 'all' && !selectedTag && !searchQuery}
			<section class="mb-8">
				<h2 class="mb-4 text-xl font-semibold text-theme-text">Featured Artikel</h2>
				<div class="grid gap-6 md:grid-cols-2">
					{#each data.featuredPosts as post}
						<BlogCard {post} featured={true} {viewMode} />
					{/each}
				</div>
			</section>
		{/if}
		
		<!-- Posts Grid/List -->
		{#if filteredAndSortedPosts.length > 0}
			<div class={viewMode === 'cards' 
				? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' 
				: 'space-y-4'
			}>
				{#each filteredAndSortedPosts as post (post.slug)}
					<BlogCard {post} {viewMode} />
				{/each}
			</div>
		{:else}
			<div class="rounded-xl border border-theme-border bg-theme-surface p-12 text-center">
				<svg class="mx-auto h-12 w-12 text-theme-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
				</svg>
				<p class="mt-4 text-theme-text-muted">
					Keine Artikel gefunden.
				</p>
				{#if selectedCategory !== 'all' || selectedTag || searchQuery}
					<button 
						onclick={clearFilters}
						class="mt-4 text-theme-primary hover:text-theme-primary-hover"
					>
						Filter zurücksetzen
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<Footer />