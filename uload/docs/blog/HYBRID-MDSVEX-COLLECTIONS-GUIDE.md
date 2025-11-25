# Hybrid-Ansatz: mdsvex + Content Collections

## Das Beste aus beiden Welten 🚀

Diese Kombination gibt dir:
- ✅ **mdsvex**: Svelte-Components in Markdown
- ✅ **Type-Safety**: Zod-Schema Validierung
- ✅ **Strukturiert**: Organisierte Content-Verwaltung
- ✅ **Flexibel**: Drafts, Kategorien, Serien
- ✅ **Developer Experience**: Autocompletion & Type-Checking

## Setup & Installation

```bash
npm install -D mdsvex gray-matter zod
npm install -D rehype-slug rehype-autolink-headings
npm install -D shiki # für Syntax-Highlighting
```

## Projekt-Struktur

```
src/
├── content/
│   ├── blog/
│   │   ├── 2024-01-15-psychologie-urls.md
│   │   ├── 2024-01-20-link-tracking.md
│   │   └── _drafts/
│   │       └── upcoming-post.md
│   ├── authors/
│   │   ├── till-schneider.json
│   │   └── guest-author.json
│   └── config.ts          # Schema-Definitionen
├── lib/
│   ├── content/
│   │   ├── index.ts       # Content-Loader
│   │   ├── types.ts       # TypeScript Types
│   │   └── utils.ts       # Helper Functions
│   └── layouts/
│       ├── BlogLayout.svelte
│       └── PageLayout.svelte
└── routes/
    └── blog/
        ├── +page.svelte
        ├── +page.ts
        └── [slug]/
            ├── +page.svelte
            └── +page.ts
```

## 1. Schema-Definition mit Zod

```typescript
// src/content/config.ts
import { z } from 'zod';

// Author Schema
export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  social: z.object({
    twitter: z.string().optional(),
    github: z.string().optional(),
    linkedin: z.string().optional()
  }).optional()
});

// Blog Post Schema
export const blogSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  date: z.string().or(z.date()).transform(val => new Date(val)),
  author: z.string(), // Author ID
  tags: z.array(z.string()).default([]),
  category: z.enum(['tutorial', 'psychology', 'feature', 'announcement']),
  image: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  series: z.string().optional(), // Für Blog-Serien
  layout: z.string().default('blog'), // mdsvex layout
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    canonical: z.string().optional()
  }).optional()
});

// Collection Types
export type BlogPost = z.infer<typeof blogSchema>;
export type Author = z.infer<typeof authorSchema>;

// Re-export für einfachen Import
export const collections = {
  blog: blogSchema,
  authors: authorSchema
};
```

## 2. mdsvex Konfiguration

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import shiki from 'shiki';

// Syntax Highlighting Setup
let highlighter;
async function highlightCode(code, lang) {
  if (!highlighter) {
    highlighter = await shiki.getHighlighter({ 
      theme: 'github-dark' 
    });
  }
  return highlighter.codeToHtml(code, { lang });
}

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
  extensions: ['.md', '.mdx'],
  
  // Dynamisches Layout basierend auf Frontmatter
  layout: {
    blog: './src/lib/layouts/BlogLayout.svelte',
    page: './src/lib/layouts/PageLayout.svelte',
    _: './src/lib/layouts/DefaultLayout.svelte' // Fallback
  },
  
  highlight: {
    highlighter: highlightCode
  },
  
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { 
      behavior: 'wrap',
      properties: {
        className: 'anchor-link'
      }
    }]
  ],
  
  remarkPlugins: []
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md', '.mdx'],
  preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
  kit: {
    adapter: adapter()
  }
};

export default config;
```

## 3. Content Loader mit Type-Safety

```typescript
// src/lib/content/index.ts
import { blogSchema, authorSchema, type BlogPost, type Author } from '../../content/config';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Cache für Performance
const contentCache = new Map<string, any>();
const CACHE_DURATION = dev ? 0 : 1000 * 60 * 5; // 5 Min in Production

