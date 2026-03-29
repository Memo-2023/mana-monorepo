---
title: 'Siti Web Multilingua con Astro'
description: "Una guida completa all'implementazione di i18n nei progetti Astro."
pubDate: 2025-03-20
category: 'Branding'
---

# Siti Web Multilingua con Astro

Astro offre diversi approcci per creare siti web multilingua (i18n). In questo tutorial, imparerai come costruire un sito web multilingua con Astro.

## Panoramica degli Approcci

Ci sono diversi approcci per implementare i18n in Astro:

1. **Routing manuale** con parametri `[lang]`
2. **Content Collections** con sottodirectory specifiche per lingua
3. **Integrazioni i18n** come `astro-i18n-aut`

Esploreremo ciascuno di questi approcci in dettaglio.

## Routing Manuale

L'approccio più semplice utilizza il routing basato sui file con parametri dinamici:

```
src/pages/[lang]/index.astro
src/pages/[lang]/about.astro
src/pages/index.astro (lingua predefinita)
src/pages/about.astro (lingua predefinita)
```

Nei tuoi componenti, puoi quindi:

```astro
---
// src/pages/[lang]/index.astro
const { lang } = Astro.params;
---

<html lang={lang}>
	<!-- Contenuto della pagina -->
</html>
```

## Gestire le Traduzioni

Crea un file centrale per le traduzioni:

```typescript
// src/i18n/ui.ts
export const languages = {
	it: 'Italiano',
	en: 'English',
};

export const defaultLang = 'it';

export const ui = {
	it: {
		'nav.home': 'Home',
		'nav.about': 'Chi siamo',
	},
	en: {
		'nav.home': 'Home',
		'nav.about': 'About',
	},
};
```

E funzioni helper:

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

Usale nei tuoi componenti:

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

## Content Collections per Contenuti Multilingua

Puoi utilizzare Content Collections per gestire contenuti tradotti:

```
src/content/blog/it/post-1.md
src/content/blog/en/post-1.md
```

Poi accedi ai contenuti specificamente:

```astro
---
import { getCollection } from 'astro:content';

// Ottieni la lingua corrente dall'URL
const { lang } = Astro.params;

// Ottieni i post nella lingua corrente
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

## Utilizzare un'Integrazione i18n

Per funzionalità più avanzate, puoi utilizzare un'integrazione come `astro-i18n-aut`:

```bash
npm install astro-i18n-aut
```

Configurala in `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import i18n from 'astro-i18n-aut/integration';

export default defineConfig({
	integrations: [
		i18n({
			defaultLang: 'it',
			supportedLangs: ['it', 'en'],
			showDefaultLang: false,
		}),
	],
});
```

Questa integrazione fornisce molte funzionalità come reindirizzamenti automatici, traduzione degli URL e altro.

## Creare un Selettore di Lingua

Un elemento importante dei siti web multilingua è il selettore di lingua:

```astro
---
import { languages } from '../i18n/ui';
const { currentLang } = Astro.props;

const currentPath = Astro.url.pathname;

const getPathInLang = (targetLang: string) => {
	// Converti il percorso in un'altra lingua
	const segments = currentPath.split('/').filter(Boolean);

	if (segments.length === 0) {
		return targetLang === 'it' ? '/' : `/${targetLang}`;
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

## Riepilogo

Astro fornisce opzioni flessibili per creare siti web multilingua. Che tu preferisca un approccio manuale o utilizzi un'integrazione specializzata dipende dalle tue esigenze specifiche.

Con una struttura chiara per le traduzioni e le giuste funzioni helper, puoi creare un'esperienza utente multilingua senza soluzione di continuità.
