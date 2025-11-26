# Statischer Markdown-Blog in SvelteKit - Implementierungsguide

## Übersicht: 3 Ansätze für statische Markdown-Blogs

### 1. **mdsvex** - Markdown als Svelte-Komponenten (Empfohlen)
### 2. **Vite Glob Import** - Dynamisches Laden zur Build-Zeit  
### 3. **Content Collections** - Strukturierte Markdown-Verwaltung

---

## Ansatz 1: mdsvex (Empfohlen) ⭐

mdsvex verwandelt Markdown-Dateien in Svelte-Komponenten. Du kannst Svelte-Components direkt im Markdown verwenden!

### Installation & Setup

```bash
npm install -D mdsvex
npm install -D rehype-slug rehype-autolink-headings
```

### Konfiguration in `vite.config.js`

```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()]
});
```

### Konfiguration in `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
  extensions: ['.md', '.mdx'],
  layout: {
    blog: './src/lib/layouts/BlogLayout.svelte'
  },
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: 'wrap' }]
  ]
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

### Blog-Layout erstellen

```svelte
<!-- src/lib/layouts/BlogLayout.svelte -->
<script>
  export let title = '';
  export let date = '';
  export let author = '';
  export let excerpt = '';
  export let tags = [];
  export let image = '';
  
  let formattedDate = $derived(
    new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );
</script>

<svelte:head>
  <title>{title} | uload Blog</title>
  <meta name="description" content={excerpt} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={excerpt} />
  {#if image}
    <meta property="og:image" content={image} />
  {/if}
</svelte:head>

<article class="prose prose-lg mx-auto px-4 py-8 max-w-4xl">
  <header class="mb-8">
    <h1 class="text-4xl font-bold mb-2">{title}</h1>
    <div class="text-gray-600 flex gap-4 items-center">
      <time datetime={date}>{formattedDate}</time>
      <span>•</span>
      <span>{author}</span>
    </div>
    {#if tags.length > 0}
      <div class="flex gap-2 mt-4">
        {#each tags as tag}
          <span class="bg-gray-100 px-3 py-1 rounded-full text-sm">
            {tag}
          </span>
        {/each}
      </div>
    {/if}
  </header>
  
  <div class="content">
    <slot />
  </div>
</article>
```

### Blog-Post Beispiel

```markdown
---
title: Die Psychologie kurzer URLs
date: 2024-01-15
author: Till Schneider
excerpt: Warum 42% weniger Menschen auf lange URLs klicken
tags: [Psychology, Marketing, URLs]
image: /blog/psychology-urls.jpg
---

# Die Psychologie kurzer URLs

42% weniger Klicks bei langen URLs – diese Zahl zeigt...

## Warum kurze URLs funktionieren

Unser Gehirn verarbeitet kurze Informationen schneller...

<script>
  import CallToAction from '$lib/components/CallToAction.svelte';
</script>

<CallToAction />
```

### Routing-Struktur

```
src/routes/
└── blog/
    ├── +page.svelte          # Blog-Übersicht
    ├── +page.js              # Posts laden
    └── [slug]/
        └── +page.js          # Dynamisches Routing
```

### Blog-Übersicht mit allen Posts

```javascript
// src/routes/blog/+page.js
export async function load() {
  const posts = import.meta.glob('/src/content/blog/*.md');
  const postPromises = Object.entries(posts).map(async ([path, resolver]) => {
    const { metadata } = await resolver();
    const slug = path.split('/').pop().replace('.md', '');
    
    return {
      slug,
      ...metadata
    };
  });
  
  const allPosts = await Promise.all(postPromises);
  
  // Nach Datum sortieren
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return {
    posts: allPosts
  };
}
```

```svelte
<!-- src/routes/blog/+page.svelte -->
<script>
  let { data } = $props();
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Blog</h1>
  
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {#each data.posts as post}
      <article class="border rounded-lg p-6 hover:shadow-lg transition">
        <h2 class="text-xl font-semibold mb-2">
          <a href="/blog/{post.slug}" class="hover:text-blue-600">
            {post.title}
          </a>
        </h2>
        <p class="text-gray-600 mb-4">{post.excerpt}</p>
        <div class="text-sm text-gray-500">
          {new Date(post.date).toLocaleDateString('de-DE')}
        </div>
      </article>
    {/each}
  </div>
</div>
```

