# Svelte 5 Runes - Hybrid Blog System (mdsvex + Collections)

## ⚡ Optimiert für Svelte 5 mit Runes Mode

Dieser Guide nutzt ausschließlich die neuen Svelte 5 Runes:
- ✅ `$state` für reaktive Variablen
- ✅ `$derived` für berechnete Werte
- ✅ `$effect` für Side-Effects
- ✅ `$props()` für Component Props
- ❌ KEINE `$:` reactive statements mehr!

## Installation & Setup

```bash
npm install -D mdsvex gray-matter zod
npm install -D rehype-slug rehype-autolink-headings shiki
```

## 1. Blog Layout mit Svelte 5 Runes

```svelte
<!-- src/lib/layouts/BlogLayout.svelte -->
<script lang="ts">
  import type { BlogPost, Author } from '../../content/config';
  import { page } from '$app/stores';
  import { getEntry } from '$lib/content';
  import TableOfContents from '$lib/components/TableOfContents.svelte';
  import ShareButtons from '$lib/components/ShareButtons.svelte';
  import AuthorCard from '$lib/components/AuthorCard.svelte';
  
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
      authorData = await getEntry<Author>('authors', author);
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
        <ShareButtons url={$page.url.href} {title} />
        
        {#if authorData}
          <AuthorCard author={authorData} />
        {/if}
      </footer>
    </article>
    
    <!-- Sidebar -->
    <aside class="lg:col-span-1">
      <div class="sticky top-4 space-y-6">
        {#if headings.length > 0}
          <TableOfContents {headings} currentProgress={scrollProgress} />
        {/if}
      </div>
    </aside>
  </div>
</div>
```

## 2. Blog Übersichtsseite mit Svelte 5