export async function getCollection<T>(
  collection: 'blog' | 'authors'
): Promise<T[]> {
  const cacheKey = `collection-${collection}`;
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  let items: T[] = [];
  
  if (collection === 'blog') {
    items = await getBlogPosts() as T[];
  } else if (collection === 'authors') {
    items = await getAuthors() as T[];
  }
  
  contentCache.set(cacheKey, {
    data: items,
    timestamp: Date.now()
  });
  
  return items;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const postModules = import.meta.glob('/src/content/blog/**/*.md');
  const posts: BlogPost[] = [];
  
  for (const [path, resolver] of Object.entries(postModules)) {
    // Skip drafts in production
    if (!dev && path.includes('_drafts')) continue;
    
    try {
      const module = await resolver() as any;
      const { metadata } = module;
      
      // Validiere mit Zod Schema
      const validatedPost = blogSchema.parse(metadata);
      
      // Skip drafts based on frontmatter
      if (!dev && validatedPost.draft) continue;
      
      // Füge zusätzliche Metadaten hinzu
      const slug = path
        .split('/')
        .pop()
        ?.replace('.md', '')
        .replace(/^\d{4}-\d{2}-\d{2}-/, ''); // Datum aus Filename entfernen
      
      posts.push({
        ...validatedPost,
        slug,
        readingTime: calculateReadingTime(module.default || ''),
        path
      } as BlogPost & { slug: string; readingTime: number; path: string });
    } catch (err) {
      console.error(`Error loading ${path}:`, err);
      if (dev) throw err; // In Dev Fehler werfen
    }
  }
  
  // Sortiere nach Datum (neueste zuerst)
  return posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function getAuthors(): Promise<Author[]> {
  const authorModules = import.meta.glob('/src/content/authors/*.json', {
    import: 'default'
  });
  
  const authors: Author[] = [];
  
  for (const [path, resolver] of Object.entries(authorModules)) {
    const data = await resolver() as any;
    const validated = authorSchema.parse(data);
    authors.push(validated);
  }
  
  return authors;
}

export async function getEntry<T>(
  collection: 'blog' | 'authors',
  slug: string
): Promise<T | null> {
  const items = await getCollection<T>(collection);
  
  if (collection === 'blog') {
    return (items as any[]).find(item => item.slug === slug) || null;
  }
  
  return (items as any[]).find(item => item.id === slug) || null;
}

// Helper Functions
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Blog-spezifische Helpers
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getCollection<BlogPost>('blog');
  return posts.filter(post => post.tags.includes(tag));
}

export async function getBlogPostsByCategory(
  category: string
): Promise<BlogPost[]> {
  const posts = await getCollection<BlogPost>('blog');
  return posts.filter(post => post.category === category);
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection<BlogPost>('blog');
  return posts.filter(post => post.featured);
}