---

## Ansatz 2: Vite Glob Import (Einfacher)

Dieser Ansatz lädt alle Markdown-Dateien zur Build-Zeit ohne mdsvex.

### Setup

```bash
npm install -D gray-matter marked
```

### Markdown-Parser Utility

```javascript
// src/lib/utils/markdown.js
import { marked } from 'marked';
import matter from 'gray-matter';

export function parseMarkdown(content) {
  const { data, content: markdown } = matter(content);
  const html = marked(markdown);
  
  return {
    metadata: data,
    html
  };
}
```

### Posts laden

```javascript
// src/routes/blog/+page.server.js
import { parseMarkdown } from '$lib/utils/markdown';

export async function load() {
  const postFiles = import.meta.glob('/src/content/blog/*.md', { 
    query: '?raw',
    import: 'default' 
  });
  
  const posts = await Promise.all(
    Object.entries(postFiles).map(async ([path, resolver]) => {
      const content = await resolver();
      const { metadata, html } = parseMarkdown(content);
      const slug = path.split('/').pop().replace('.md', '');
      
      return {
        slug,
        ...metadata,
        content: html
      };
    })
  );
  
  return {
    posts: posts.sort((a, b) => new Date(b.date) - new Date(a.date))
  };
}
```

### Einzelner Blog-Post

```javascript
// src/routes/blog/[slug]/+page.server.js
import { parseMarkdown } from '$lib/utils/markdown';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  try {
    const post = await import(`../../../content/blog/${params.slug}.md?raw`);
    const { metadata, html } = parseMarkdown(post.default);
    
    return {
      ...metadata,
      content: html,
      slug: params.slug
    };
  } catch (e) {
    throw error(404, 'Post nicht gefunden');
  }
}
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.excerpt} />
</svelte:head>

<article class="prose mx-auto px-4 py-8">
  <h1>{data.title}</h1>
  <time>{new Date(data.date).toLocaleDateString('de-DE')}</time>
  
  {@html data.content}
</article>
```

---

## Ansatz 3: Content Collections (Strukturiert)

Ein strukturierterer Ansatz mit Typ-Sicherheit und besserer Organisation.

### Content-Struktur

```
src/content/
├── blog/
│   ├── 2024-01-15-psychologie-urls.md
│   ├── 2024-01-20-link-tracking.md
│   └── _drafts/
│       └── upcoming-post.md
└── config.js
```

### Content-Config

```javascript
// src/content/config.js
import { z } from 'zod';

export const blogSchema = z.object({
  title: z.string(),
  date: z.date(),
  author: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()),
  image: z.string().optional(),
  draft: z.boolean().default(false)
});

export const collections = {
  blog: {
    schema: blogSchema,
    directory: 'src/content/blog'
  }
};
```

### Content-Loader

```javascript
// src/lib/content.js
import { blogSchema } from '../content/config';
import matter from 'gray-matter';
import { marked } from 'marked';

export async function getCollection(collection) {
  const posts = import.meta.glob('/src/content/blog/*.md', { 
    query: '?raw',
    import: 'default' 
  });
  
  const entries = await Promise.all(
    Object.entries(posts).map(async ([path, resolver]) => {
      // Drafts überspringen
      if (path.includes('_drafts')) return null;
      
      const content = await resolver();
      const { data, content: markdown } = matter(content);
      
      // Schema validieren
      const metadata = blogSchema.parse({
        ...data,
        date: new Date(data.date)
      });
      
      // Draft-Posts in Production ausblenden
      if (metadata.draft && import.meta.env.PROD) return null;
      
      const slug = path.split('/').pop().replace('.md', '');
      const html = marked(markdown);
      
      return {
        slug,
        ...metadata,
        content: html
      };
    })
  );
  
  return entries.filter(Boolean);
}

export async function getEntry(collection, slug) {
  const posts = await getCollection(collection);
  return posts.find(post => post.slug === slug);
}
```

---

## Features für alle Ansätze

### 1. RSS Feed Generation

