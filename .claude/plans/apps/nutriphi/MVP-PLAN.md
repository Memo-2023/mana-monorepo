# NutriPhi MVP-Plan

> **Status:** Planung abgeschlossen
> **Letzte Aktualisierung:** 2026-01-24

## Vision

NutriPhi ist eine datenschutzorientierte, KI-gestützte Ernährungs-Tracking-Web-App für gesundheitsbewusste Menschen. Sie ermöglicht das Erfassen von Mahlzeiten per Foto oder Text und liefert vollständige Nährwertanalysen mit personalisierten Empfehlungen.

---

## Entscheidungen (bestätigt)

| Bereich | Entscheidung |
|---------|--------------|
| **Zielgruppe** | Gesundheitsbewusste Menschen |
| **Eingabemethoden** | Foto + Text (Sprache in Phase 2) |
| **Analyse-Tiefe** | Vollständig (Kalorien, Makros, Vitamine, Mineralstoffe) |
| **Tracking** | Tagesziele + Fortschrittsanzeige |
| **KI-Modell** | Google Gemini (neuestes, günstiges Modell) |
| **Portionsgröße** | KI-Schätzung + manuelle Korrektur |
| **Plattform** | Web-only (SvelteKit, mobile-optimiert) |
| **Monetarisierung** | ManaCore Credits |
| **Favoriten** | Ja, häufige Mahlzeiten speichern |
| **Statistiken** | Tagesübersicht, Wochen-Trend, Ziel-Fortschritt |
| **Empfehlungen** | Einfache Hinweise + KI-Coaching |
| **Datenschutz** | Maximum (lokale Verarbeitung, minimale Speicherung) |

---

## MVP Feature-Scope

### Muss (MVP v1.0)

#### Kern-Features
- [ ] **Foto-Analyse**: Foto hochladen/aufnehmen, Gemini analysiert Mahlzeit
- [ ] **Text-Eingabe**: Mahlzeit per Freitext beschreiben als Alternative
- [ ] **Vollständige Nährwert-Anzeige**: Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Vitamine (A, B, C, D, E, K), Mineralstoffe (Eisen, Calcium, Magnesium, etc.)
- [ ] **Portionsschätzung**: KI schätzt Menge, Nutzer kann korrigieren (S/M/L oder Gramm)
- [ ] **Mahlzeit speichern**: Analyse in Tagesverlauf speichern

#### Tracking & Ziele
- [ ] **Tagesziele setzen**: Kalorienziel, optional Makro-Ziele
- [ ] **Tagesübersicht**: Alle Mahlzeiten des Tages, Fortschrittsbalken
- [ ] **Wochen-Trend**: Einfaches Diagramm der letzten 7 Tage

#### Favoriten & Historie
- [ ] **Favoriten speichern**: Häufige Mahlzeiten mit einem Klick wiederverwenden
- [ ] **Mahlzeiten-Historie**: Vergangene Einträge durchsuchen

#### Empfehlungen
- [ ] **Einfache Hinweise**: "Du hast heute wenig Protein", "Vitamin C unter Tagesziel"
- [ ] **KI-Coaching**: Personalisierte Tipps basierend auf Verlauf und Zielen

#### Datenschutz (Maximum)
- [ ] **Foto-Löschung**: Fotos werden nach Analyse sofort gelöscht (nur Ergebnis gespeichert)
- [ ] **Minimale Speicherung**: Nur notwendige Daten auf Server
- [ ] **Lokale Verarbeitung**: Wo möglich clientseitig (z.B. Statistik-Berechnung)
- [ ] **Export-Funktion**: Nutzer kann alle Daten exportieren (DSGVO)
- [ ] **Lösch-Funktion**: Account und alle Daten vollständig löschen

#### Auth & Credits
- [ ] **ManaCore Auth**: Login über zentralen Auth-Service
- [ ] **Credit-System**: X Credits pro Analyse, Integration mit ManaCore Credits

### Sollte (v1.1)

- [ ] Spracheingabe (Speech-to-Text)
- [ ] Barcode-Scanner für verpackte Lebensmittel
- [ ] Wassertracking
- [ ] PWA-Installation für Mobile-Erlebnis

### Könnte (v1.2+)

- [ ] Rezepterkennung (komplexe Gerichte)
- [ ] Mahlzeiten-Planung
- [ ] Integration mit Apple Health / Google Fit
- [ ] Gemeinsames Tracking (Familie/Partner)
- [ ] Allergen-Warnungen

---

## Technische Architektur

### Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (SvelteKit)                  │
│  - Mobile-optimiertes UI                                │
│  - PWA-fähig                                            │
│  - Kamera-Zugriff via Web API                           │
│  - Lokale Statistik-Berechnung                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                       │
│  - Gemini API Integration                               │
│  - Nährwert-Datenbank                                   │
│  - Credit-Verwaltung                                    │
│  - Empfehlungs-Engine                                   │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ PostgreSQL│  │ ManaCore │  │ Gemini   │
        │ (Supabase)│  │ Auth     │  │ API      │
        └──────────┘  └──────────┘  └──────────┘
```

### Projektstruktur

```
apps/nutriphi/
├── apps/
│   ├── web/              # SvelteKit (mobile-optimiert)
│   └── backend/          # NestJS API
├── packages/
│   └── shared/           # Gemeinsame Types, Utils
└── CLAUDE.md
```

### Datenmodell (Entwurf)

```typescript
// User Ziele
interface UserGoals {
  id: string;
  userId: string;
  dailyCalories: number;
  dailyProtein?: number;      // in Gramm
  dailyCarbs?: number;
  dailyFat?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mahlzeit
interface Meal {
  id: string;
  userId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  inputType: 'photo' | 'text';
  description: string;        // KI-generierte Beschreibung
  // Foto wird NICHT gespeichert (Datenschutz)
  createdAt: Date;
}

// Nährwerte pro Mahlzeit
interface MealNutrition {
  mealId: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  // Vitamine (in mg oder µg)
  vitaminA?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB6?: number;
  vitaminB12?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  // Mineralstoffe (in mg)
  calcium?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
  sodium?: number;
  zinc?: number;
}

// Favoriten
interface FavoriteMeal {
  id: string;
  userId: string;
  name: string;
  description: string;
  nutrition: MealNutrition;
  usageCount: number;
  createdAt: Date;
}

// Empfehlungen
interface DailyRecommendation {
  id: string;
  userId: string;
  date: Date;
  type: 'hint' | 'coaching';
  message: string;
  nutrient?: string;          // z.B. 'protein', 'vitaminC'
  createdAt: Date;
}
```

---

## KI-Integration (Gemini)

### Prompt-Strategie

```
System: Du bist ein Ernährungsexperte. Analysiere das Bild/die Beschreibung
einer Mahlzeit und liefere eine detaillierte Nährwertanalyse.

Aufgaben:
1. Identifiziere alle Lebensmittel im Bild/Text
2. Schätze die Portionsgröße (in Gramm)
3. Berechne Nährwerte basierend auf Standard-Datenbanken
4. Gib Konfidenz-Score für die Schätzung an

Output-Format: JSON mit strukturierten Nährwertdaten
```

### Kosten-Schätzung (Gemini)

| Modell | Kosten | Use Case |
|--------|--------|----------|
| Gemini 1.5 Flash | ~$0.001/Analyse | Standard-Analysen |
| Gemini 1.5 Pro | ~$0.01/Analyse | Komplexe Gerichte, Coaching |

### Credit-Mapping

| Aktion | Credits |
|--------|---------|
| Foto-Analyse | 5 Credits |
| Text-Analyse | 2 Credits |
| KI-Coaching Anfrage | 10 Credits |

---

## Datenschutz-Implementierung

### Foto-Handling

```
1. Nutzer macht Foto
2. Foto wird direkt an Gemini gesendet (Base64)
3. Analyse-Ergebnis wird gespeichert
4. Foto wird NICHT gespeichert
5. Kein Foto-Caching auf Server
```

### Daten-Export (DSGVO Art. 20)

- JSON-Export aller Nutzerdaten
- PDF-Report mit Statistiken
- Ein-Klick Download

### Account-Löschung (DSGVO Art. 17)

- Sofortige Löschung aller Daten
- Keine Backups nach 30 Tagen
- Bestätigungs-E-Mail

---

## UI/UX Konzept

### Mobile-First Design

```
┌─────────────────────────────┐
│  NutriPhi     [+] [Profile] │
├─────────────────────────────┤
│                             │
│   Heute: 1.450 / 2.000 kcal │
│   ████████████░░░░░  72%    │
│                             │
│   Protein   Carbs    Fett   │
│   85g/120   140g/200 45g/70 │
│                             │
├─────────────────────────────┤
│  Frühstück        420 kcal  │
│  Mittagessen      680 kcal  │
│  Snack            350 kcal  │
│                             │
├─────────────────────────────┤
│                             │
│     [📷 Foto]  [✏️ Text]    │
│                             │
└─────────────────────────────┘
```

### Farbschema

- Primary: Grün (#22C55E) - Gesundheit, Natur
- Secondary: Orange (#F97316) - Energie, Wärme
- Background: Warm White (#FAFAF9)
- Accent: Teal (#14B8A6)

---

## Entwicklungs-Roadmap

### Phase 1: Foundation (Woche 1-2)
- [ ] Projekt-Setup im Monorepo
- [ ] Datenbank-Schema erstellen
- [ ] Auth-Integration
- [ ] Basis-UI Komponenten

### Phase 2: Kern-Features (Woche 3-4)
- [ ] Gemini API Integration
- [ ] Foto-Analyse Flow
- [ ] Text-Eingabe Flow
- [ ] Nährwert-Anzeige

### Phase 3: Tracking (Woche 5-6)
- [ ] Tagesübersicht
- [ ] Ziele setzen
- [ ] Statistiken
- [ ] Favoriten

### Phase 4: Intelligence (Woche 7-8)
- [ ] Empfehlungs-Engine
- [ ] KI-Coaching
- [ ] Wochen-Trends

### Phase 5: Polish (Woche 9-10)
- [ ] Datenschutz-Features (Export, Löschung)
- [ ] PWA-Optimierung
- [ ] Performance
- [ ] Testing

---

## Offene Punkte

- [ ] Gemini API Key beschaffen und konfigurieren (User richtet ein)
- [x] Nährwert-Referenzdatenbank: **Hybrid-Ansatz** (siehe unten)
- [x] Design-System: Shared Components aus `@manacore/shared-landing-ui`
- [x] Landing Page: Ja, mit Astro (wie andere Apps)

---

## Nährwert-Datenbank: Hybrid-Ansatz

### Entscheidung

| Datenbank | Verwendung |
|-----------|------------|
| **USDA FoodData Central** | Grundnahrungsmittel, präzise Mikronährstoffe |
| **Open Food Facts** | Verpackte Produkte, deutsche Marken (REWE, Lidl, Aldi) |
| **Gemini Fallback** | Wenn keine DB-Match, KI schätzt selbst |

### Ablauf

```
1. Gemini analysiert Foto → identifiziert Lebensmittel
2. Backend sucht in USDA (Grundnahrungsmittel) oder Open Food Facts (Markenprodukte)
3. Nährwerte werden aus DB geholt oder von Gemini geschätzt
4. Konfidenz-Score zeigt Datenqualität an
```

### Vorteile

- USDA: 150+ Nährstoffe, laborgeprüft
- Open Food Facts: 3 Mio. Produkte, viele deutsche
- Gemini: Intelligenter Fallback für unbekannte Gerichte

---

## Landing Page (Astro)

### Tech Stack

- **Framework:** Astro 5.x
- **Styling:** Tailwind CSS
- **Shared Components:** `@manacore/shared-landing-ui`
- **Deployment:** Cloudflare Pages

### Wiederverwendbare Shared Components

| Komponente | Verwendung in NutriPhi |
|------------|------------------------|
| `HeroSection` | "Fotografiere dein Essen, verstehe was du isst" |
| `FeatureSection` | KI-Analyse, Nährwerte, Tracking, Empfehlungen |
| `StepsSection` | Foto → Analyse → Tracking |
| `PricingSection` | Free/Pro mit Credit-System |
| `FAQSection` | Datenschutz, Genauigkeit, Diäten |
| `CTASection` | "Jetzt kostenlos starten" |
| `Navigation` | Shared Header |
| `Footer` | Shared Footer |

### Projektstruktur

```
apps/nutriphi/apps/landing/
├── src/
│   ├── pages/
│   │   └── index.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── styles/
│   │   └── global.css      # NutriPhi Theme (Grün)
│   └── components/         # Custom falls nötig
├── astro.config.mjs
├── package.json
└── wrangler.toml           # Cloudflare Deploy
```

### Farbschema (CSS Custom Properties)

```css
/* NutriPhi Theme - Gesundheit/Natur */
--color-primary: #22C55E;        /* Green 500 */
--color-primary-hover: #16A34A;  /* Green 600 */
--color-secondary: #F97316;      /* Orange 500 */
--color-accent: #14B8A6;         /* Teal 500 */
--color-background-page: #0F1F0F; /* Dark Green tinted */
--color-background-card: #1A2F1A;
--color-text-primary: #F0FDF4;   /* Green 50 */
--color-text-secondary: #BBF7D0; /* Green 200 */
```

### Seitenstruktur

```
Navigation
├── Hero: "Fotografiere dein Essen. Verstehe deinen Körper."
│   ├── Trust Badges: Datenschutz-First, KI-Powered, Kostenlos starten
│   └── CTA: Jetzt starten / Mehr erfahren
├── Features (6 Cards, 3 Spalten)
│   ├── Foto-Analyse
│   ├── Vollständige Nährwerte
│   ├── Tagesziele
│   ├── KI-Coaching
│   ├── Favoriten
│   └── Datenschutz
├── Steps: Wie es funktioniert (3 Schritte)
│   ├── 1. Foto machen
│   ├── 2. KI analysiert
│   └── 3. Insights erhalten
├── Pricing (Free / Pro)
├── FAQ (6 Fragen)
└── CTA: Starte jetzt kostenlos
Footer
```
