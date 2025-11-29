# Content-Optimierungs-Plan für SEO-Keywords

## Übersicht

Dieser Plan zeigt, wie wir die bestehende Website-Struktur und Content Collections optimal für die identifizierten Keywords nutzen und erweitern können.

## Aktuelle Website-Struktur

### Bestehende Seiten (src/pages/[lang]/)
- `index.astro` - Homepage
- `about.astro` - Über uns
- `contact.astro` - Kontakt
- `imprint.astro` - Impressum  
- `meeting-protokoll-software.astro` - **BEREITS VORHANDEN!** ✅
- `prices.astro` - Preise
- `screenshots-demo.astro` - Screenshots
- `terms.astro` - AGB

### Content Collections (16 Collections)
1. **blog** - Blog-Artikel
2. **features** - Feature-Beschreibungen
3. **industries** - Branchen-Lösungen
4. **guides** - Anleitungen
5. **team** - Team-Mitglieder
6. **testimonials** - Kundenstimmen
7. **faqs** - Häufige Fragen
8. **blueprints** - Vorlagen
9. **memories** - Erinnerungen
10. **statistics** - Statistiken
11. **changelog** - Änderungen
12. **wallpapers** - Hintergründe
13. **authors** - Autoren
14. **pages** - Seiten-Content
15. **dataprotection** - Datenschutz
16. **calendar** - Kalender (intern)

## Keyword-Mapping & Optimierungs-Strategie

### 1. SOFORT OPTIMIEREN - Bestehende Seiten

#### A. Meeting-Protokoll-Software Hub ✅ VORHANDEN
**Seite:** `/[lang]/meeting-protokoll-software.astro`
**Target Keywords:**
- protokoll software (31 Impressions, Position 29.45)
- besprechungsprotokoll software (28 Impressions, Position 38.82)
- meeting protokoll software (7 Impressions, Position 22.29)
- protokollsoftware (1 Klick, 43 Impressions)
- software protokollerstellung (15 Impressions, Position 21.07)

**Optimierungen:**
```astro
// Title Tag optimieren
<title>Protokoll Software - KI Meeting-Protokolle | Memoro</title>

// Meta Description
<meta name="description" content="Automatische Protokoll-Software für Meetings. KI-gestützte Besprechungsprotokoll-Software mit Spracherkennung. Kostenlos testen!">

// H1 optimieren
<h1>Protokoll-Software für automatische Meeting-Dokumentation</h1>

// Content-Struktur
- Section: "Besprechungsprotokoll Software Features"
- Section: "Meeting Protokoll Software Vorteile"
- Section: "Protokollsoftware kostenlos testen"
```

#### B. Pricing Page Optimierung
**Seite:** `/[lang]/prices.astro`
**Target Keywords:**
- memorae.ai pricing (57 Impressions, Position 5.86)
- memorae ai pricing (8 Impressions, Position 4.75)
- mana preis (30 Impressions, Position 79.83)

**Optimierungen:**
```astro
// URL ändern zu /preise für DE
// Title Tag
<title>Memoro Preise - Memorae.ai Pricing & Mana Credits</title>

// Strukturierte Daten hinzufügen
<script type="application/ld+json">
{
  "@type": "SoftwareApplication",
  "name": "Memoro",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "0",
    "highPrice": "99"
  }
}
</script>
```

#### C. Homepage Optimierung
**Seite:** `/[lang]/index.astro`
**Target Keywords:**
- memoro (144 Klicks, Position 6.33 → Top 3)
- memo app (184 Impressions, Position 57.75)
- memos (145 Impressions, Position 93.2)
- memo ai (59 Impressions, Position 75.12)

**Optimierungen:**
```astro
// Title Tag
<title>Memoro - KI Memo App für Meeting-Dokumentation | memoro.ai</title>

// H1 mit Varianten
<h1>Memoro: Die intelligente Memo App mit KI</h1>

// Neue Sections hinzufügen
<section id="memo-app">
  <h2>Die beste Memo App für Teams</h2>
  <!-- Content über Memo App Features -->
</section>

<section id="memos-ai">
  <h2>Memos mit künstlicher Intelligenz erstellen</h2>
  <!-- AI Features hervorheben -->
</section>
```

### 2. NEUE SEITEN MIT CONTENT COLLECTIONS

#### A. KI-Entscheidungsfindung Hub
**Neue Seite:** `/[lang]/ki-entscheidungsfindung/index.astro`
**Content Collection:** Neue Sub-Collection unter `features`