```javascript
// src/routes/blog/rss.xml/+server.js
import { getCollection } from '$lib/content';

export async function GET() {
  const posts = await getCollection('blog');
  const site = 'https://ulo.ad';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>uload Blog</title>
    <link>${site}/blog</link>
    <description>Insights über URLs, Marketing und Psychologie</description>
    ${posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${site}/blog/${post.slug}</link>
      <description>${post.excerpt}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>
    `).join('')}
  </channel>
</rss>`;
  
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
```

### 2. Sitemap Generation

```javascript
// src/routes/sitemap.xml/+server.js
export async function GET() {
  const posts = await getCollection('blog');
  const site = 'https://ulo.ad';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${posts.map(post => `
  <url>
    <loc>${site}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.date).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;
  
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
```

### 3. Syntax Highlighting

```bash
npm install -D shiki
```

```javascript
// src/lib/utils/highlight.js
import { codeToHtml } from 'shiki';

export async function highlightCode(code, lang = 'javascript') {
  return await codeToHtml(code, {
    lang,
    theme: 'github-dark'
  });
}
```

### 4. Reading Time

```javascript
// src/lib/utils/reading-time.js
export function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return {
    minutes,
    words,
    text: `${minutes} Min. Lesezeit`
  };
}
```

### 5. Table of Contents

```javascript
// src/lib/utils/toc.js
export function extractHeadings(html) {
  const regex = /<h([2-3])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/g;
  const headings = [];
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]*>/g, '')
    });
  }
  
  return headings;
}
```

---

## Performance-Optimierungen

### 1. Prerendering aktivieren

```javascript
// src/routes/blog/+page.js
export const prerender = true; // Statisch zur Build-Zeit generieren
```

### 2. Lazy Loading für Bilder

```svelte
<script>
  import { inview } from 'svelte-inview';
  
  let isInView = $state(false);
</script>

<div use:inview on:inview_enter={() => isInView = true}>
  {#if isInView}
    <img src={image} alt={alt} loading="lazy" />
  {:else}
    <div class="skeleton h-64 bg-gray-200" />
  {/if}
</div>
```

### 3. Content Caching

```javascript
// src/lib/cache.js
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 5; // 5 Minuten

export function getCached(key, fetcher) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

---

## Deployment-Tipps

### Build-Optimierungen

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'markdown': ['marked', 'gray-matter'],
          'highlight': ['shiki']
        }
      }
    }
  }
});
```

### Static Adapter für volle statische Generierung

```bash
npm install -D @sveltejs/adapter-static
```

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: true
    }),
    prerender: {
      entries: ['*'] // Alle Seiten prerendern
    }
  }
};
```

---

## Schnellstart-Anleitung

### 1. mdsvex installieren & konfigurieren

```bash
npm install -D mdsvex gray-matter rehype-slug rehype-autolink-headings
```

### 2. Blog-Struktur erstellen

```bash
mkdir -p src/content/blog
mkdir -p src/lib/layouts
mkdir -p src/routes/blog/\[slug\]
```

### 3. Ersten Post erstellen

```bash
cat > src/content/blog/hello-world.md << 'EOF'
---
title: Hello World
date: 2024-01-15
author: Till Schneider
excerpt: Mein erster Blog-Post
tags: [Announcement]
---

# Hello World

Dies ist mein erster Blog-Post mit Markdown!
EOF
```

### 4. Dev-Server starten

```bash
npm run dev
```

Besuche `http://localhost:5173/blog`

---

## Vorteile des statischen Ansatzes

✅ **Performance**: Zur Build-Zeit generiert = ultraschnell
✅ **SEO**: Vollständig gerenderte HTML-Seiten
✅ **Versionskontrolle**: Alle Posts in Git
✅ **Einfachheit**: Kein CMS, keine Datenbank
✅ **Sicherheit**: Keine dynamischen Vulnerabilities
✅ **Hosting**: Überall deploybar (Vercel, Netlify, etc.)

## Nachteile

❌ **Rebuild nötig**: Bei jedem neuen Post
❌ **Keine Kommentare**: Ohne externe Services
❌ **Kein WYSIWYG**: Markdown-Kenntnisse nötig
❌ **Keine Scheduled Posts**: Ohne CI/CD-Automation

---

**Empfehlung**: Starte mit **mdsvex** (Ansatz 1) - es bietet die beste Balance zwischen Einfachheit und Features, plus du kannst Svelte-Components direkt in Markdown verwenden!