# Memoro Website - Projekt-Architektur-Dokumentation

## 📋 Übersicht

Die Memoro-Website ist eine **mehrsprachige Marketing-Website** für eine KI-gestützte App zur Gesprächsdokumentation und Notizenerstellung. Die Website wurde mit **Astro 5.3.0** als statische Website entwickelt und unterstützt Deutsch (de) als Standardsprache sowie Englisch (en).

## 🎯 Projektziel

Die Website dient als zentrale Marketing- und Informationsplattform für die Memoro-App und bietet:
- Produktpräsentation und Feature-Übersicht
- Anleitungen und Dokumentation
- Blog und News-Bereich
- Team-Vorstellung
- Preisgestaltung und Pläne
- Branchenspezifische Lösungen
- Download-Möglichkeiten

## 🛠 Technologie-Stack

### Core Framework
- **Astro 5.3.0**: Static Site Generator mit hervorragender Performance
- **TypeScript**: Strict Mode für Typsicherheit
- **MDX**: Für erweiterte Content-Erstellung mit Komponenten

### Styling & UI
- **Tailwind CSS 3.4**: Utility-first CSS Framework
- **Custom Theme System**: Zentralisierte Design-Tokens in `/src/theme/index.js`
- **Typography Plugin**: Für optimale Text-Darstellung
- **Dark Theme**: Durchgängiges dunkles Design (#181818 Hintergrund)

### Content Management
- **Astro Content Collections**: Strukturierte Content-Verwaltung mit Zod-Schemas
- **15+ Content-Typen**: Blog, Team, Features, Guides, Industries, etc.
- **Mehrsprachigkeit**: Vollständige de/en Unterstützung

### Integrationen
- **Sitemap**: Automatische Generierung für alle Sprachen
- **RSS Feeds**: Für jede Content-Collection und Sprache
- **Icons**: Astro-Icon mit Material Design Icons (MDI)
- **Analytics**: Plausible & Umami Integration

## 📁 Projektstruktur

```
/
├── src/
│   ├── components/          # Wiederverwendbare Astro-Komponenten
│   │   ├── atoms/           # Kleine, atomare Komponenten
│   │   ├── detail/          # Detail-Seiten-Komponenten
│   │   ├── experiments/     # A/B-Testing Komponenten
│   │   ├── industries/      # Branchen-spezifische Komponenten
│   │   └── layouts/         # Layout-Komponenten
│   │
│   ├── content/            # Alle Inhalte mit Zod-Schemas
│   │   ├── blog/          # Blog-Artikel (de/en Unterordner)
│   │   ├── team/          # Team-Profile
│   │   ├── features/      # Feature-Beschreibungen
│   │   ├── guides/        # Anleitungen
│   │   ├── industries/    # Branchenlösungen
│   │   ├── testimonials/  # Kundenstimmen
│   │   ├── blueprints/    # Vorlagen für Aufnahmen
│   │   ├── memories/      # Memory-Typen
│   │   ├── faqs/         # Häufige Fragen
│   │   ├── changelog/     # Produkt-Updates
│   │   ├── statistics/    # Nutzungsstatistiken
│   │   ├── calendar/      # Content-Kalender
│   │   ├── authors/       # Autoren-Profile
│   │   ├── wallpapers/    # Hintergrundbilder
│   │   ├── contracts/     # Rechtliche Dokumente
│   │   ├── dataprotection/# Datenschutz-Dokumente
│   │   └── pages/         # Hauptseiten-Inhalte
│   │
│   ├── i18n/              # Internationalisierung
│   │   ├── ui.ts          # UI-Übersetzungen
│   │   └── utils.ts       # i18n-Hilfsfunktionen
│   │
│   ├── layouts/           # Seiten-Layouts
│   │   ├── Layout.astro   # Standard-Layout
│   │   └── HomeLayout.astro # Spezielles Home-Layout
│   │
│   ├── pages/             # Routing-Struktur
│   │   ├── [lang]/        # Dynamisches Sprach-Routing
│   │   ├── admin/         # Admin-Bereich
│   │   ├── de/            # Deutsche RSS-Feeds
│   │   └── en/            # Englische RSS-Feeds
│   │
│   ├── styles/            # Globale Styles
│   │   └── base.css       # Basis-CSS mit Tailwind
│   │
│   ├── theme/             # Theme-Konfiguration
│   │   └── index.js       # Design-System-Tokens
│   │
│   ├── utils/             # Hilfsfunktionen
│   │   └── experiments.ts # A/B-Testing Utilities
│   │
│   └── middleware.ts      # Request-Middleware für i18n
│
├── public/                # Statische Assets
│   ├── images/           # Bilder organisiert nach Typ
│   │   ├── blog/
│   │   ├── brand/
│   │   ├── guides/
│   │   ├── industries/
│   │   ├── product_photos/
│   │   ├── screenshots/
│   │   ├── team/
│   │   └── wallpaper/
│   └── rss/              # RSS-Feed Styles
│
├── docs/                 # Projekt-Dokumentation
├── context/              # Kontext-Dokumente für KI
├── plans/                # Projekt-Pläne
└── posts/                # Social Media Posts
```

## 🌍 Internationalisierung (i18n)

### Konfiguration
- **Default Locale**: Deutsch (`de`)
- **Unterstützte Sprachen**: Deutsch (`de`), Englisch (`en`)
- **Routing**: Präfix-basiert (`/de/...`, `/en/...`)
- **Fallback**: Automatische Weiterleitung zur Standardsprache

### Implementierung
- **Middleware**: Behandelt Sprach-Weiterleitungen und 404s
- **Content-Organisation**: Sprachspezifische Unterordner in Collections
- **UI-Übersetzungen**: Zentralisiert in `src/i18n/ui.ts`
- **Sitemap**: Enthält alle Sprachversionen

## 📚 Content Collections

### Übersicht der Collections

Die Website nutzt **15+ typisierte Content Collections** mit Zod-Schemas:

1. **blog**: Artikel mit Metadaten (Autor, Tags, Kategorie)
2. **team**: Team-Profile mit Rollen und Social Links
3. **features**: Produkt-Features mit Icons und Kategorien
4. **guides**: Tutorials mit Schwierigkeitsgrad und Dauer
5. **industries**: Branchenlösungen mit Statistiken und FAQs
6. **testimonials**: Kundenstimmen nach Typ kategorisiert
7. **blueprints**: Aufnahme-Vorlagen für verschiedene Szenarien
8. **memories**: KI-generierte Inhaltstypen
9. **faqs**: Häufige Fragen nach Kategorien
10. **changelog**: Produkt-Updates und Release Notes
11. **statistics**: Wochen- und Monatsberichte
12. **calendar**: Content-Planung mit Events
13. **authors**: Autoren-Profile mit Statistiken
14. **wallpapers**: Hintergrundbilder mit Download-Tracking
15. **dataprotection**: Datenschutz-Dokumente
16. **contracts**: Rechtliche Dokumente
17. **pages**: Hauptseiten-Inhalte

### Schema-Validierung

Jede Collection hat ein **striktes Zod-Schema** für:
- Typ-Sicherheit
- Konsistente Datenstruktur
- Automatische Validierung beim Build
- IntelliSense-Unterstützung in der IDE

## 🎨 Design-System

### Theme-Konfiguration

Zentralisiertes Theme in `/src/theme/index.js`:

```javascript
{
  colors: {
    primary: '#3B82F6',      // Blau
    secondary: '#10B981',    // Grün
    background: {
      global: '#181818',     // Dunkler Hintergrund
      card: 'rgba(50, 50, 50, 0.8)',
      cardHover: 'rgba(50, 50, 50, 0.99)'
    },
    text: {
      primary: '#F9FAFB',    // Heller Text
      secondary: '#D1D5DB',  // Sekundärer Text
      tertiary: '#9CA3AF'    // Tertiärer Text
    }
  }
}
```

### Tailwind-Erweiterungen

- **Custom Font Sizes**: Hero, Display, Heading mit responsiven Varianten
- **Typography Plugin**: Angepasst für Dark Theme
- **Custom Utilities**: scrollbar-none, bg-gradient-radial
- **Group-Open Variant**: Für Details-Elemente

## 🚀 Build & Deployment

### Build-Prozess
```bash
npm run dev      # Entwicklungsserver (localhost:4321)
npm run build    # Production Build nach ./dist/
npm run preview  # Vorschau des Production Builds
npm run astro check  # TypeScript Type-Checking
```

### Statische Generierung
- **Vollständig statisch**: Alle Seiten werden zur Build-Zeit generiert
- **Keine Server-Runtime**: Optimale Performance
- **getStaticPaths()**: Für dynamische Routen
- **Optimierte Assets**: Automatische Bild-Optimierung mit Sharp

## 📊 Analytics & Tracking

### Plausible Analytics
- **Cookieless Tracking**: DSGVO-konform
- **Event-Tracking**: Detailliertes Nutzerverhalten
- **Funnel-Analyse**: Conversion-Tracking
- **Custom Events**: Download, CTA-Clicks, etc.

### Umami Analytics
- **Self-Hosted Option**: Datenschutz-freundlich
- **Real-Time Stats**: Live-Besucherdaten
- **Keine Cookies**: Privacy-first Ansatz

## 🧪 Experimente & A/B-Testing

### PostHog Integration
- **Feature Flags**: Für kontrollierte Rollouts
- **A/B-Tests**: Hero-Varianten, CTA-Buttons
- **Conversion-Tracking**: Erfolgsmetriken

### Implementierte Tests
- Hero-Section Varianten
- CTA-Button Tests
- Navigation Download-Button

## 🔒 Sicherheit & Datenschutz

### DSGVO-Konformität
- **Datenschutzerklärung**: Mehrsprachig verfügbar
- **Cookie-Consent**: Optional für erweiterte Features
- **Datenminimierung**: Nur notwendige Daten
- **TOMs**: Technische und organisatorische Maßnahmen dokumentiert

### Content Security
- **Statische Generierung**: Keine Server-Vulnerabilities
- **TypeScript**: Typ-sichere Entwicklung
- **Validierung**: Zod-Schemas für alle Inhalte

## 🎯 Besondere Features

### 1. Recording Blueprints
Vorgefertigte Vorlagen für verschiedene Aufnahme-Szenarien:
- Büro-Meetings
- Baustellendokumentation
- Akademische Vorlesungen
- Kundengespräche

### 2. Memory-System
KI-generierte Inhaltstypen aus Aufnahmen:
- Zusammenfassungen
- Aufgaben & Termine
- Blog-Beiträge
- Social Media Posts

### 3. Mana-Credit-System
Flexibles Abrechnungsmodell:
- Tägliche Mana-Gutschriften
- Mana-Potions zum Nachkaufen
- Maximale Mana-Limits je Plan

### 4. Multi-Collection RSS
RSS-Feeds für jede Content-Collection:
- Sprachspezifisch
- Automatisch generiert
- XSLT-Styling

### 5. Content-Kalender
Integrierte Planung für Content-Erstellung:
- Monatsplanung
- Status-Tracking
- Multi-Autor-Support

## 📈 Performance-Optimierungen

### Build-Optimierungen
- **Static Site Generation**: Keine Server-Laufzeit
- **Asset-Optimierung**: Automatische Bild-Kompression
- **Code-Splitting**: Optimale Bundle-Größen
- **Lazy Loading**: Für Bilder und Komponenten

### Frontend-Optimierungen
- **Tailwind Purge**: Nur verwendete CSS-Klassen
- **Font-Optimierung**: System-Fonts mit Fallbacks
- **Minimal JavaScript**: Nur wo notwendig
- **Service Worker**: Für Offline-Support (geplant)

## 🛠 Entwickler-Tools

### Verfügbare Skripte
- `npm run dev`: Lokale Entwicklung
- `npm run build`: Production Build
- `npm run preview`: Build-Vorschau
- `npm run astro check`: Type-Checking

### Debug-Tools
- **Admin-Bereich**: `/admin/` für Content-Übersicht
- **Author-Management**: `/admin/authors`
- **Find-Untranslated**: Script für fehlende Übersetzungen

## 📝 Code-Konventionen

### Komponenten
- **PascalCase**: Für Komponentennamen
- **Props-Interfaces**: TypeScript-Definitionen
- **Import-Reihenfolge**: Externe → Interne

### Content
- **Frontmatter**: Zod-validiert
- **MDX-Support**: Komponenten in Markdown
- **Sprachordner**: de/en Struktur

### Styling
- **Tailwind-First**: Utility-Klassen bevorzugt
- **Kebab-Case**: Für Custom-CSS
- **Keine Inline-Styles**: Außer absolut notwendig

## 🚦 Deployment-Strategie

### Hosting
- **Static Hosting**: Optimiert für CDN-Deployment
- **Asset-CDN**: Für Bilder und Medien
- **Multi-Region**: Für optimale Latenz

### CI/CD
- **Automatische Builds**: Bei Git-Push
- **Type-Checking**: Vor jedem Build
- **Sitemap-Generierung**: Automatisch
- **RSS-Feed-Updates**: Bei Content-Änderungen

## 📊 Monitoring & Wartung

### Analytics-Dashboard
- Besucher-Statistiken
- Conversion-Tracking
- Event-Analyse
- Funnel-Visualisierung

### Content-Management
- Regelmäßige Blog-Posts
- Feature-Updates
- Team-Änderungen
- FAQ-Erweiterungen

### Performance-Monitoring
- Lighthouse-Scores
- Core Web Vitals
- Bundle-Size-Tracking
- Build-Zeit-Optimierung

## 🔮 Zukünftige Erweiterungen

### Geplante Features
- PWA-Support
- Erweiterte Suche
- Newsletter-Integration
- Mehr Sprachen
- API-Dokumentation
- Video-Tutorials

### Technische Verbesserungen
- Service Worker
- WebP-Bildformat
- Erweiterte Caching-Strategien
- GraphQL-API (optional)
- CMS-Integration (optional)

## 📞 Support & Dokumentation

### Interne Dokumentation
- `/docs/`: Technische Dokumentation
- `/context/`: KI-Kontext-Dokumente
- `/plans/`: Projekt-Roadmaps
- `CLAUDE.md`: KI-Assistenz-Guidelines

### Externe Ressourcen
- [Astro Dokumentation](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [MDX](https://mdxjs.com)
- [Zod](https://zod.dev)

---

**Letztes Update**: Januar 2025
**Version**: 2.0.0
**Maintainer**: Memoro Development Team