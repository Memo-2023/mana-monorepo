---
title: "Content Collections in Astro"
description: "How to use Content Collections for structured content in Astro."
pubDate: 2025-03-18
category: "Marketing"
---

# Content Collections in Astro

Content Collections are a powerful feature in Astro that allows you to organize and validate Markdown, MDX, and other content formats. In this tutorial, you'll learn how to create and use Content Collections.

## What are Content Collections?

Content Collections provide you with:

- A structured system for organizing your content
- Type safety and validation with schemas
- Simplified access to your content through an API

## Setting up Content Collections

Here's how to set up Content Collections:

1. Create a `content/` directory in your `src/` folder
2. Create subdirectories for your collections (e.g. `src/content/blog/`)
3. Create a `src/content/config.ts` file to define your collections

Here's an example configuration file:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content', // 'content' or 'data'
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).default(['general']),
    image: z.string().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
};
```

## Adding Content

After setup, you can add Markdown or MDX files to your collections:

```markdown
---
title: "My First Post"
description: "This is my first blog post using Astro Content Collections."
pubDate: 2025-03-10
tags: ["astro", "markdown"]
---

# My First Post

Here's the content of my first post.
```

## Accessing Collections

You can access your collections using the `getCollection` or `getEntry` functions:

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Get all entries in a collection
const allBlogPosts = await getCollection('blog');

// Filter by specific criteria
const featuredPosts = await getCollection('blog', ({ data }) => {
  return data.tags.includes('featured');
});

// Get a specific entry
const specificPost = await getEntry('blog', 'post-slug');
---

<ul>
  {allBlogPosts.map(post => (
    <li>
      <a href={`/blog/${post.slug}`}>{post.data.title}</a>
    </li>
  ))}
</ul>
```

## Rendering Content

To render the content of an entry, you first need to call the `render()` method:

```astro
---
import { getEntry } from 'astro:content';
import BlogLayout from '../layouts/BlogLayout.astro';

// Get entry from URL parameter
const { slug } = Astro.params;
const entry = await getEntry('blog', slug);

// Render the content
const { Content } = await entry.render();
---

<BlogLayout frontmatter={entry.data}>
  <Content />
</BlogLayout>
```

## Type Safety

Content Collections provide full TypeScript integration, giving you access to types for your collections:

```typescript
import type { CollectionEntry } from 'astro:content';

// Types for your collections
type BlogPost = CollectionEntry<'blog'>;

// Component prop type
interface Props {
  post: BlogPost;
}
```

## Summary

Content Collections provide a powerful and type-safe way to work with Markdown and other content formats in Astro. They help you organize, validate, and efficiently use your content.

With Content Collections, you can easily create and manage complex, content-rich websites like blogs, documentation, and portfolios.