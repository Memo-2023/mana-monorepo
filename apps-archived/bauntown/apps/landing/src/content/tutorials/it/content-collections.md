---
title: 'Content Collections in Astro'
description: 'Come utilizzare le Content Collections per contenuti strutturati in Astro.'
pubDate: 2025-03-18
category: 'Marketing'
---

# Content Collections in Astro

Le Content Collections sono una potente funzionalità di Astro che ti permette di organizzare e validare Markdown, MDX e altri formati di contenuto. In questo tutorial, imparerai come creare e utilizzare le Content Collections.

## Cosa sono le Content Collections?

Le Content Collections ti forniscono:

- Un sistema strutturato per organizzare i tuoi contenuti
- Sicurezza dei tipi e validazione con schemi
- Accesso semplificato ai tuoi contenuti attraverso un'API

## Configurare le Content Collections

Ecco come configurare le Content Collections:

1. Crea una directory `content/` nella tua cartella `src/`
2. Crea sottodirectory per le tue collezioni (ad es. `src/content/blog/`)
3. Crea un file `src/content/config.ts` per definire le tue collezioni

Ecco un esempio di file di configurazione:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
	type: 'content', // 'content' o 'data'
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.date(),
		updatedDate: z.date().optional(),
		tags: z.array(z.string()).default(['generale']),
		image: z.string().optional(),
	}),
});

export const collections = {
	blog: blogCollection,
};
```

## Aggiungere Contenuti

Dopo la configurazione, puoi aggiungere file Markdown o MDX alle tue collezioni:

```markdown
---
title: 'Il mio primo post'
description: 'Questo è il mio primo post del blog usando Astro Content Collections.'
pubDate: 2025-03-10
tags: ['astro', 'markdown']
---

# Il mio primo post

Ecco il contenuto del mio primo post.
```

## Accedere alle Collezioni

Puoi accedere alle tue collezioni utilizzando le funzioni `getCollection` o `getEntry`:

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Ottieni tutte le voci in una collezione
const allBlogPosts = await getCollection('blog');

// Filtra per criteri specifici
const featuredPosts = await getCollection('blog', ({ data }) => {
	return data.tags.includes('featured');
});

// Ottieni una voce specifica
const specificPost = await getEntry('blog', 'post-slug');
---

<ul>
	{
		allBlogPosts.map((post) => (
			<li>
				<a href={`/blog/${post.slug}`}>{post.data.title}</a>
			</li>
		))
	}
</ul>
```

## Rendere i Contenuti

Per rendere il contenuto di una voce, devi prima chiamare il metodo `render()`:

```astro
---
import { getEntry } from 'astro:content';
import BlogLayout from '../layouts/BlogLayout.astro';

// Ottieni la voce dal parametro URL
const { slug } = Astro.params;
const entry = await getEntry('blog', slug);

// Renderizza il contenuto
const { Content } = await entry.render();
---

<BlogLayout frontmatter={entry.data}>
	<Content />
</BlogLayout>
```

## Sicurezza dei Tipi

Le Content Collections forniscono piena integrazione con TypeScript, dandoti accesso ai tipi per le tue collezioni:

```typescript
import type { CollectionEntry } from 'astro:content';

// Tipi per le tue collezioni
type BlogPost = CollectionEntry<'blog'>;

// Tipo prop del componente
interface Props {
	post: BlogPost;
}
```

## Riepilogo

Le Content Collections forniscono un modo potente e typesafe per lavorare con Markdown e altri formati di contenuto in Astro. Ti aiutano a organizzare, validare e utilizzare efficacemente i tuoi contenuti.

Con le Content Collections, puoi facilmente creare e gestire siti web complessi e ricchi di contenuti come blog, documentazione e portfolio.
