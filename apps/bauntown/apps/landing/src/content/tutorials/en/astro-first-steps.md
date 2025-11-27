---
title: "Getting Started with Astro"
description: "An introduction to Astro and how to start your first project."
pubDate: 2025-03-15
category: "Business"
featured: true
image: "/images/tutorials/nobackground/website-with-astro-bauntown-tutorial.png"
author: "Till Schneider"
---

# Getting Started with Astro

Astro is a modern web framework for building fast, content-focused websites. In this tutorial, you'll learn the basics of Astro and how to start your first project.

## What is Astro?

Astro is an **all-in-one web framework** focused on content and performance. It allows you to build websites with less JavaScript while maintaining a reactive user interface.

The main benefits of Astro are:

- **Content-focused**: Optimized for content-rich websites like blogs, e-commerce, and documentation
- **Server-first**: Shifts as much work as possible from the browser to the server
- **Zero-JS by default**: No JavaScript is sent to the browser by default
- **Edge-ready**: Deploy anywhere - including at the edge
- **Customizable**: Tailwind, MDX, and over 100 integrations to choose from
- **UI-agnostic**: Supports React, Preact, Svelte, Vue, Solid, Lit, and more

## Installing Astro

You can easily create a new Astro project using npm:

```bash
# Create a new project with npm
npm create astro@latest
```

The Astro setup wizard will guide you through the steps to set up your new project. You can choose a template, add TypeScript, and more.

## Project Structure

A typical Astro project looks like this:

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

The key directories are:

- `src/pages/`: Contains your pages. Each `.astro` file becomes a route on your website.
- `src/components/`: Contains reusable UI components.
- `src/layouts/`: Contains layouts for your pages.
- `public/`: Contains static assets like images and fonts.

## Astro Components

Astro components are the building blocks of an Astro website. They use an HTML-like syntax with JSX expressions:

```astro
---
// The Component Script (JS/TS)
const greeting = "Hello";
const name = "Astro";
---

<!-- Component Template (HTML + JS Expressions) -->
<div>
  <h1>{greeting}, {name}!</h1>
  <p>Welcome to Astro!</p>
</div>

<style>
  /* Component Styles (scoped) */
  h1 {
    color: navy;
  }
</style>
```

## Content Collections

Astro v2.0+ introduced Content Collections, which provide a structured way to work with Markdown, MDX, and other content formats:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  'blog': blogCollection,
};
```

## Routing and Navigation

Astro uses a file-based routing system. All `.astro`, `.md`, or `.mdx` files in your `src/pages/` directory automatically become pages on your website:

- `src/pages/index.astro` → `yourdomain.com/`
- `src/pages/about.astro` → `yourdomain.com/about`
- `src/pages/posts/post-1.md` → `yourdomain.com/posts/post-1`

## Multilingual Websites

Astro offers various ways to create multilingual websites:

1. Using routing parameters: `src/pages/[lang]/about.astro`
2. Using content collections and filtering by language
3. Using integrations like `astro-i18n-aut`

## Next Steps

After learning the basics, you might want to:

1. Create a new component
2. Add a new page
3. Work with content collections
4. Set up a blog or portfolio
5. Add an integration like React or Tailwind CSS

Happy developing with Astro!