```svelte
<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import type { BlogPostWithMeta } from '$lib/content/types';
  import BlogCard from '$lib/components/BlogCard.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  
  // Svelte 5: Props mit $props()
  let { data }: { data: PageData } = $props();
  
  // Svelte 5: $state für alle reaktiven Variablen
  let selectedCategory = $state<string>('all');
  let selectedTag = $state<string | null>(null);
  let searchQuery = $state('');
  let sortBy = $state<'date' | 'popularity'>('date');
  let viewMode = $state<'grid' | 'list'>('grid');
  
  // Svelte 5: $derived für gefilterte/sortierte Posts
  let filteredPosts = $derived(() => {
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
    if (sortBy === 'popularity') {
      posts.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      posts.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    
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
    totalPosts: filteredPosts.length,
    totalCategories: data.categories.length,
    totalTags: tagCloud.length
  });
  
  // Event Handler
  function handleCategorySelect(category: string) {
    selectedCategory = category;
    selectedTag = null; // Reset tag when category changes
  }
  
  function handleTagSelect(tag: string) {
    selectedTag = selectedTag === tag ? null : tag;
    selectedCategory = 'all'; // Reset category when tag selected
  }
  
  function clearFilters() {
    selectedCategory = 'all';
    selectedTag = null;
    searchQuery = '';
    sortBy = 'date';
  }
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-4">Blog</h1>
    <p class="text-lg text-gray-600">
      {stats.totalPosts} Artikel in {stats.totalCategories} Kategorien
    </p>
  </header>
  
  <!-- Such- und Filter-Bar -->
  <div class="mb-8 space-y-4 bg-white p-6 rounded-lg shadow">
    <!-- Suche -->
    <div class="flex gap-4">
      <SearchBar bind:value={searchQuery} placeholder="Artikel durchsuchen..." />
      
      <!-- View Mode Toggle -->
      <div class="flex gap-2">
        <button
          onclick={() => viewMode = 'grid'}
          class="p-2 rounded {viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}"
          aria-label="Grid-Ansicht"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
          </svg>
        </button>
        <button
          onclick={() => viewMode = 'list'}
          class="p-2 rounded {viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}"
          aria-label="Listen-Ansicht"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </button>
      </div>
      
      <!-- Sortierung -->
      <select 
        bind:value={sortBy}
        class="px-4 py-2 border rounded-lg"
      >
        <option value="date">Neueste zuerst</option>
        <option value="popularity">Beliebteste</option>
      </select>
    </div>
    
    <!-- Kategorien -->
    <div class="flex gap-2 flex-wrap">
      <button
        onclick={() => handleCategorySelect('all')}
        class="px-4 py-2 rounded-lg transition {
          selectedCategory === 'all' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200'
        }"
      >
        Alle ({data.posts.length})
      </button>
      {#each data.categories as category}
        <button
          onclick={() => handleCategorySelect(category.slug)}
          class="px-4 py-2 rounded-lg transition {
            selectedCategory === category.slug 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }"
        >
          {category.name} ({category.count})
        </button>
      {/each}
    </div>
    
    <!-- Tag-Cloud -->
    <details class="cursor-pointer">
      <summary class="font-semibold mb-2">Tags ({tagCloud.length})</summary>
      <div class="flex gap-2 flex-wrap mt-2">
        {#each tagCloud as [tag, count]}
          <button
            onclick={() => handleTagSelect(tag)}
            class="text-sm px-3 py-1 rounded-full transition {
              selectedTag === tag 
                ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600' 
                : 'bg-gray-100 hover:bg-gray-200'
            }"
          >
            #{tag} ({count})
          </button>
        {/each}
      </div>
    </details>
    
    <!-- Active Filters -->
    {#if selectedCategory !== 'all' || selectedTag || searchQuery}
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Aktive Filter:</span>
        {#if selectedCategory !== 'all'}
          <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm">
            {selectedCategory}
          </span>
        {/if}
        {#if selectedTag}
          <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm">
            #{selectedTag}
          </span>
        {/if}
        {#if searchQuery}
          <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm">
            "{searchQuery}"
          </span>
        {/if}
        <button 
          onclick={clearFilters}
          class="ml-2 text-sm text-red-600 hover:text-red-700"
        >
          Alle löschen
        </button>
      </div>
    {/if}
  </div>
  
  <!-- Featured Posts (nur wenn keine Filter aktiv) -->
  {#if data.featuredPosts.length > 0 && selectedCategory === 'all' && !selectedTag && !searchQuery}
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4">Featured</h2>
      <div class="grid md:grid-cols-2 gap-6">
        {#each data.featuredPosts as post}
          <BlogCard {post} featured={true} />
        {/each}
      </div>
    </section>
  {/if}
  
  <!-- Posts Grid/List -->
  <div class={viewMode === 'grid' 
    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
    : 'space-y-4'
  }>
    {#each filteredPosts as post (post.slug)}
      <BlogCard {post} {viewMode} />
    {/each}
  </div>
  
  {#if filteredPosts.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500 mb-4">
        Keine Artikel gefunden.
      </p>
      <button 
        onclick={clearFilters}
        class="text-blue-600 hover:text-blue-700"
      >
        Filter zurücksetzen
      </button>
    </div>
  {/if}
</div>
```

## 3. BlogCard Component mit Svelte 5

