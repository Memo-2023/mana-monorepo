# Märchenzauber Landingpage - Implementierungsplan

## 🎯 Projektziel

Entwicklung einer modernen, ansprechenden Landingpage für Märchenzauber mit Astro.js, die Familien zum Download der App motiviert und die Magie des personalisierten Geschichtenerzählens vermittelt.

## 📐 Technische Architektur

### Framework & Tools

- **Astro.js 5.x** - Statische Site Generation für optimale Performance
- **TypeScript** - Typsicherheit
- **Tailwind CSS** - Utility-first CSS Framework
- **Framer Motion** - Animationen (als Astro Integration)
- **Astro Image** - Optimierte Bildverarbeitung
- **Astro Icons** - Icon-Bibliothek

### Zusätzliche Dependencies

```json
{
	"dependencies": {
		"@astrojs/tailwind": "^5.x",
		"@astrojs/image": "^0.x",
		"@astrojs/sitemap": "^3.x",
		"astro-icon": "^1.x",
		"swiper": "^11.x"
	}
}
```

## 🎨 Design-System (basierend auf Mobile App)

### Farbpalette

```css
:root {
	/* Primärfarben - Aus Mobile App Theme */
	--color-yellow-dark: #6d5b00; /* Haupt-Akzentfarbe */
	--color-yellow-light: #f8d62b; /* Heller Akzent */

	/* Hintergründe - Dark Theme wie App */
	--color-bg-primary: #181818; /* Haupthintergrund */
	--color-bg-secondary: #333333; /* Sekundärer Hintergrund */
	--color-bg-card: #2c2c2c; /* Karten/Container */
	--color-bg-input: #333333; /* Input-Felder */
	--color-bg-dark: #121212; /* Sehr dunkler Hintergrund */
	--color-bg-darker: #1a1a1a; /* Noch dunkler */

	/* Text */
	--color-text-primary: #ffffff; /* Haupttext */
	--color-text-secondary: #999999; /* Sekundärtext */
	--color-text-muted: #666666; /* Gedämpfter Text */
	--color-text-light: #cccccc; /* Heller Text */

	/* UI Elemente */
	--color-border: #444444; /* Rahmen */
	--color-hover: rgba(255, 255, 255, 0.1);
	--color-pressed: rgba(255, 255, 255, 0.05);

	/* Gradients aus der App */
	--gradient-card: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
	--gradient-overlay: linear-gradient(135deg, rgba(109, 91, 0, 0.2), rgba(248, 214, 43, 0.1));
}
```

### Typography

- **Headings**: "Grandstander" (aus der Mobile App - @expo-google-fonts/grandstander)
- **Body**: System Font Stack (wie in der App)
- **Monospace**: ui-monospace, 'Cascadia Code', 'Source Code Pro'

### Komponenten-Stile (aus Mobile App)

```css
/* Buttons - aus Button.tsx */
.button-primary {
	background-color: var(--color-yellow-dark);
	color: #ffffff;
	border-radius: 8px;
	padding: 12px 24px;
	font-weight: 600;
	font-size: 16px;
}

.button-secondary {
	background-color: transparent;
	border: 1px solid var(--color-yellow-dark);
	color: var(--color-yellow-dark);
}

/* Cards */
.card {
	background-color: var(--color-bg-card);
	border-radius: 8px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Input Fields */
.input {
	background-color: var(--color-bg-input);
	border-radius: 12px;
	color: var(--color-text-primary);
	padding: 12px;
	font-size: 15px;
	border: none;
}
```

### Spacing (aus theme.ts)

```css
:root {
	--spacing-xs: 4px;
	--spacing-sm: 8px;
	--spacing-md: 16px;
	--spacing-lg: 24px;
	--spacing-xl: 32px;
}
```

### Border Radius (aus theme.ts)

````css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

## 📑 Seitenstruktur