```typescript
// src/content/features/de/ki-entscheidungsfindung.mdx
---
title: "KI-Entscheidungsfindung mit Memoro"
description: "KI-gestützte Entscheidungen treffen mit automatischer Dokumentation"
icon: "brain"
category: "ai-features"
keywords: 
  - "ki entscheidungsfindung"
  - "ki-gestützte entscheidungen"
  - "ki gestützte entscheidungsfindung"
  - "ai-entscheidungsfindung"
---
```

**Verwandte FAQs erstellen:**
```typescript
// src/content/faqs/de/ki-entscheidung-*.mdx
- Was ist KI-Entscheidungsfindung?
- Wie unterstützt Memoro bei Entscheidungen?
- KI-gestützte Entscheidungen Beispiele
```

#### B. Gesundheitswesen Portal
**Neue Seite:** `/[lang]/industries/gesundheitswesen/index.astro`
**Content Collection:** `industries` erweitern

```typescript
// src/content/industries/de/gesundheitswesen.mdx
---
title: "Memoro für Gesundheitswesen"
description: "Patientendokumentation App für Ärzte, Pflegedienste und Kliniken"
icon: "medical"
color: "blue"
keyFeatures:
  - "DSGVO-konforme Patientendokumentation"
  - "Pflegedokumentation mit Datenschutz"
  - "Zahnarzt Dokumentation digital"
keywords:
  - "app patientendokumentation"
  - "pflegedokumentation datenschutz"
  - "dokumentation zahnarztpraxis"
---
```

**Unterseiten über Collection:**
- `/patientendokumentation` - 120 Impressions
- `/pflegedokumentation` - 34 Impressions
- `/zahnarztpraxis` - 13 Impressions

#### C. Baubranche Portal
**Neue Seite:** `/[lang]/industries/bau/index.astro`
**Content Collections nutzen:**

```typescript
// src/content/industries/de/baubranche.mdx
---
title: "Memoro für Baubranche & Handwerk"
keywords:
  - "baustellendokumentation"
  - "mängelverfolgung"
  - "protokollsoftware bau"
  - "baumeister app"
  - "ai handwerk lösung"
---

// src/content/blueprints/de/baustellenprotokoll.mdx
---
title: "Baustellenprotokoll Vorlage"
industry: "construction"
---

// src/content/guides/de/baustellendoku-anleitung.mdx
---
title: "Baustellendokumentation mit Memoro"
category: "Bau & Handwerk"
difficulty: "beginner"
---
```

### 3. FEATURES COLLECTION ERWEITERN

#### Bestehende Features optimieren
```bash
src/content/features/
├── de/
│   ├── memoro-drive.mdx (NEU - 77 Impressions)
│   ├── audio-upload.mdx (OPTIMIEREN)
│   ├── meeting-zeitersparnis.mdx (NEU - 79 Impressions)
│   └── aussendienst-dokumentation.mdx (NEU - 48 Impressions)
└── en/
    ├── ai-powered-decision-making.mdx (NEU - 148 Impressions)
    └── memo-ai.mdx (NEU - 59 Impressions)
```

### 4. BLOG-STRATEGIE für Long-Tail Keywords

#### High-Impact Blog-Artikel erstellen
```typescript
// src/content/blog/de/
- zeitersparnis-durch-ki-in-meetings.mdx (79 Impressions)
- ki-gestuetzte-entscheidungen-guide.mdx (70 Impressions)
- automatische-protokollierung-vorteile.mdx (5 Impressions)
- baustellendokumentation-best-practices.mdx
- patientendokumentation-dsgvo.mdx
```

### 5. FAQ COLLECTION für Featured Snippets

#### Strategische FAQs für Zero-Click-Keywords
```typescript
// src/content/faqs/de/
category: 'features'
- was-ist-protokoll-software.mdx
- memo-app-vs-memoro.mdx
- ki-entscheidungsfindung-erklaert.mdx

category: 'industries'
- patientendokumentation-app-vorteile.mdx
- baustellendokumentation-pflicht.mdx
- aussendienst-dokumentation-tools.mdx

category: 'pricing'
- memoro-pricing-erklaert.mdx
- mana-credits-kosten.mdx
```

## Content-Optimierungs-Matrix

| Keyword-Cluster | Hauptseite | Content Collections | Blog | FAQ | Guide |
|-----------------|------------|-------------------|------|-----|-------|
| Protokoll-Software | meeting-protokoll-software.astro ✅ | features | 2 | 3 | 1 |
| KI-Entscheidung | /ki-entscheidungsfindung (NEU) | features, industries | 3 | 4 | 2 |
| Gesundheit | /industries/gesundheitswesen (NEU) | industries, testimonials | 2 | 5 | 3 |
| Bau/Handwerk | /industries/bau (NEU) | industries, blueprints | 3 | 4 | 2 |
| Memo App | index.astro (OPTIMIERT) | features | 1 | 2 | 1 |
| Pricing | prices.astro (OPTIMIERT) | pages | 1 | 3 | - |
| Außendienst | /aussendienst (NEU) | features, industries | 2 | 3 | 2 |