export async function getRelatedPosts(
  currentSlug: string,
  limit = 3
): Promise<BlogPost[]> {
  const posts = await getCollection<BlogPost>('blog');
  const current = posts.find(p => p.slug === currentSlug);
  
  if (!current) return [];
  
  // Finde Posts mit ähnlichen Tags
  const related = posts
    .filter(p => p.slug !== currentSlug)
    .map(post => ({
      post,
      score: post.tags.filter(tag => current.tags.includes(tag)).length
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
  
  return related;
}
```

## 4. TypeScript Types

```typescript
// src/lib/content/types.ts
import type { BlogPost, Author } from '../../content/config';

// Erweiterte Types mit berechneten Feldern
export interface BlogPostWithMeta extends BlogPost {
  slug: string;
  readingTime: number;
  author: Author; // Populated author
  related?: BlogPost[];
}

export interface BlogSeries {
  name: string;
  posts: BlogPostWithMeta[];
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
  posts?: BlogPostWithMeta[];
}

export interface BlogTag {
  name: string;
  count: number;
}
```

## 5. Blog Layout mit mdsvex

```svelte
<!-- src/lib/layouts/BlogLayout.svelte -->
<script lang="ts">
  import type { BlogPost, Author } from '../../content/config';
  import { page } from '$app/stores';
  import TableOfContents from '$lib/components/TableOfContents.svelte';
  import ShareButtons from '$lib/components/ShareButtons.svelte';
  import AuthorCard from '$lib/components/AuthorCard.svelte';
  
  // Props von mdsvex Frontmatter
  export let title: string;
  export let excerpt: string;
  export let date: string | Date;
  export let author: string; // Author ID
  export let tags: string[] = [];
  export let category: string;
  export let image: string | undefined = undefined;
  export let series: string | undefined = undefined;
  export let seo: any = {};
  
  // Autor-Daten laden
  import { getEntry } from '$lib/content';
  let authorData = $state<Author | null>(null);
  
  $effect(async () => {
    authorData = await getEntry<Author>('authors', author);
  });
  
  let formattedDate = $derived(
    new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );
  
  // TOC Extraction
  let headings = $state<any[]>([]);
  
  $effect(() => {
    // Extrahiere Headings für TOC
    const h2s = document.querySelectorAll('article h2, article h3');
    headings = Array.from(h2s).map(h => ({
      id: h.id,
      text: h.textContent,
      level: h.tagName.toLowerCase()
    }));
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
  {#if seo.canonical}
    <link rel="canonical" href={seo.canonical} />
  {/if}
</svelte:head>

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
          <span>{category}</span>
          <span>•</span>
          <span>{readingTime} Min. Lesezeit</span>
        </div>
        
        {#if tags.length > 0}
          <div class="flex flex-wrap gap-2 mt-4">
            {#each tags as tag}
              <a 
                href="/blog/tag/{tag}"
                class="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm"
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
          />
        {/if}
      </header>
      
      <!-- MDX Content wird hier eingefügt -->
      <div class="content">
        <slot />
      </div>
      
      <footer class="not-prose mt-12 pt-8 border-t">
        <ShareButtons 
          url={$page.url.href}
          title={title}
        />
        
        {#if authorData}
          <AuthorCard author={authorData} />
        {/if}
      </footer>
    </article>
    
    <!-- Sidebar -->
    <aside class="lg:col-span-1">
      <div class="sticky top-4 space-y-6">
        {#if headings.length > 0}
          <TableOfContents {headings} />
        {/if}
        
        <!-- Newsletter CTA -->
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="font-semibold mb-2">Newsletter</h3>
          <p class="text-sm text-gray-600 mb-4">
            Erhalte neue Artikel direkt in dein Postfach.
          </p>
          <button class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Abonnieren
          </button>
        </div>
      </div>
    </aside>
  </div>
</div>
```

## 6. Blog-Post mit Svelte-Components

```markdown
---
title: Die Psychologie kurzer URLs - Ein Deep Dive
excerpt: Warum 42% weniger Menschen auf lange URLs klicken und wie Sie das ändern können
date: 2024-01-15
author: till-schneider
category: psychology
tags: [urls, psychology, conversion, marketing]
featured: true
series: URL-Psychologie
image: /blog/images/url-psychology.jpg
seo:
  title: URL-Psychologie Guide 2024 | uload Blog
  description: Erfahren Sie, warum kurze URLs 42% mehr Klicks erhalten. Wissenschaftlich fundierte Erkenntnisse und praktische Tipps.
---

<script>
  // Svelte-Components im Markdown!
  import InteractiveDemo from '$lib/components/blog/InteractiveDemo.svelte';
  import StatsCounter from '$lib/components/blog/StatsCounter.svelte';
  import LinkComparison from '$lib/components/blog/LinkComparison.svelte';
  
  // Reactive Beispiele
  let clickCount = $state(0);
</script>

# Die Psychologie kurzer URLs

<StatsCounter 
  value={42} 
  label="weniger Klicks bei langen URLs"
  suffix="%"
/>

## Warum kurze URLs funktionieren

Unser Gehirn ist evolutionär darauf programmiert, Energie zu sparen...

## Interaktive Demo

Testen Sie selbst den Unterschied:

<InteractiveDemo />

## Live-Beispiel mit Reaktivität

<button onclick={() => clickCount++}>
  Klicks: {clickCount}
</button>

<LinkComparison 
  longUrl="https://example.com/products/category/summer-sale-2024?utm_source=newsletter&utm_medium=email"
  shortUrl="https://ulo.ad/summer"
/>

## Code-Beispiel mit Syntax-Highlighting

```javascript
// Kurze URL generieren
function generateShortUrl(longUrl) {
  const shortCode = generateRandomCode(6);
  return `https://ulo.ad/${shortCode}`;
}
```

## Fazit

Kurze URLs sind nicht nur ein technisches Detail...
```

## 7. Blog-Übersicht mit Filterung

```svelte
<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
  import { getCollection, getBlogPostsByCategory } from '$lib/content';
  import type { BlogPostWithMeta } from '$lib/content/types';
  import BlogCard from '$lib/components/BlogCard.svelte';
  
  let { data } = $props();
  
  // Filter-States
  let selectedCategory = $state<string>('all');
  let selectedTag = $state<string | null>(null);
  let searchQuery = $state('');
  
  // Gefilterte Posts
  let filteredPosts = $derived(() => {
    let posts = data.posts;
    
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
    
    return posts;
  });
  
  // Alle Tags sammeln
  let allTags = $derived(() => {
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
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold mb-8">Blog</h1>
  
  <!-- Filter-Bar -->
  <div class="mb-8 space-y-4">
    <!-- Suche -->
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Artikel durchsuchen..."
      class="w-full p-3 border rounded-lg"
    />
    
    <!-- Kategorien -->
    <div class="flex gap-2 flex-wrap">
      <button
        onclick={() => selectedCategory = 'all'}
        class="px-4 py-2 rounded {selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}"
      >
        Alle
      </button>
      {#each data.categories as category}
        <button
          onclick={() => selectedCategory = category.slug}
          class="px-4 py-2 rounded {selectedCategory === category.slug ? 'bg-blue-600 text-white' : 'bg-gray-100'}"
        >
          {category.name} ({category.count})
        </button>
      {/each}
    </div>
    
    <!-- Tag-Cloud -->
    <div class="flex gap-2 flex-wrap">
      {#each allTags as [tag, count]}
        <button
          onclick={() => selectedTag = selectedTag === tag ? null : tag}
          class="text-sm px-3 py-1 rounded-full {selectedTag === tag ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}"
        >
          #{tag} ({count})
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Featured Posts -->
  {#if data.featuredPosts.length > 0}
    <section class="mb-12">
      <h2 class="text-2xl font-bold mb-4">Featured</h2>
      <div class="grid md:grid-cols-2 gap-6">
        {#each data.featuredPosts as post}
          <BlogCard {post} featured={true} />
        {/each}
      </div>
    </section>
  {/if}
  
  <!-- Alle Posts -->
  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredPosts as post}
      <BlogCard {post} />
    {/each}
  </div>
  
  {#if filteredPosts.length === 0}
    <p class="text-center text-gray-500 py-12">
      Keine Artikel gefunden.
    </p>
  {/if}
</div>
```

## 8. Load Function mit Type-Safety

```typescript
// src/routes/blog/+page.ts
import { getCollection, getFeaturedPosts } from '$lib/content';
import type { BlogPostWithMeta, BlogCategory } from '$lib/content/types';

export async function load() {
  const posts = await getCollection<BlogPostWithMeta>('blog');
  const featuredPosts = await getFeaturedPosts();
  
  // Kategorien mit Count
  const categories = new Map<string, number>();
  posts.forEach(post => {
    categories.set(
      post.category, 
      (categories.get(post.category) || 0) + 1
    );
  });
  
  const categoryList: BlogCategory[] = Array.from(categories.entries())
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase(),
      count
    }));
  
  return {
    posts,
    featuredPosts,
    categories: categoryList
  };
}
```

## 9. Build-Optimierungen

```javascript
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate chunks für besseres Caching
          if (id.includes('node_modules')) {
            if (id.includes('mdsvex')) return 'mdsvex';
            if (id.includes('shiki')) return 'highlight';
            if (id.includes('zod')) return 'validation';
            return 'vendor';
          }
          if (id.includes('src/content')) return 'content';
        }
      }
    }
  },
  
  // Optimiere Markdown imports
  optimizeDeps: {
    include: ['mdsvex', 'gray-matter', 'zod']
  }
});
```

## 10. Automatische Generierung

```typescript
// scripts/new-post.ts
// npm run new-post "Mein neuer Artikel"

import { writeFileSync } from 'fs';
import { join } from 'path';

const title = process.argv[2];
if (!title) {
  console.error('Bitte Titel angeben: npm run new-post "Titel"');
  process.exit(1);
}

const date = new Date().toISOString().split('T')[0];
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const filename = `${date}-${slug}.md`;
const content = `---
title: ${title}
excerpt: 
date: ${date}
author: till-schneider
category: tutorial
tags: []
draft: true
---

# ${title}

Artikel-Inhalt hier...
`;

const path = join(process.cwd(), 'src/content/blog', filename);
writeFileSync(path, content);

console.log(`✅ Neuer Post erstellt: ${path}`);
```

## Vorteile dieser Hybrid-Lösung

### ✅ Type-Safety überall
- Zod validiert Frontmatter
- TypeScript kennt alle Felder
- Autocompletion in VS Code

### ✅ Beste Performance
- Static Generation zur Build-Zeit
- Intelligentes Code-Splitting
- Caching-Strategien

### ✅ Developer Experience
- Hot-Reload für Markdown
- Svelte-Components in Posts
- Strukturierte Content-Verwaltung

### ✅ Flexibilität
- Drafts-System
- Kategorien & Tags
- Blog-Serien
- Featured Posts

### ✅ SEO-optimiert
- Strukturierte Daten
- Meta-Tags Management
- Sitemap & RSS automatisch

## Quick-Start Befehle

```bash
# Setup
npm install -D mdsvex gray-matter zod rehype-slug rehype-autolink-headings shiki

# Struktur erstellen
mkdir -p src/content/blog src/lib/content src/lib/layouts
mkdir -p src/routes/blog/\[slug\]

# Neuen Post erstellen
npm run new-post "Mein erster Artikel"

# Development
npm run dev

# Build für Production
npm run build
```

---

**Diese Hybrid-Lösung kombiniert:**
- mdsvex für Rich-Content mit Svelte-Components
- Zod für Type-Safety und Validierung
- Content Collections für Struktur
- Optimale Performance durch Static Generation

Du bekommst ein professionelles Blog-System mit minimaler Komplexität!