### 1. Hero Section
```astro
components/sections/Hero.astro
````

- **Design**: Dunkler Hintergrund (#181818) mit gelben Akzenten
- **Headline**: "Wo jedes Kind zum Helden seiner eigenen Geschichte wird"
  - Font: Grandstander Bold
  - Farbe: #FFFFFF
- **Subheadline**: Kurze Erklärung der App
  - Farbe: #999999
- **CTA-Buttons**:
  - "App herunterladen" (Primary - #6D5B00 Hintergrund)
  - "Demo ansehen" (Secondary - Border #6D5B00)
- **Hero-Illustration**: 3D Pixar-Style Charaktere (wie in der App)
- **App Store Badges**: iOS & Android

### 2. Features Section

```astro
components/sections/Features.astro
```

- **Hintergrund**: #1a1a1a (etwas dunkler als Hero)
- **Feature-Cards**: #2C2C2C mit box-shadow
- **Icons**: Gelb (#F8D62B) auf dunklem Hintergrund
- **Text**: Weiß (#FFFFFF) für Titel, #999999 für Beschreibungen
- Dreispaltige Feature-Grid:
  - **Charaktererstellung**: "Erschaffe einzigartige Helden"
  - **KI-Geschichten**: "Personalisierte Märchen in Sekunden"
  - **Illustrationen**: "Wunderschöne Bilder für jede Seite"

### 3. How It Works

```astro
components/sections/HowItWorks.astro
```

- **Hintergrund**: #181818
- **Schritt-Nummerierung**: Gelber Kreis (#6D5B00)
- **Screenshots**: Mit border-radius: 12px und shadow
- Schritt-für-Schritt Prozess:
  1. Charakter erstellen
  2. Geschichte beschreiben
  3. Magie erleben

### 4. Story Showcase

```astro
components/sections/StoryShowcase.astro
```

- **Story Cards**: Wie StoryCard.tsx aus der App
  - Hintergrund: #2C2C2C
  - Border-radius: 8px
  - Shadow: 0 4px 8px rgba(0, 0, 0, 0.3)
  - Transform mit perspective für 3D-Effekt
- Horizontaler Scroll wie in der App
- LinearGradient Overlay für Text

### 5. Character Gallery

```astro
components/sections/CharacterGallery.astro
```

- **Avatar-Style**: Wie in der App (rund, mit Border)
- **Hintergrund**: #1a1a1a
- **Hover-Effekt**: Leichte Vergrößerung und Glow (#F8D62B)
- "Erstelle deinen eigenen" Button mit #6D5B00

### 6. Testimonials

```astro
components/sections/Testimonials.astro
```

- **Hintergrund**: #181818
- **Testimonial Cards**: #2C2C2C mit gelben Quotes (#F8D62B)
- **Sterne**: Gelb (#F8D62B)
- **Text**: #FFFFFF für Zitate, #999999 für Namen

### 7. Pricing/Mana System

```astro
components/sections/Pricing.astro
```

- **Hintergrund**: #1a1a1a
- **Pricing Cards**: #2C2C2C mit Highlight-Border (#6D5B00) für empfohlenes Paket
- **Mana-Token Icon**: Gelb mit Glow-Effekt
- **CTA Buttons**: Primary style (#6D5B00)

### 8. FAQ

```astro
components/sections/FAQ.astro
```

- **Hintergrund**: #181818
- **Accordion Items**: #2C2C2C
- **Aktives Item**: Border-left mit #F8D62B
- **Text**: Fragen in #FFFFFF, Antworten in #999999
- **Icons**: Plus/Minus in #6D5B00

### 9. Footer

```astro
components/layout/Footer.astro
```

- **Hintergrund**: #121212 (dunkelster Bereich)
- **Links**: #999999, hover: #F8D62B
- **Logo**: Wie in der App
- **Newsletter Input**: #333333 Hintergrund
- **Submit Button**: #6D5B00

## 🧩 Komponenten-Übersicht

### Layout-Komponenten

```
src/layouts/
├── BaseLayout.astro      # Haupt-Layout mit Meta-Tags
└── components/
    ├── Navigation.astro   # Sticky Navigation
    └── Footer.astro       # Footer
```

### UI-Komponenten

```
src/components/ui/
├── Button.astro          # CTA-Buttons
├── Card.astro            # Feature-Cards
├── Badge.astro           # Labels/Tags
├── Accordion.astro       # FAQ-Items
├── Slider.astro          # Story-Carousel
└── Modal.astro           # Video-Modal
```

### Section-Komponenten

```
src/components/sections/
├── Hero.astro
├── Features.astro
├── HowItWorks.astro
├── StoryShowcase.astro
├── CharacterGallery.astro
├── Testimonials.astro
├── Pricing.astro
├── FAQ.astro
└── CTA.astro
```

## ✨ Animationen & Interaktionen (App-konsistent)

### Scroll-Animationen

- Fade-in beim Scrollen (opacity transitions)
- Subtle scale transforms (wie bei Cards in der App)
- Sticky Navigation mit Blur-Effekt (wie CommonHeader)

### Micro-Interactions (aus Mobile App)

- **Button Hover**: opacity: 0.8 (wie in Button.tsx)
- **Button Press**: opacity: 0.7
- **Card Hover**: Transform mit perspective (wie StoryCard)
- **Loading**: Skeleton-Loader mit #2C2C2C (wie in der App)

### Hero-Animation

- 3D Transform für Charaktere (perspective)
- Subtile Float-Animation
- Gelbe Akzent-Partikel (#F8D62B)

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
sm: 640px   /* Tablets */
md: 768px   /* Small Laptops */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Screens */
2xl: 1536px /* Extra Large */
```

