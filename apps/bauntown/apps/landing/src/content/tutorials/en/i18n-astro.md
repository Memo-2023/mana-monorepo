---
title: 'Multilingual Websites with Astro'
description: 'A comprehensive guide to implementing i18n in Astro projects.'
pubDate: 2025-03-20
category: 'Branding'
---

# Multilingual Websites with Astro

Astro offers several approaches for creating multilingual (i18n) websites. In this tutorial, you'll learn how to build a multilingual website with Astro.

## Overview of Approaches

There are different approaches to implementing i18n in Astro:

1. **Manual routing** with `[lang]` parameters
2. **Content Collections** with language-specific subdirectories
3. **i18n integrations** like `astro-i18n-aut`

We'll explore each of these approaches in detail.

## Manual Routing

The simplest approach uses file-based routing with dynamic parameters:

```
src/pages/[lang]/index.astro
src/pages/[lang]/about.astro
src/pages/index.astro (default language)
src/pages/about.astro (default language)
```

In your components, you can then:

```astro
---
// src/pages/[lang]/index.astro
const { lang } = Astro.params;
---

<html lang={lang}>
	<!-- Page content -->
</html>
```

## Managing Translations

Create a central file for translations:

```typescript
// src/i18n/ui.ts
export const languages = {
	en: 'English',
	de: 'Deutsch',
};

export const defaultLang = 'en';

export const ui = {
	en: {
		'nav.home': 'Home',
		'nav.about': 'About',
	},
	de: {
		'nav.home': 'Startseite',
		'nav.about': 'Über uns',
	},
};
```

And helper functions:

```typescript
// src/utils/i18n.ts
import { ui, defaultLang } from '../i18n/ui';

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split('/');
	if (lang in ui) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: keyof (typeof ui)[typeof defaultLang]) {
		return ui[lang][key] || ui[defaultLang][key];
	};
}
```

Use them in your components:

```astro
---
import { getLangFromUrl, useTranslations } from '../utils/i18n';

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<nav>
	<a href="/">{t('nav.home')}</a>
	<a href="/about">{t('nav.about')}</a>
</nav>
```

## Content Collections for Multilingual Content

You can use Content Collections to manage translated content:

```
src/content/blog/en/post-1.md
src/content/blog/de/post-1.md
```

Then access content specifically:

```astro
---
import { getCollection } from 'astro:content';

// Get current language from URL
const { lang } = Astro.params;

// Get posts in the current language
const posts = await getCollection('blog', ({ id }) => {
	return id.startsWith(`${lang}/`);
});
---

<ul>
	{
		posts.map((post) => (
			<li>
				<a href={`/${lang}/blog/${post.slug.split('/')[1]}`}>{post.data.title}</a>
			</li>
		))
	}
</ul>
```

## Using an i18n Integration

For more advanced features, you can use an integration like `astro-i18n-aut`:

```bash
npm install astro-i18n-aut
```

Configure it in `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import i18n from 'astro-i18n-aut/integration';

export default defineConfig({
	integrations: [
		i18n({
			defaultLang: 'en',
			supportedLangs: ['en', 'de'],
			showDefaultLang: false,
		}),
	],
});
```

This integration provides many features like automatic redirects, URL translation, and more.

## Creating a Language Switcher

An important element of multilingual websites is the language switcher:

```astro
---
import { languages } from '../i18n/ui';
const { currentLang } = Astro.props;

const currentPath = Astro.url.pathname;

const getPathInLang = (targetLang: string) => {
	// Convert path to another language
	const segments = currentPath.split('/').filter(Boolean);

	if (segments.length === 0) {
		return targetLang === 'en' ? '/' : `/${targetLang}`;
	}

	if (Object.keys(languages).includes(segments[0])) {
		segments[0] = targetLang;
	} else {
		segments.unshift(targetLang);
	}

	return `/${segments.join('/')}`;
};
---

<div class="language-selector">
	{
		Object.entries(languages).map(([code, name]) => (
			<a href={getPathInLang(code)} class={currentLang === code ? 'active' : ''}>
				{name}
			</a>
		))
	}
</div>
```

## Summary

Astro provides flexible options for creating multilingual websites. Whether you prefer a manual approach or use a specialized integration depends on your specific requirements.

With a clear structure for translations and the right helper functions, you can create a seamless multilingual user experience.
