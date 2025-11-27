---
title: "Erste Schritte mit Astro"
description: "Eine Einführung in Astro und wie du dein erstes Projekt startest."
pubDate: 2025-03-15
category: "Business"
featured: true
image: "/images/tutorials/nobackground/website-with-astro-bauntown-tutorial.png"
author: "Till Schneider"
---

# Erste Schritte mit Astro

Astro ist ein modernes Web-Framework für die Erstellung von schnellen, inhaltsorientierten Websites. In diesem Tutorial lernst du die Grundlagen von Astro kennen und wie du dein erstes Projekt startest.

## Was ist Astro?

Astro ist ein **All-in-One Web-Framework** mit Fokus auf Content und Performance. Es ermöglicht dir, Websites mit weniger JavaScript bei gleichzeitiger Beibehaltung einer reaktiven Benutzeroberfläche zu erstellen.

Die Hauptvorteile von Astro sind:

- **Inhaltszentrierung**: Optimiert für inhaltsorientierte Websites wie Blogs, E-Commerce und Dokumentationsseiten
- **Server-First**: Verschiebt so viel Arbeit wie möglich vom Browser auf den Server
- **Zero-JS Standard**: Kein JavaScript wird standardmäßig an den Browser gesendet
- **Edge-ready**: Deployment überall - auch am Edge
- **Anpassbar**: Tailwind, MDX und über 100 Integrationen zur Auswahl
- **UI-agnostisch**: Unterstützt React, Preact, Svelte, Vue, Solid, Lit und mehr

## Astro installieren

Mit npm kannst du ein neues Astro-Projekt ganz einfach erstellen:

```bash
# Neues Projekt mit npm erstellen
npm create astro@latest
```

Der Astro-Installationsassistent führt dich durch die Schritte zur Einrichtung deines neuen Projekts. Du kannst eine Vorlage auswählen, TypeScript hinzufügen und vieles mehr.

## Projektstruktur

Ein typisches Astro-Projekt sieht so aus:

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

Die wichtigsten Verzeichnisse sind:

- `src/pages/`: Enthält deine Seiten. Jede `.astro`-Datei wird zu einer Route auf deiner Website.
- `src/components/`: Enthält wiederverwendbare UI-Komponenten.
- `src/layouts/`: Enthält Layouts für deine Seiten.
- `public/`: Enthält statische Assets wie Bilder und Schriftarten.

## Astro-Komponenten

Astro-Komponenten sind die Grundbausteine einer Astro-Website. Sie verwenden eine HTML-ähnliche Syntax mit JSX-Expressions:

```astro
---
// Der Component Script (JS/TS)
const greeting = "Hallo";
const name = "Astro";
---

<!-- Komponenten-Template (HTML + JS Expressions) -->
<div>
  <h1>{greeting}, {name}!</h1>
  <p>Willkommen zu Astro!</p>
</div>

<style>
  /* Komponenten-Styles (skopiert) */
  h1 {
    color: navy;
  }
</style>
```

## Inhalts-Collections

Astro v2.0+ führte Content Collections ein, die einen strukturierten Weg bieten, um mit Markdown, MDX und anderen Inhaltsformaten zu arbeiten:

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

## Routing und Navigation

Astro verwendet ein dateibasiertes Routing-System. Alle `.astro`, `.md` oder `.mdx` Dateien in deinem `src/pages/` Verzeichnis werden automatisch zu Seiten auf deiner Website:

- `src/pages/index.astro` → `yourdomain.com/`
- `src/pages/about.astro` → `yourdomain.com/about`
- `src/pages/posts/post-1.md` → `yourdomain.com/posts/post-1`

## Mehrsprachige Websites

Astro bietet verschiedene Möglichkeiten, mehrsprachige Websites zu erstellen:

1. Mit Routing-Parametern: `src/pages/[lang]/about.astro`
2. Mit Content Collections und Filtern nach Sprache
3. Mit Integrationen wie `astro-i18n-aut`

## Nächste Schritte

Nachdem du die Grundlagen erlernt hast, könntest du:

1. Eine neue Komponente erstellen
2. Eine neue Seite hinzufügen
3. Mit Content Collections arbeiten
4. Einen Blog oder ein Portfolio einrichten
5. Eine Integration wie React oder Tailwind CSS hinzufügen

Viel Spaß beim Entwickeln mit Astro!