## Technische SEO-Optimierungen

### 1. URL-Struktur verbessern
```
ALT: /[lang]/features/[...slug]
NEU: /[lang]/funktionen/[feature-name] (DE)
     /[lang]/features/[feature-name] (EN)

ALT: /[lang]/industries/[...slug]
NEU: /[lang]/branchen/[branche] (DE)
     /[lang]/industries/[industry] (EN)
```

### 2. Interne Verlinkung
```astro
// Component für verwandte Links
<RelatedContent 
  keywords={["protokoll software", "meeting protokoll"]}
  collections={["features", "guides", "faqs"]}
/>
```

### 3. Schema Markup für alle Collections
```typescript
// Für jede Collection spezifisches Schema
- SoftwareApplication (features)
- HowTo (guides)
- FAQPage (faqs)
- Organization (industries)
- Review (testimonials)
```

### 4. Sitemap-Prioritäten
```xml
<!-- High Priority (0.9-1.0) -->
<url>
  <loc>/de/meeting-protokoll-software</loc>
  <priority>1.0</priority>
</url>
<url>
  <loc>/de/preise</loc>
  <priority>0.9</priority>
</url>

<!-- Medium Priority (0.6-0.8) -->
<url>
  <loc>/de/ki-entscheidungsfindung</loc>
  <priority>0.8</priority>
</url>
```

## Content-Erstellungs-Roadmap

### Woche 1: Quick Wins
- [ ] meeting-protokoll-software.astro optimieren
- [ ] prices.astro SEO-Update
- [ ] Homepage für "memo app" optimieren
- [ ] 5 strategische FAQs erstellen

### Woche 2: Features erweitern
- [ ] memoro-drive.mdx Feature-Seite
- [ ] ki-entscheidungsfindung.mdx erstellen
- [ ] audio-upload.mdx optimieren
- [ ] 3 Blog-Artikel zu Protokoll-Software

### Woche 3: Branchen-Portale
- [ ] Gesundheitswesen Industry Collection
- [ ] Baubranche Industry Collection
- [ ] Außendienst Feature-Seite
- [ ] Je 3 Guides pro Branche

### Woche 4: Content-Vertiefung
- [ ] 10 weitere FAQs für Featured Snippets
- [ ] Blueprints für Branchen erstellen
- [ ] Testimonials kategorisieren
- [ ] Interne Verlinkung optimieren

## Metriken & Monitoring

### KPIs pro Content-Typ
- **Pages**: Position-Verbesserung, CTR
- **Features**: Engagement, Time on Page
- **Industries**: Conversions, Lead-Qualität
- **Blog**: Organic Traffic, Shares
- **FAQs**: Featured Snippet Rate
- **Guides**: Completion Rate

### Tracking-Setup
```javascript
// GTM Custom Events
dataLayer.push({
  'event': 'content_engagement',
  'content_type': 'feature',
  'keyword_cluster': 'protokoll-software',
  'engagement_depth': '75%'
});
```

## Best Practices für Content-Erstellung

### 1. Keyword-Integration
- Primäres Keyword im H1
- Sekundäre Keywords in H2/H3
- Long-tail Keywords in FAQ-Sections
- Semantische Varianten im Fließtext

### 2. Content-Länge nach Collection
- **Features**: 800-1200 Wörter
- **Industries**: 1500-2000 Wörter
- **Guides**: 1000-1500 Wörter
- **Blog**: 1200-2000 Wörter
- **FAQs**: 150-300 Wörter pro Frage

### 3. Multimediale Elemente
- Screenshots für jedes Feature
- Demo-Videos für Hauptfunktionen
- Infografiken für Statistiken
- Testimonial-Videos für Branchen

### 4. Call-to-Actions
```astro
// Kontext-spezifische CTAs
<FeatureCTA keyword="protokoll software" />
// Rendert: "Protokoll-Software kostenlos testen"

<IndustryCTA industry="gesundheitswesen" />
// Rendert: "Demo für Praxis-Dokumentation"
```

## Notizen

- **Priorität 1**: Bestehende Seiten optimieren (Quick Wins)
- **Priorität 2**: Feature Collection für High-Value Keywords erweitern
- **Priorität 3**: Industry-spezifische Portale mit mehreren Collections
- **Vorteil**: Viele Content Collections bereits vorhanden - nur gezielt erweitern
- **Chance**: meeting-protokoll-software.astro bereits vorhanden - perfekt für Protokoll-Keywords!