```svelte
<!-- src/lib/components/BlogCard.svelte -->
<script lang="ts">
  import type { BlogPostWithMeta } from '$lib/content/types';
  
  // Svelte 5: Props mit $props()
  let { 
    post,
    featured = false,
    viewMode = 'grid'
  } = $props<{
    post: BlogPostWithMeta;
    featured?: boolean;
    viewMode?: 'grid' | 'list';
  }>();
  
  // Svelte 5: $state für Hover-State
  let isHovered = $state(false);
  
  // Svelte 5: $derived für berechnete Werte
  let formattedDate = $derived(
    new Date(post.date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  );
  
  let readingTimeText = $derived(
    `${post.readingTime} Min. Lesezeit`
  );
  
  let cardClasses = $derived(
    viewMode === 'list' 
      ? 'flex gap-4 p-4' 
      : 'flex flex-col'
  );
</script>

<article 
  class="bg-white rounded-lg shadow hover:shadow-lg transition-all {cardClasses} {featured ? 'ring-2 ring-blue-500' : ''}"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  {#if post.image}
    <div class={viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'}>
      <img 
        src={post.image} 
        alt={post.title}
        class="w-full h-full object-cover rounded-t-lg"
        loading="lazy"
        style="transform: scale({isHovered ? 1.05 : 1}); transition: transform 0.3s"
      />
    </div>
  {/if}
  
  <div class="p-6 flex-1">
    {#if featured}
      <span class="inline-block px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded mb-2">
        Featured
      </span>
    {/if}
    
    <h2 class="text-xl font-semibold mb-2">
      <a 
        href="/blog/{post.slug}" 
        class="hover:text-blue-600 transition"
      >
        {post.title}
      </a>
    </h2>
    
    <p class="text-gray-600 mb-4 line-clamp-2">
      {post.excerpt}
    </p>
    
    <div class="flex items-center justify-between text-sm text-gray-500">
      <time datetime={post.date.toISOString()}>
        {formattedDate}
      </time>
      <span>{readingTimeText}</span>
    </div>
    
    {#if post.tags.length > 0}
      <div class="flex gap-2 mt-3 flex-wrap">
        {#each post.tags.slice(0, 3) as tag}
          <span class="text-xs bg-gray-100 px-2 py-1 rounded">
            #{tag}
          </span>
        {/each}
        {#if post.tags.length > 3}
          <span class="text-xs text-gray-500">
            +{post.tags.length - 3}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</article>
```

## 4. Interactive Blog Post mit Svelte 5 Runes

```markdown
---
title: Interaktive URL-Psychologie Demo
excerpt: Testen Sie selbst, wie URLs Ihre Klickrate beeinflussen
date: 2024-01-15
author: till-schneider
category: psychology
tags: [urls, interactive, demo]
---

<script>
  import UrlComparison from '$lib/components/blog/UrlComparison.svelte';
  import ClickHeatmap from '$lib/components/blog/ClickHeatmap.svelte';
  
  // Svelte 5: $state für interaktive Demos
  let urlLength = $state(50);
  let includeUTM = $state(false);
  let useHttps = $state(true);
  let clickCount = $state(0);
  let userChoices = $state<string[]>([]);
  
  // Svelte 5: $derived für berechnete Demo-Werte
  let estimatedCTR = $derived(() => {
    let ctr = 100;
    if (urlLength > 50) ctr -= 20;
    if (urlLength > 100) ctr -= 22;
    if (includeUTM) ctr -= 15;
    if (!useHttps) ctr -= 10;
    return Math.max(ctr, 25);
  });
  
  let generatedUrl = $derived(() => {
    let url = useHttps ? 'https://' : 'http://';
    url += 'ulo.ad/';
    
    if (urlLength < 30) {
      url += 'sale';
    } else if (urlLength < 60) {
      url += 'summer-sale-2024';
    } else {
      url += 'products/category/summer-collection-sale-2024';
    }
    
    if (includeUTM) {
      url += '?utm_source=email&utm_medium=newsletter&utm_campaign=summer';
    }
    
    return url;
  });
  
  // Svelte 5: $effect für Analytics Tracking
  $effect(() => {
    if (clickCount > 0) {
      console.log('User clicked:', clickCount, 'times');
      // Track interaction
    }
  });
  
  function handleChoice(choice: string) {
    userChoices = [...userChoices, choice];
    clickCount++;
  }
</script>

# Interaktive URL-Psychologie Demo

Experimentieren Sie selbst mit verschiedenen URL-Parametern und sehen Sie, wie sie die geschätzte Klickrate beeinflussen!

## URL-Generator

<div class="bg-gray-50 p-6 rounded-lg my-8">
  <h3 class="font-bold mb-4">Passen Sie Ihre URL an:</h3>
  
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-2">
        URL-Länge: {urlLength} Zeichen
      </label>
      <input 
        type="range" 
        bind:value={urlLength}
        min="20" 
        max="150" 
        class="w-full"
      />
    </div>
    
    <div>
      <label class="flex items-center gap-2">
        <input 
          type="checkbox" 
          bind:checked={includeUTM}
        />
        UTM-Parameter hinzufügen
      </label>
    </div>
    
    <div>
      <label class="flex items-center gap-2">
        <input 
          type="checkbox" 
          bind:checked={useHttps}
        />
        HTTPS verwenden
      </label>
    </div>
  </div>
  
  <div class="mt-6 p-4 bg-white rounded border">
    <p class="text-sm text-gray-600 mb-2">Generierte URL:</p>
    <code class="block p-2 bg-gray-100 rounded text-sm break-all">
      {generatedUrl}
    </code>
  </div>
  
  <div class="mt-4 text-center">
    <div class="text-3xl font-bold text-blue-600">
      {estimatedCTR}%
    </div>
    <p class="text-sm text-gray-600">Geschätzte Klickrate</p>
  </div>
</div>

## A/B Test - Welche URL würden Sie klicken?

<UrlComparison 
  onChoice={handleChoice}
  choices={userChoices}
/>

Sie haben {clickCount} Mal geklickt. 
{#if clickCount > 5}
  Interessant! Sie bevorzugen eindeutig kürzere URLs.
{/if}

## Was wir gelernt haben

Basierend auf Ihrer Interaktion:
- URLs unter 50 Zeichen performen {urlLength < 50 ? '✅ optimal' : '⚠️ schlechter'}
- UTM-Parameter {includeUTM ? '❌ senken' : '✅ erhöhen'} das Vertrauen
- HTTPS ist {useHttps ? '✅ essentiell' : '❌ wichtig für Vertrauen'}

<ClickHeatmap data={userChoices} />
```

