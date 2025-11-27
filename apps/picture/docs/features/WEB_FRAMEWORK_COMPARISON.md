# Web Framework Comparison: Next.js vs SvelteKit

**Datum:** 2025-10-08
**Kontext:** Evaluation für separate Web-Version der Picture App

## Executive Summary

Für eine Bilder-App mit gleichwertigen Mobile (React Native) und Web Anforderungen wird **Next.js 15** empfohlen, trotz geringerer Unabhängigkeit. Grund: Produktivität, Image Optimization und React-Synergien überwiegen die Nachteile.

---

## Tech Stack Unabhängigkeit

### **SvelteKit** ✅ Unabhängiger

- **Compiler-basiert** - kompiliert zu Vanilla JS
- Keine Runtime Framework (React, Vue, etc.)
- Kleinere Abhängigkeiten
- Weniger Vendor Lock-in
- Zukunftssicherer durch Web Standards

### **Next.js** ⚠️ React-Ökosystem

- Fest an React gebunden
- Braucht React Ökosystem (React Query, etc.)
- Größere Bundle Sizes
- Meta/Vercel-abhängig

---

## Performance

### **SvelteKit** 🚀

- **Extrem schnell** - kein Virtual DOM
- Kleinere Bundles (20-30% weniger)
- Schnelleres First Paint
- Weniger JavaScript zum Browser
- Beispiel: 50KB vs 150KB initial

### **Next.js** 👍

- Gut, aber schwerer
- Virtual DOM Overhead
- Hydration kann langsam sein
- Mehr JavaScript = langsamere Mobile Devices

---

## Developer Experience

### **SvelteKit**

**Vorteile:**

- **Weniger Boilerplate** - 30-40% weniger Code
- Intuitivere Syntax
- Eingebaute Animationen/Transitions
- State Management ohne Extra Libraries
- Server Load Functions elegant

**Beispiel:**

```svelte
<script>
	let count = 0; // Kein useState!
</script>

<button on:click={() => count++}>
	{count}
</button>
```

**Nachteile:**

- Kleinere Community
- Weniger StackOverflow Antworten
- Weniger UI Libraries

### **Next.js**

**Vorteile:**

- **Riesige Community** - jedes Problem schon gelöst
- Tonnen von Libraries
- Mehr Devs verfügbar (Hiring)
- Viele Tutorials
- Besserer Support

**Nachteile:**

- Mehr Boilerplate
- Komplexer (App Router vs Pages Router)
- Hooks-Lernkurve
- useState, useEffect, useMemo, etc.

---

## Supabase Integration

### **Beide gleich gut** ✅

- Supabase JS Client funktioniert überall
- SSR Auth beide gut
- Beide haben offizielle Guides

### **Unterschiede:**

**SvelteKit:**

- Hooks in `+page.server.ts` natürlicher
- Load Functions cleaner

**Next.js:**

- Mehr Beispiele online
- Mehr Tutorials verfügbar

---

## Routing & SSR

### **SvelteKit** 💚

- **File-based Routing** - `+page.svelte`
- Einfacher als Next.js
- Layouts intuitiver
- Loading States eingebaut
- Weniger Magic

### **Next.js** 💛

- File-based Routing - aber komplizierter
- App Router vs Pages Router Verwirrung
- Mehr Konzepte (RSC, Server Actions)
- Steile Lernkurve bei App Router

---

## Ecosystem & Libraries

### **Next.js** ✅ Größer

**UI Libraries:**

- Shadcn/ui (top!)
- Material UI
- Chakra UI
- Ant Design
- Mantine
- Tausende mehr

**Sonstiges:**

- Jede Library hat React Support
- Auth: NextAuth perfekt integriert
- Payments: Stripe Beispiele überall

### **SvelteKit** ⚠️ Kleiner, wachsend

**UI Libraries:**

- Skeleton UI
- DaisyUI (Tailwind-based)
- Carbon Components
- Smelte
- Weniger Auswahl

**Aber:**

- Kann CSS Frameworks nutzen (Tailwind, UnoCSS)
- Viele Web Components nutzbar

---

## Image Handling (kritisch für Picture App!)

### **Next.js** ✅ Exzellent

- `next/image` Component eingebaut
- Automatische Optimierung
- WebP/AVIF Konvertierung
- Lazy Loading
- Blur Placeholder
- **Produktionsreif out of the box**

### **SvelteKit** ⚠️ Braucht Setup

- Kein eingebautes Image Optimization
- Manuell mit Vite Plugins (vite-imagetools)
- Oder externe Services (Cloudinary, imgix)
- Mehr Arbeit nötig

---

## Deployment

### **Beide gut** ✅

**Vercel:** Beide erste Klasse
**Netlify:** Beide gut
**Cloudflare Pages:** Beide möglich
**Self-hosted:** Beide Node oder Adapter

### **Unterschiede:**

**Next.js:**

- Optimiert für Vercel
- Einige Features nur auf Vercel

**SvelteKit:**

- Adapter-System flexibler
- Läuft überall gleich gut

---

## Code Sharing mit React Native

### **Next.js** ✅ Einfacher

- Beide nutzen React
- Components **teilweise** portierbar
- Gleiche Patterns (Hooks)
- Logic besser teilbar

### **SvelteKit** ⚠️ Schwieriger

- Komplett andere Syntax
- Nur Business Logic teilbar
- UI muss komplett neu

