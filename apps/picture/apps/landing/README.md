# Landing Page - Picture

Marketing Landing Page für Picture, gebaut mit Astro.

## 🚀 Tech Stack

- **Astro 5.2** - Static Site Generator
- **Tailwind CSS 3.4** - Styling
- **TypeScript** - Type Safety

## 📦 Features

- ✅ Ultraschnell (0 JS by default)
- ✅ SEO-optimiert
- ✅ Static Site Generation
- ✅ Hot Module Replacement (HMR)
- ✅ Tailwind CSS Integration
- ✅ TypeScript Support

## 🛠️ Development

### Voraussetzungen

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Von der Root des Monorepos
pnpm install

# Oder direkt im Landing-Ordner
cd apps/landing
pnpm install
```

### Development Server starten

```bash
# Von der Root
pnpm dev:landing

# Oder direkt im Landing-Ordner
pnpm dev
```

Der Development Server läuft auf: **http://localhost:4321**

### Scripts

```bash
pnpm dev          # Development Server starten
pnpm start        # Alias für dev
pnpm build        # Production Build erstellen (mit Type-Check)
pnpm preview      # Build Preview anzeigen
pnpm type-check   # TypeScript Type Checking
pnpm lint         # Code linten
pnpm format       # Code formatieren mit Prettier
pnpm clean        # Build-Artefakte löschen
```

## 📁 Struktur

```
apps/landing/
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # Base Layout
│   ├── pages/
│   │   └── index.astro        # Homepage
│   ├── styles/
│   │   └── global.css         # Globale Styles
│   └── env.d.ts               # TypeScript Env Definitionen
├── public/                     # Static Assets
├── astro.config.mjs            # Astro Konfiguration
├── tailwind.config.js          # Tailwind Konfiguration
├── tsconfig.json               # TypeScript Konfiguration
└── package.json
```

## 🎨 Styling

Das Projekt verwendet **Tailwind CSS** für Styling:

```html
<!-- Beispiel -->
<div class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold">Welcome to Picture</h1>
</div>
```

### Globale Styles

Globale Styles werden in `src/styles/global.css` definiert und im Layout importiert.

## 🏗️ Build

### Production Build

```bash
pnpm build
```

Output: `dist/` - Enthält alle statischen Dateien für Deployment

### Build Preview

```bash
pnpm preview
```

Zeigt die gebaute Version lokal an: http://localhost:4321

## 🚢 Deployment

Die Landing Page ist eine **statische Website** und kann auf jedem Static Host deployed werden:

### Empfohlene Hosts

1. **Cloudflare Pages** (empfohlen)
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Node Version: 20+

2. **Netlify**
   - Build Command: `pnpm build`
   - Publish Directory: `dist`

3. **Vercel**
   - Build Command: `pnpm build`
   - Output Directory: `dist`

### Cloudflare Pages Deployment

```bash
# Build erstellen
pnpm build

# Via Cloudflare Pages Dashboard deployen
# oder via CLI:
wrangler pages deploy dist
```

## 📝 Content Management

### Neue Seite hinzufügen

Erstelle eine neue `.astro` Datei in `src/pages/`:

```astro
---
// src/pages/about.astro
import Layout from '../layouts/Layout.astro';
---

<Layout title="About - Picture">
  <main>
    <h1>About Us</h1>
    <p>Welcome to Picture</p>
  </main>
</Layout>
```

Die Seite ist dann verfügbar unter: `/about`

### Component erstellen

```astro
---
// src/components/Hero.astro
interface Props {
  title: string;
  subtitle?: string;
}

const { title, subtitle } = Astro.props;
---

<section class="hero">
  <h1>{title}</h1>
  {subtitle && <p>{subtitle}</p>}
</section>

<style>
  .hero {
    text-align: center;
    padding: 4rem 2rem;
  }
</style>
```

## 🔧 Konfiguration

### Astro Config (`astro.config.mjs`)

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
});
```

### Tailwind Config (`tailwind.config.js`)

```javascript
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## 🔍 SEO

Astro ist von Haus aus SEO-optimiert:

- ✅ Server-Side Rendering zur Build-Zeit
- ✅ Keine unnötigen Client-Side JavaScript
- ✅ Optimierte HTML-Struktur
- ✅ Unterstützt Meta Tags out of the box

### SEO Meta Tags hinzufügen

```astro
---
// src/layouts/Layout.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## 📚 Weitere Ressourcen

- [Astro Dokumentation](https://docs.astro.build)
- [Tailwind CSS Dokumentation](https://tailwindcss.com/docs)
- [TypeScript Dokumentation](https://www.typescriptlang.org/docs)

## 🤝 Integration mit Monorepo

Die Landing Page ist Teil des Picture Monorepos:

```bash
# Von der Root alle Apps starten
pnpm dev

# Nur Landing Page starten
pnpm dev:landing

# Landing Page bauen
pnpm build:landing
```

Siehe [Monorepo Docs](../../docs/features/MONOREPO_ARCHITECTURE.md) für Details.