### Mobile Optimierungen

- Hamburger-Menü
- Touch-optimierte Slider
- Vereinfachte Animationen
- Optimierte Bildgrößen

## 🚀 Performance-Optimierung

### Astro-Features

- **Static Site Generation** für schnelle Ladezeiten
- **Partial Hydration** für interaktive Komponenten
- **Image Optimization** mit Astro Image
- **Code Splitting** automatisch

### Best Practices

- Lazy Loading für Bilder
- Kritisches CSS inline
- Fonts lokal hosten
- WebP/AVIF Bildformate
- Minimiertes JavaScript

## 📊 SEO & Meta

### Meta-Tags

```astro
<!-- BaseLayout.astro -->
<meta name="description" content="Märchenzauber - Personalisierte KI-Geschichten für Kinder" />
<meta property="og:title" content="Märchenzauber - Wo jedes Kind zum Helden wird" />
<meta property="og:image" content="/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```

### Strukturierte Daten

```json
{
	"@context": "https://schema.org",
	"@type": "MobileApplication",
	"name": "Märchenzauber",
	"applicationCategory": "Education",
	"offers": {
		"@type": "Offer",
		"price": "0",
		"priceCurrency": "EUR"
	}
}
```

## 📝 Content-Strategie

### Haupt-CTAs

1. **Above the Fold**: "Jetzt App herunterladen"
2. **Nach Features**: "Kostenlos starten"
3. **Story Showcase**: "Eigene Geschichte erstellen"
4. **Footer**: Newsletter & App-Download

### Trust-Signale

- App Store Bewertungen
- Anzahl erstellter Geschichten
- Datenschutz-Siegel
- Eltern-Testimonials

## 🔧 Implementierungs-Reihenfolge

### Phase 1: Grundgerüst & Design-System

1. Projekt-Setup mit Tailwind (Dark Theme Config)
2. Grandstander Font Integration
3. BaseLayout mit Dark Theme (#181818)
4. Navigation (Blur-Effekt wie CommonHeader)
5. Basis-Komponenten im App-Style:
   - Button (Primary #6D5B00, Secondary mit Border)
   - Card (#2C2C2C mit Shadow)
   - Input (#333333)

### Phase 2: Hero & Features

1. Hero Section:
   - Dark Background (#181818)
   - Grandstander Headlines
   - Gelbe CTAs (#6D5B00)
2. Features Grid mit #2C2C2C Cards
3. How It Works mit App-Screenshots
4. Mobile-First Responsive

### Phase 3: Content Sections

1. Story Showcase:
   - StoryCard-Style mit Transform
   - Horizontaler Scroll
   - LinearGradient Overlays
2. Character Gallery (Avatar-Grid)
3. Testimonials (#2C2C2C Cards)
4. Pricing mit Mana-Token Design

### Phase 4: Finalisierung

1. FAQ mit Accordion (#2C2C2C Items)
2. Footer (#121212 Background)
3. Animations & Interactions
4. Performance-Optimierung
5. Dark Theme Consistency Check

## 🎯 Conversion-Ziele

### Primär

- App-Downloads maximieren
- Newsletter-Anmeldungen

### Sekundär

- Social Media Follows
- Demo-Video Views
- FAQ-Engagement

## 📈 Analytics-Integration

### Tracking-Events

- App-Download-Klicks
- Video-Plays
- Scroll-Tiefe
- Feature-Interest (Hover/Klick)
- Newsletter-Signups

### Tools

- Google Analytics 4
- Hotjar für Heatmaps
- App Store Connect für Downloads

## 🚦 Launch-Checkliste

- [ ] Alle Texte finalisiert
- [ ] Bilder optimiert (WebP/AVIF)
- [ ] Mobile Testing (iOS/Android)
- [ ] Browser-Kompatibilität
- [ ] Performance < 3s Ladezeit
- [ ] SEO-Meta komplett
- [ ] Rechtliches (Impressum, DSGVO)
- [ ] Analytics eingerichtet
- [ ] SSL-Zertifikat
- [ ] Domain konfiguriert
- [ ] Backup erstellt

---

Dieser Plan bietet eine vollständige Roadmap für die Entwicklung einer professionellen, conversion-optimierten Landingpage für Märchenzauber. Die modulare Struktur ermöglicht iterative Entwicklung und einfache Wartung.
