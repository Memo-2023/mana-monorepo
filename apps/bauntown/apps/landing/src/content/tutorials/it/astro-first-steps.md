---
title: "Primi passi con Astro"
description: "Un'introduzione ad Astro e come iniziare il tuo primo progetto."
pubDate: 2025-03-15
category: "Business"
featured: true
image: "/images/tutorials/nobackground/website-with-astro-bauntown-tutorial.png"
author: "Till Schneider"
---

# Primi passi con Astro

Astro è un framework web moderno per creare siti web veloci e orientati ai contenuti. In questo tutorial, imparerai le basi di Astro e come iniziare il tuo primo progetto.

## Cos'è Astro?

Astro è un **framework web all-in-one** focalizzato su contenuti e prestazioni. Ti permette di costruire siti web con meno JavaScript mantenendo un'interfaccia utente reattiva.

I principali vantaggi di Astro sono:

- **Orientato ai contenuti**: Ottimizzato per siti web ricchi di contenuti come blog, e-commerce e documentazione
- **Server-first**: Sposta quanto più lavoro possibile dal browser al server
- **Zero-JS di default**: Nessun JavaScript viene inviato al browser per impostazione predefinita
- **Pronto per l'Edge**: Puoi effettuare il deployment ovunque - anche sull'edge
- **Personalizzabile**: Tailwind, MDX, e oltre 100 integrazioni tra cui scegliere
- **UI-agnostico**: Supporta React, Preact, Svelte, Vue, Solid, Lit e altro ancora

## Installare Astro

Puoi creare facilmente un nuovo progetto Astro utilizzando npm:

```bash
# Crea un nuovo progetto con npm
npm create astro@latest
```

La procedura guidata di configurazione di Astro ti guiderà attraverso i passi per configurare il tuo nuovo progetto. Puoi scegliere un template, aggiungere TypeScript e altro ancora.

## Struttura del progetto

Un tipico progetto Astro si presenta così:

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

Le directory chiave sono:

- `src/pages/`: Contiene le tue pagine. Ogni file `.astro` diventa una route sul tuo sito web.
- `src/components/`: Contiene componenti UI riutilizzabili.
- `src/layouts/`: Contiene layout per le tue pagine.
- `public/`: Contiene asset statici come immagini e font.

## Componenti Astro

I componenti Astro sono i blocchi di costruzione di un sito web Astro. Utilizzano una sintassi simile a HTML con espressioni JSX:

```astro
---
// Lo Script del Componente (JS/TS)
const saluto = "Ciao";
const nome = "Astro";
---

<!-- Template del Componente (HTML + Espressioni JS) -->
<div>
  <h1>{saluto}, {nome}!</h1>
  <p>Benvenuto in Astro!</p>
</div>

<style>
  /* Stili del Componente (con scope) */
  h1 {
    color: navy;
  }
</style>
```

## Content Collections

Astro v2.0+ ha introdotto le Content Collections, che forniscono un modo strutturato per lavorare con Markdown, MDX e altri formati di contenuto:

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

## Routing e Navigazione

Astro utilizza un sistema di routing basato sui file. Tutti i file `.astro`, `.md` o `.mdx` nella tua directory `src/pages/` diventano automaticamente pagine sul tuo sito web:

- `src/pages/index.astro` → `yourdomain.com/`
- `src/pages/about.astro` → `yourdomain.com/about`
- `src/pages/posts/post-1.md` → `yourdomain.com/posts/post-1`

## Siti Web Multilingua

Astro offre vari modi per creare siti web multilingua:

1. Utilizzando parametri di routing: `src/pages/[lang]/about.astro`
2. Utilizzando Content Collections e filtrando per lingua
3. Utilizzando integrazioni come `astro-i18n-aut`

## Prossimi passi

Dopo aver imparato le basi, potresti voler:

1. Creare un nuovo componente
2. Aggiungere una nuova pagina
3. Lavorare con Content Collections
4. Configurare un blog o un portfolio
5. Aggiungere un'integrazione come React o Tailwind CSS

Buon sviluppo con Astro!