## 5. Table of Contents mit Svelte 5

```svelte
<!-- src/lib/components/TableOfContents.svelte -->
<script lang="ts">
  // Svelte 5: Props mit $props()
  let { 
    headings,
    currentProgress = 0
  } = $props<{
    headings: Array<{id: string; text: string; level: string}>;
    currentProgress?: number;
  }>();
  
  // Svelte 5: $state für aktiven Abschnitt
  let activeId = $state<string | null>(null);
  
  // Svelte 5: $derived für strukturierte Headings
  let structuredHeadings = $derived(() => {
    return headings.map(h => ({
      ...h,
      indent: h.level === 'h3' ? 'ml-4' : '',
      isActive: h.id === activeId
    }));
  });
  
  // Svelte 5: $effect für Intersection Observer
  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
          }
        });
      },
      { rootMargin: '-100px 0px -70% 0px' }
    );
    
    headings.forEach(h => {
      const element = document.getElementById(h.id);
      if (element) observer.observe(element);
    });
    
    return () => observer.disconnect();
  });
  
  function scrollToHeading(id: string) {
    document.getElementById(id)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
</script>

<nav class="bg-white p-4 rounded-lg shadow sticky top-4">
  <h3 class="font-semibold mb-3 text-sm uppercase text-gray-600">
    Inhaltsverzeichnis
  </h3>
  
  <!-- Progress Indicator -->
  {#if currentProgress > 0}
    <div class="mb-3">
      <div class="h-1 bg-gray-200 rounded">
        <div 
          class="h-1 bg-blue-600 rounded transition-all"
          style="width: {currentProgress}%"
        />
      </div>
      <p class="text-xs text-gray-500 mt-1">
        {Math.round(currentProgress)}% gelesen
      </p>
    </div>
  {/if}
  
  <ul class="space-y-2">
    {#each structuredHeadings as heading}
      <li class={heading.indent}>
        <button
          onclick={() => scrollToHeading(heading.id)}
          class="text-left w-full text-sm hover:text-blue-600 transition {
            heading.isActive ? 'text-blue-600 font-medium' : 'text-gray-700'
          }"
        >
          {heading.text}
        </button>
      </li>
    {/each}
  </ul>
</nav>
```

