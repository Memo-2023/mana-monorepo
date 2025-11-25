<script lang="ts">
	import type { Author } from '../../content/config';
	import { page } from '$app/stores';
	import { getEntry } from '$lib/content';
	
	// Svelte 5: Props mit $props()
	let {
		title,
		excerpt,
		date,
		author, // Author ID
		tags = [],
		category,
		image = undefined,
		series = undefined,
		seo = {},
		readingTime = 5
	} = $props<{
		title: string;
		excerpt: string;
		date: string | Date;
		author: string;
		tags?: string[];
		category: string;
		image?: string;
		series?: string;
		seo?: any;
		readingTime?: number;
	}>();
	
	// Svelte 5: $state für reaktive Variablen
	let authorData = $state<Author | null>(null);
	let headings = $state<Array<{id: string; text: string; level: string}>>([]);
	let scrollProgress = $state(0);
	
	// Svelte 5: $derived für berechnete Werte
	let formattedDate = $derived(
		new Date(date).toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
	
	let readingProgress = $derived(`${Math.round(scrollProgress)}%`);
	let categoryUrl = $derived(`/blog/category/${category.toLowerCase()}`);
	
	// Svelte 5: $effect für Side-Effects
	$effect(async () => {
		// Autor-Daten laden
		if (author) {
			try {
				authorData = await getEntry<Author>('authors', author);
			} catch (e) {
				console.log('Author not found:', author);
			}
		}
	});
	
	$effect(() => {
		// Table of Contents extrahieren
		const extractHeadings = () => {
			const h2s = document.querySelectorAll('article h2, article h3');
			headings = Array.from(h2s).map(h => ({
				id: h.id,
				text: h.textContent || '',
				level: h.tagName.toLowerCase()
			}));
		};
		
		// Warte auf DOM
		setTimeout(extractHeadings, 100);
	});
	
	$effect(() => {
		// Scroll Progress Tracking
		const handleScroll = () => {
			const winScroll = document.documentElement.scrollTop;
			const height = document.documentElement.scrollHeight - 
			               document.documentElement.clientHeight;
			scrollProgress = (winScroll / height) * 100;
		};
		
		window.addEventListener('scroll', handleScroll);
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<svelte:head>
	<title>{seo.title || title} | uload Blog</title>
	<meta name="description" content={seo.description || excerpt} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="article:author" content={authorData?.name} />
	<meta property="article:published_time" content={new Date(date).toISOString()} />
	{#each tags as tag}
		<meta property="article:tag" content={tag} />
	{/each}
	{#if image}
		<meta property="og:image" content={image} />
	{/if}
</svelte:head>

<!-- Reading Progress Bar -->
<div 
	class="fixed top-0 left-0 h-1 bg-blue-600 z-50 transition-all"
	style="width: {readingProgress}"
/>

<div class="max-w-7xl mx-auto px-4 py-8">
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
		<!-- Hauptinhalt -->
		<article class="lg:col-span-3 prose prose-lg max-w-none">
			<header class="not-prose mb-8">
				{#if series}
					<div class="text-sm text-blue-600 mb-2">
						Serie: {series}
					</div>
				{/if}
				
				<h1 class="text-4xl font-bold mb-4">{title}</h1>
				
				<div class="flex items-center gap-4 text-gray-600">
					<time datetime={new Date(date).toISOString()}>
						{formattedDate}
					</time>
					<span>•</span>
					<a href={categoryUrl} class="hover:text-blue-600">
						{category}
					</a>
					<span>•</span>
					<span>{readingTime} Min. Lesezeit</span>
				</div>
				
				{#if tags.length > 0}
					<div class="flex flex-wrap gap-2 mt-4">
						{#each tags as tag}
							<a 
								href="/blog/tag/{tag}"
								class="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm transition"
							>
								#{tag}
							</a>
						{/each}
					</div>
				{/if}
				
				{#if image}
					<img 
						src={image} 
						alt={title}
						class="w-full h-64 object-cover rounded-lg mt-6"
						loading="lazy"
					/>
				{/if}
			</header>
			
			<!-- MDX Content wird hier eingefügt -->
			<div class="content">
				<slot />
			</div>
			
			<footer class="not-prose mt-12 pt-8 border-t">
				<!-- Share Buttons -->
				<div class="flex gap-4 mb-8">
					<a 
						href="https://twitter.com/intent/tweet?url={encodeURIComponent($page.url.href)}&text={encodeURIComponent(title)}"
						target="_blank"
						rel="noopener"
						class="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
					>
						Twitter
					</a>
					<a 
						href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent($page.url.href)}"
						target="_blank"
						rel="noopener"
						class="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
					>
						LinkedIn
					</a>
				</div>
				
				{#if authorData}
					<div class="bg-gray-50 p-6 rounded-lg">
						<h3 class="font-semibold mb-2">Über den Autor</h3>
						<div class="flex gap-4">
							{#if authorData.avatar}
								<img 
									src={authorData.avatar} 
									alt={authorData.name}
									class="w-16 h-16 rounded-full"
								/>
							{/if}
							<div>
								<p class="font-medium">{authorData.name}</p>
								{#if authorData.bio}
									<p class="text-sm text-gray-600 mt-1">{authorData.bio}</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</footer>
		</article>
		
		<!-- Sidebar -->
		<aside class="lg:col-span-1">
			<div class="sticky top-4 space-y-6">
				{#if headings.length > 0}
					<nav class="bg-white p-4 rounded-lg shadow">
						<h3 class="font-semibold mb-3 text-sm uppercase text-gray-600">
							Inhaltsverzeichnis
						</h3>
						<ul class="space-y-2">
							{#each headings as heading}
								<li class={heading.level === 'h3' ? 'ml-4' : ''}>
									<a
										href="#{heading.id}"
										class="text-sm text-gray-700 hover:text-blue-600 transition"
									>
										{heading.text}
									</a>
								</li>
							{/each}
						</ul>
					</nav>
				{/if}
				
				<!-- Newsletter CTA -->
				<div class="bg-blue-50 p-6 rounded-lg">
					<h3 class="font-semibold mb-2">Newsletter</h3>
					<p class="text-sm text-gray-600 mb-4">
						Erhalte neue Artikel direkt in dein Postfach.
					</p>
					<a 
						href="/register"
						class="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
					>
						Abonnieren
					</a>
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	:global(.content .anchor-link) {
		text-decoration: none;
	}
	
	:global(.content .anchor-link:hover::before) {
		content: '#';
		position: absolute;
		left: -1.5rem;
		color: #3b82f6;
	}
	
	:global(.content h2),
	:global(.content h3) {
		position: relative;
	}
</style>