---

## Hiring & Team

### **Next.js** ✅

- Jeder React Dev kann Next.js
- Größerer Talent Pool
- Einfacher zu ersetzen

### **SvelteKit** ⚠️

- Kleinere Developer Base
- Schwieriger zu finden
- Aber: React Devs lernen es schnell

---

## Long-term Maintenance

### **SvelteKit** ✅ Stabiler

- Weniger Breaking Changes
- Klare Roadmap
- Web Standards fokussiert
- Weniger Refactoring nötig

### **Next.js** ⚠️ Schnelle Evolution

- App Router große Änderung (2023)
- React Server Components komplex
- Viel Churn
- Öfter Refactoring nötig

---

## Feature-Matrix für Picture App

| Feature              | Next.js      | SvelteKit  | Gewinner      |
| -------------------- | ------------ | ---------- | ------------- |
| Image Optimization   | ✅ Exzellent | ⚠️ Manuell | Next.js       |
| Performance          | 👍 Gut       | 🚀 Besser  | SvelteKit     |
| Supabase Integration | ✅ Gut       | ✅ Gut     | Unentschieden |
| Auth                 | ✅ NextAuth  | ✅ Hooks   | Unentschieden |
| Animations           | 👍 Libraries | ✅ Native  | SvelteKit     |
| SEO                  | ✅ Gut       | ✅ Gut     | Unentschieden |
| Community Support    | ✅ Riesig    | ⚠️ Klein   | Next.js       |
| Bundle Size          | ⚠️ Größer    | ✅ Kleiner | SvelteKit     |
| Code Sharing RN      | ✅ React     | ❌ Neu     | Next.js       |
| Developer Experience | 👍 Gut       | ✅ Besser  | SvelteKit     |

---

## Entscheidungsmatrix

### **Wähle SvelteKit wenn:**

- ✅ Maximale Unabhängigkeit wichtig
- ✅ Performance kritisch
- ✅ Bereit für Image Optimization Setup
- ✅ Zeit zum Lernen vorhanden
- ✅ Kleine, fokussierte Community okay

### **Wähle Next.js wenn:**

- ✅ Schnelle Time-to-Market wichtig
- ✅ Image Optimization out-of-the-box benötigt
- ✅ React-Synergien mit Mobile gewünscht
- ✅ Große Community wichtig
- ✅ Pragmatismus > Idealismus

---

## Empfehlung: Next.js 15 + Tailwind

### Begründung

1. **Image App** - Next.js Image Component ist Gold wert für eine Bilder-App
2. **Produktivität** - Schneller zu produktionsreifem Code
3. **React Native Synergien** - Gleiche Patterns, geteiltes Wissen
4. **Community** - Jedes Problem bereits gelöst
5. **Realismus** - Shipped > Perfect

### Strategie für Unabhängigkeit trotz Next.js

```
/packages
  /shared              # TypeScript Core Logic
    /types             # Supabase Types, Shared Types
    /api               # Supabase Client, API Calls
    /utils             # Business Logic, Helpers

  /mobile              # React Native (existing)

  /web                 # Next.js
    /app               # App Router
    /components        # Web-specific Components
    /lib               # Web-specific Utils
```

**Regeln:**

1. ❌ **Keine Next.js spezifischen Features** außer Image und Routing
2. ✅ **Business Logic in `/shared`** auslagern
3. ✅ **Vercel-unabhängig deployen** (z.B. Cloudflare, Netlify)
4. ✅ **TypeScript überall** - leichter migrierbar
5. ✅ **Supabase als SST** - nicht an Next.js Backend gebunden

### Migrations-Pfad

Durch saubere Architektur bleibt Migration zu SvelteKit möglich:

```
Phase 1: Next.js mit Shared Logic (jetzt)
  ↓
Phase 2: Optional - SvelteKit Parallel-Entwicklung (später)
  ↓
Phase 3: Optional - Migration zu SvelteKit wenn Next.js nervt
```

**80% der Unabhängigkeit durch Architektur, 20% durch Framework.**

---

## Alternative: Expo Web Status

**Warum NICHT Expo Web?**

Die App nutzt viele native-only Features:

- `react-native-worklets` (JSI/Native)
- `react-native-reanimated` (Native Animations)
- `react-native-pager-view` (Native Views)
- `react-native-context-menu-view` (Native Menus)
- Gesten, Zoom, Blur...

**Probleme:**

- 2-5 Tage Debugging für Mocks
- Ständige Workarounds
- Limitierte Features
- Schlechte Performance
- Hohe Frustration

**Fazit:** Expo Web ist nicht für native-lastige Apps gedacht.

---

## Nächste Schritte

1. ✅ **Entscheidung:** Next.js 15
2. ⏭️ **Setup:** Monorepo mit Shared Packages
3. ⏭️ **Migration:** Business Logic aus Mobile extrahieren
4. ⏭️ **Entwicklung:** Web-Version mit Next.js
5. ⏭️ **Deploy:** Cloudflare Pages / Vercel

---

## Ressourcen

### Next.js

- [Next.js Docs](https://nextjs.org/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

### SvelteKit (für Zukunft)

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [SvelteKit + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit)

### Monorepo Setup

- [Turborepo](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

**Stand:** 2025-10-08
**Autor:** Claude Code Evaluation
**Status:** Aktiv, wird bei Bedarf aktualisiert