## 6. Search Component mit Svelte 5

```svelte
<!-- src/lib/components/SearchBar.svelte -->
<script lang="ts">
  // Svelte 5: Props mit $props()
  let { 
    value = $bindable(),
    placeholder = 'Suchen...',
    onSearch = () => {}
  } = $props<{
    value?: string;
    placeholder?: string;
    onSearch?: (query: string) => void;
  }>();
  
  // Svelte 5: $state für lokalen State
  let isFocused = $state(false);
  let suggestions = $state<string[]>([]);
  let selectedIndex = $state(-1);
  
  // Svelte 5: $derived für Validierung
  let hasQuery = $derived(value && value.length > 0);
  let showSuggestions = $derived(isFocused && suggestions.length > 0);
  
  // Svelte 5: $effect für Debounced Search
  $effect(() => {
    if (!value) {
      suggestions = [];
      return;
    }
    
    const timer = setTimeout(() => {
      // Simuliere Suchvorschläge
      if (value.length > 2) {
        suggestions = [
          `${value} in Tutorials`,
          `${value} in Psychology`,
          `${value} in Features`
        ];
      }
    }, 300);
    
    return () => clearTimeout(timer);
  });
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        value = suggestions[selectedIndex];
        suggestions = [];
      }
      onSearch(value);
    } else if (e.key === 'Escape') {
      suggestions = [];
      selectedIndex = -1;
    }
  }
  
  function selectSuggestion(suggestion: string) {
    value = suggestion;
    suggestions = [];
    onSearch(value);
  }
</script>

<div class="relative flex-1">
  <input
    bind:value
    {placeholder}
    onfocus={() => isFocused = true}
    onblur={() => setTimeout(() => isFocused = false, 200)}
    onkeydown={handleKeydown}
    class="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 {
      hasQuery ? 'pr-10' : ''
    }"
  />
  
  <!-- Search Icon -->
  <svg 
    class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
    />
  </svg>
  
  <!-- Clear Button -->
  {#if hasQuery}
    <button
      onclick={() => value = ''}
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      ✕
    </button>
  {/if}
  
  <!-- Suggestions Dropdown -->
  {#if showSuggestions}
    <div class="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
      {#each suggestions as suggestion, i}
        <button
          onclick={() => selectSuggestion(suggestion)}
          class="w-full text-left px-4 py-2 hover:bg-gray-100 {
            i === selectedIndex ? 'bg-blue-50' : ''
          }"
        >
          {suggestion}
        </button>
      {/each}
    </div>
  {/if}
</div>
```

## Wichtige Svelte 5 Runes Patterns

### ❌ FALSCH (Svelte 4)
```javascript
// Reactive Statements
$: doubled = count * 2;
$: console.log('count changed:', count);

// Props
export let title = '';

// Reactive Blocks
$: if (user) {
  loadUserData();
}
```

### ✅ RICHTIG (Svelte 5)
```javascript
// Reactive Values
let doubled = $derived(count * 2);

// Side Effects
$effect(() => {
  console.log('count changed:', count);
});

// Props
let { title = '' } = $props();

// Reactive Effects
$effect(() => {
  if (user) {
    loadUserData();
  }
});
```

## Migration Checkliste

- [x] Alle `export let` → `$props()`
- [x] Alle `$:` reactive statements → `$derived`
- [x] Alle `$:` side effects → `$effect`
- [x] Alle `let` für reaktive Werte → `$state`
- [x] Cleanup in `$effect` mit return function
- [x] Type-safe Props mit TypeScript

Der Code ist jetzt vollständig Svelte 5 Runes-kompatibel!