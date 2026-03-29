---
title: 'Content Collections in Astro'
description: 'Wie man Content Collections für strukturierte Inhalte in Astro nutzt.'
pubDate: 2025-03-18
category: 'Marketing'
---

# Content Collections in Astro

Content Collections sind eine leistungsstarke Funktion in Astro, die dir ermöglicht, Markdown, MDX und andere Inhaltsformate zu organisieren und zu validieren. In diesem Tutorial lernst du, wie du Content Collections erstellen und verwenden kannst.

## Was sind Content Collections?

Content Collections bieten dir:

- Ein strukturiertes System zum Organisieren deiner Inhalte
- Typ-Sicherheit und Validierung mit Schemas
- Vereinfachten Zugriff auf deine Inhalte über eine API

## Einrichtung von Content Collections

So richtest du Content Collections ein:

1. Erstelle ein `content/` Verzeichnis in deinem `src/` Ordner
2. Erstelle Unterverzeichnisse für deine Sammlungen (z.B. `src/content/blog/`)
3. Erstelle eine `src/content/config.ts` Datei, um deine Sammlungen zu definieren

Hier ist ein Beispiel für eine Konfigurationsdatei:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
	type: 'content', // 'content' oder 'data'
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.date(),
		updatedDate: z.date().optional(),
		tags: z.array(z.string()).default(['allgemein']),
		image: z.string().optional(),
	}),
});

export const collections = {
	blog: blogCollection,
};
```

## Inhalte hinzufügen

Nach der Einrichtung kannst du Markdown oder MDX Dateien zu deinen Sammlungen hinzufügen:

```markdown
---
title: 'Mein erster Beitrag'
description: 'Dies ist mein erster Blogbeitrag mit Astro Content Collections.'
pubDate: 2025-03-10
tags: ['astro', 'markdown']
---

# Mein erster Beitrag

Hier ist der Inhalt meines ersten Beitrags.
```

## Auf Sammlungen zugreifen

Du kannst auf deine Sammlungen zugreifen, indem du die `getCollection` oder `getEntry` Funktionen verwendest:

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Alle Einträge einer Sammlung abrufen
const allBlogPosts = await getCollection('blog');

// Nach bestimmten Kriterien filtern
const featuredPosts = await getCollection('blog', ({ data }) => {
	return data.tags.includes('featured');
});

// Einen bestimmten Eintrag abrufen
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

## Inhalte rendern

Um den Inhalt eines Eintrags zu rendern, musst du zuerst die `render()` Methode aufrufen:

```astro
---
import { getEntry } from 'astro:content';
import BlogLayout from '../layouts/BlogLayout.astro';

// Eintrag aus der URL-Parameter holen
const { slug } = Astro.params;
const entry = await getEntry('blog', slug);

// Den Inhalt rendern
const { Content } = await entry.render();
---

<BlogLayout frontmatter={entry.data}>
	<Content />
</BlogLayout>
```

## Typsicherheit

Content Collections bieten vollständige TypeScript-Integration, sodass du Zugriff auf Typen für deine Sammlungen hast:

```typescript
import type { CollectionEntry } from 'astro:content';

// Typen für deine Sammlungen
type BlogPost = CollectionEntry<'blog'>;

// Komponenten-Prop-Typ
interface Props {
	post: BlogPost;
}
```

## Zusammenfassung

Content Collections bieten eine leistungsstarke und typsichere Möglichkeit, mit Markdown und anderen Inhaltsformaten in Astro zu arbeiten. Sie helfen dir, deine Inhalte zu organisieren, zu validieren und effizient zu verwenden.

Mit Content Collections kannst du komplexe, inhaltsreiche Websites wie Blogs, Dokumentationen und Portfolios einfach erstellen und verwalten.
