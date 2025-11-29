---
title: 'Mehrsprachige Websites mit Astro'
description: 'Ein umfassender Leitfaden zur Implementierung von i18n in Astro-Projekten.'
pubDate: 2025-03-20
category: 'Branding'
---

# Mehrsprachige Websites mit Astro

Astro bietet dir verschiedene Möglichkeiten, mehrsprachige (i18n) Websites zu erstellen. In diesem Tutorial lernst du, wie du eine mehrsprachige Website mit Astro aufbauen kannst.

## Übersicht der Ansätze

Es gibt verschiedene Ansätze für die Implementierung von i18n in Astro:

1. **Manuelles Routing** mit `[lang]`-Parametern
2. **Content Collections** mit sprachspezifischen Unterordnern
3. **i18n-Integrationen** wie `astro-i18n-aut`

Wir werden jeden dieser Ansätze im Detail betrachten.

## Manuelles Routing

Der einfachste Ansatz verwendet dateibasiertes Routing mit dynamischen Parametern:

```
src/pages/[lang]/index.astro
src/pages/[lang]/about.astro
src/pages/index.astro (Standardsprache)
src/pages/about.astro (Standardsprache)
```

In deinen Komponenten kannst du dann:

```astro
---
// src/pages/[lang]/index.astro
const { lang } = Astro.params;
---

<html lang={lang}>
	<!-- Seiteninhalt -->
</html>
```

## Übersetzungen verwalten

Erstelle eine zentrale Datei für Übersetzungen:

```typescript
// src/i18n/ui.ts
export const languages = {
	de: 'Deutsch',
	en: 'English',
};

export const defaultLang = 'de';

export const ui = {
	de: {
		'nav.home': 'Startseite',
		'nav.about': 'Über uns',
	},
	en: {
		'nav.home': 'Home',
		'nav.about': 'About',
	},
};
```

Und Hilfsfunktionen:

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

Verwende sie in deinen Komponenten:

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

## Content Collections für Mehrsprachigkeit

Du kannst Content Collections verwenden, um übersetzten Inhalt zu verwalten:

```
src/content/blog/de/post-1.md
src/content/blog/en/post-1.md
```

Dann greife spezifisch auf die Inhalte zu:

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

## Verwendung einer i18n-Integration

Für fortgeschrittenere Funktionen kannst du eine Integration wie `astro-i18n-aut` verwenden:

```bash
npm install astro-i18n-aut
```

Konfiguriere sie in `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import i18n from 'astro-i18n-aut/integration';

export default defineConfig({
	integrations: [
		i18n({
			defaultLang: 'de',
			supportedLangs: ['de', 'en'],
			showDefaultLang: false,
		}),
	],
});
```

Diese Integration bietet viele Funktionen wie automatische Weiterleitungen, URL-Übersetzung und mehr.

## Sprachumschalter erstellen

Ein wichtiges Element mehrsprachiger Websites ist der Sprachumschalter:

```astro
---
import { languages } from '../i18n/ui';
const { currentLang } = Astro.props;

const currentPath = Astro.url.pathname;

const getPathInLang = (targetLang: string) => {
	// Pfad in eine andere Sprache umwandeln
	const segments = currentPath.split('/').filter(Boolean);

	if (segments.length === 0) {
		return targetLang === 'de' ? '/' : `/${targetLang}`;
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

## Zusammenfassung

Astro bietet dir flexible Optionen für die Erstellung mehrsprachiger Websites. Ob du einen manuellen Ansatz bevorzugst oder eine spezialisierte Integration nutzt, hängt von deinen spezifischen Anforderungen ab.

Mit einer klaren Struktur für Übersetzungen und den richtigen Hilfsfunktionen kannst du eine nahtlose mehrsprachige Benutzererfahrung schaffen.
