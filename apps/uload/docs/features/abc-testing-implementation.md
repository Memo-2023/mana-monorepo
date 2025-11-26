# A/B/C Testing System - Implementation Guide

## Übersicht

Dieses Dokument beschreibt die vollständige Implementierung eines URL-Hash-basierten A/B/C Testing Systems für uLoad. Das System nutzt URL-Hashes (#a, #b, #c) zur Variantenzuweisung und ermöglicht versionierte Iterationen für kontinuierliche Optimierung.

## 1. System-Architektur

### 1.1 URL-Schema

```
Basis-URL: https://ulo.ad

Control (Baseline):
└── https://ulo.ad (kein Hash)

Varianten:
├── Variant A: https://ulo.ad#a[version]
│   ├── https://ulo.ad#a1 (erste Version)
│   ├── https://ulo.ad#a2 (zweite Version)
│   └── https://ulo.ad#a3 (dritte Version)
│
├── Variant B: https://ulo.ad#b[version]
│   ├── https://ulo.ad#b1
│   ├── https://ulo.ad#b2
│   └── https://ulo.ad#b3
│
└── Variant C: https://ulo.ad#c[version]
    ├── https://ulo.ad#c1
    ├── https://ulo.ad#c2
    └── https://ulo.ad#c3
```

### 1.2 Komponenten-Struktur

```
src/lib/ab-testing/
├── config/
│   ├── tests.json           # Test-Konfigurationen
│   ├── variants.ts          # Varianten-Definitionen
│   └── versions.ts          # Versions-Mapping
├── components/
│   ├── control/            # Control-Varianten
│   │   └── HeroControl.svelte
│   ├── variant-a/          # A-Varianten
│   │   ├── HeroA1.svelte
│   │   ├── HeroA2.svelte
│   │   └── HeroA3.svelte
│   ├── variant-b/          # B-Varianten
│   │   ├── HeroB1.svelte
│   │   ├── HeroB2.svelte
│   │   └── HeroB3.svelte
│   └── variant-c/          # C-Varianten
│       ├── HeroC1.svelte
│       ├── HeroC2.svelte
│       └── HeroC3.svelte
├── service/
│   ├── ABTestingService.ts # Core Service
│   ├── TrackingService.ts  # Umami Integration
│   └── AnalyticsService.ts # Auswertung
└── utils/
    ├── hash.ts             # Hash-Utilities
    ├── random.ts           # Zufallszuweisung
    └── validation.ts       # Validierung

```

## 2. Varianten-Definition

### 2.1 Control Variante (Baseline)

**URL:** `ulo.ad`

**Eigenschaften:**

- Aktuelle, bewährte Version
- Baseline für alle Vergleiche
- Mindestens 25-40% des Traffics
- Keine experimentellen Features

**Content:**

```yaml
Headline: 'Short Links That Work Harder'
Subheadline: 'Professional URL management with real-time analytics'
CTA: 'Start Free Trial'
Layout: Standard Hero mit Screenshot
Features: Grid Layout (2x3)
Social Proof: Logo-Leiste unten
```

### 2.2 Variant A - Value-Fokussiert

**Versionen:**

#### A1 - Generischer Value

**URL:** `ulo.ad#a1`

```yaml
Headline: 'Save Time on Every Link You Share'
Subheadline: 'Automate your URL workflow with smart tools'
CTA: 'Start Saving Time'
Focus: Zeit-Ersparnis
```

#### A2 - Spezifischer Value

**URL:** `ulo.ad#a2`

```yaml
Headline: 'Save 3 Hours Per Week on Link Management'
Subheadline: 'Join teams who reduced link tasks by 75%'
CTA: 'Calculate Your Savings'
Focus: Konkrete Zahlen
Extra: ROI-Rechner prominent
```

#### A3 - Personalisierter Value

**URL:** `ulo.ad#a3`

```yaml
Headline: 'Your Links, 10x More Powerful'
Subheadline: 'Transform every URL into a conversion machine'
CTA: 'Unlock Link Power'
Focus: Transformation
Extra: Before/After Vergleich
```

### 2.3 Variant B - Social Proof

**Versionen:**

#### B1 - Zahlen-basiert

**URL:** `ulo.ad#b1`

```yaml
Headline: 'Join 10,000+ Marketers Using uLoad'
Subheadline: 'The trusted URL shortener for growing brands'
CTA: 'Join the Community'
Focus: Nutzer-Anzahl
Extra: Live-Counter
```

#### B2 - Logo-basiert

**URL:** `ulo.ad#b2`

```yaml
Headline: 'Trusted by Google, Meta, and Microsoft'
Subheadline: 'Enterprise-grade URL management for all'
CTA: 'See Why They Chose Us'
Focus: Bekannte Marken
Extra: Logo-Carousel prominent
```

#### B3 - Testimonial-basiert

**URL:** `ulo.ad#b3`

```yaml
Headline: 'Rated #1 URL Shortener by Marketing Teams'
Subheadline: 'See what 10,000+ users say about us'
CTA: 'Read Success Stories'
Focus: Reviews & Ratings
Extra: Testimonial-Slider
```

### 2.4 Variant C - Feature-Fokussiert

**Versionen:**

#### C1 - All-in-One

**URL:** `ulo.ad#c1`

```yaml
Headline: 'URL Shortener + QR Codes + Analytics'
Subheadline: 'Everything you need in one platform'
CTA: 'Explore All Features'
Focus: Komplettlösung
Extra: Feature-Tabs
```

#### C2 - Killer-Feature

**URL:** `ulo.ad#c2`

```yaml
Headline: 'QR Codes That Actually Convert'
Subheadline: 'Dynamic QR codes with real-time analytics'
CTA: 'Create Your First QR Code'
Focus: QR-Code Feature
Extra: Live QR-Generator
```

#### C3 - Integration-Fokus

**URL:** `ulo.ad#c3`

```yaml
Headline: 'Works With Your Favorite Tools'
Subheadline: 'Zapier, Slack, WordPress & 100+ integrations'
CTA: 'Connect Your Tools'
Focus: Integrations
Extra: Integration-Grid
```

## 3. Traffic-Verteilung

### 3.1 Initial-Verteilung (Woche 1-2)

```javascript
const trafficDistribution = {
	control: 40, // Baseline
	a1: 20, // Value Test
	b1: 20, // Social Test
	c1: 20 // Feature Test
};
```

### 3.2 Optimierte Verteilung (Woche 3-4)

Nach ersten Daten, Traffic zu Gewinnern verschieben:

```javascript
const trafficDistribution = {
	control: 30, // Reduziert
	a2: 30, // Winner A (neue Version)
	b1: 20, // B bleibt
	c2: 20 // C iteriert
};
```

### 3.3 Champion/Challenger (Ab Woche 5)

```javascript
const trafficDistribution = {
	champion: 70, // Bester Performer
	challenger1: 10, // Neue Idee
	challenger2: 10, // Neue Idee
	challenger3: 10 // Neue Idee
};
```

## 4. Implementierungs-Schritte

### Phase 1: Basis-Setup (Tag 1-3)

#### Tag 1: Hash-System

```typescript
// 1. Hash-Detection implementieren
// 2. Zufallszuweisung bei fehlendem Hash
// 3. Hash-Persistierung (localStorage als Backup)
// 4. Redirect-Logic
```

#### Tag 2: Komponenten

```typescript
// 1. Control-Komponente finalisieren
// 2. A1, B1, C1 Komponenten erstellen
// 3. Dynamisches Component-Loading
// 4. Props-Passing System
```

#### Tag 3: Tracking

```typescript
// 1. Umami Custom Events Setup
// 2. Page View Tracking mit Hash
// 3. Conversion Event Tracking
// 4. Debug-Modus
```

### Phase 2: Content-Erstellung (Tag 4-7)

#### Tag 4: Variant A (Value)

- [ ] A1: Copy schreiben
- [ ] A1: Design anpassen
- [ ] A1: Value-Propositions definieren
- [ ] A1: Testing

#### Tag 5: Variant B (Social)

- [ ] B1: Social Proof sammeln
- [ ] B1: Logos vorbereiten
- [ ] B1: Testimonials auswählen
- [ ] B1: Counter implementieren

#### Tag 6: Variant C (Features)

- [ ] C1: Feature-Liste priorisieren
- [ ] C1: Icons/Grafiken erstellen
- [ ] C1: Interaktive Elemente
- [ ] C1: Demo-Integration

#### Tag 7: Testing & QA

- [ ] Alle Varianten durchspielen
- [ ] Mobile Testing
- [ ] Performance Check
- [ ] Tracking verifizieren

### Phase 3: Launch & Iteration (Woche 2+)

#### Woche 2: Soft Launch

```yaml
Montag:
  - 10% Traffic auf Tests
  - Monitoring Setup
  - Fehler-Tracking

Mittwoch:
  - 50% Traffic auf Tests
  - Erste Daten-Analyse
  - Quick Fixes

Freitag:
  - 100% Traffic
  - Wochenend-Monitoring
```

#### Woche 3: Erste Iteration

```yaml
Montag:
  - Daten-Auswertung
  - Winner/Loser identifizieren
  - Neue Versionen planen

Mittwoch:
  - A2, B2, C2 entwickeln
  - Basierend auf Learnings

Freitag:
  - Neue Versionen live
  - Traffic umverteilen
```

## 5. Tracking & Analytics

### 5.1 Umami Setup

**Page Tracking:**

```
Umami sieht automatisch:
- ulo.ad (Control): 1000 views
- ulo.ad#a1: 200 views
- ulo.ad#a2: 250 views
- ulo.ad#b1: 200 views
- etc.
```

**Event Tracking:**

```javascript
// Conversion Events nach Variant
umami.track('signup_control');
umami.track('signup_a1');
umami.track('signup_a2');
umami.track('signup_b1');

// Micro-Conversions
umami.track('cta_click_a1');
umami.track('form_start_b2');
umami.track('video_play_c1');
```

### 5.2 Metriken & KPIs

**Primary Metrics:**

1. **Conversion Rate:** Besucher → Sign-up
2. **Engagement Rate:** Aktionen auf Seite
3. **Bounce Rate:** Sofortiges Verlassen
4. **Time on Page:** Verweildauer

**Secondary Metrics:**

1. **CTA Click Rate:** Button-Klicks
2. **Form Abandonment:** Angefangene Forms
3. **Scroll Depth:** Wie weit gescrollt
4. **Feature Interest:** Welche Features angeklickt

### 5.3 Erfolgs-Kriterien

**Statistische Signifikanz:**

- Minimum 500 Besucher pro Variante
- 95% Konfidenz-Level
- Minimum 10% Uplift für Gewinner

**Business Impact:**

- Conversion Rate > 3%
- Sign-ups +20% vs Control
- Engagement +15% vs Control

## 6. Iterations-Strategie

### 6.1 Wann iterieren?

**Neue Version erstellen wenn:**

- Variante schlechter als Control (-10%)
- Plateau erreicht (keine Verbesserung)
- Neue Hypothese basierend auf Daten
- Saisonale Anpassung nötig

**Variante behalten wenn:**

- Konstant besser als Control (+5-10%)
- Noch nicht genug Daten (<500 Besucher)
- Trend positiv aber nicht signifikant

### 6.2 Versions-Evolution

```
A1 (Generic) → A2 (Specific) → A3 (Hyper-specific)
"Save Time" → "Save 3 Hours" → "Save 3.5 Hours Weekly"

B1 (Numbers) → B2 (Logos) → B3 (Stories)
"10,000 users" → "Google uses us" → "How Google saves time"

C1 (All Features) → C2 (Best Feature) → C3 (Integration)
"Everything" → "Best QR Codes" → "Works with Zapier"
```

## 7. Code-Beispiele

### 7.1 Hash-Manager

```typescript
// src/lib/ab-testing/hash-manager.ts
export class HashManager {
	private readonly validVariants = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
	private readonly distribution = {
		control: 40,
		a1: 20,
		b1: 20,
		c1: 20
	};

	getVariant(): string {
		// Check existing hash
		const hash = window.location.hash.slice(1);
		if (this.validVariants.includes(hash)) {
			return hash;
		}

		// Check localStorage backup
		const stored = localStorage.getItem('ab_variant');
		if (stored && this.validVariants.includes(stored)) {
			window.location.hash = stored;
			return stored;
		}

		// Assign new variant
		const variant = this.assignRandomVariant();
		window.location.hash = variant || '';
		localStorage.setItem('ab_variant', variant);
		return variant;
	}

	private assignRandomVariant(): string {
		const random = Math.random() * 100;
		let cumulative = 0;

		for (const [variant, weight] of Object.entries(this.distribution)) {
			cumulative += weight;
			if (random <= cumulative) {
				return variant === 'control' ? '' : variant;
			}
		}

		return '';
	}
}
```

### 7.2 Component Loader

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { HashManager } from '$lib/ab-testing/hash-manager';

	// Import all variants
	import HeroControl from '$lib/ab-testing/components/control/HeroControl.svelte';
	import HeroA1 from '$lib/ab-testing/components/variant-a/HeroA1.svelte';
	import HeroA2 from '$lib/ab-testing/components/variant-a/HeroA2.svelte';
	import HeroB1 from '$lib/ab-testing/components/variant-b/HeroB1.svelte';
	// ... more imports

	let variant = $state('');
	let HeroComponent = $state(HeroControl);

	const componentMap = {
		'': HeroControl,
		control: HeroControl,
		a1: HeroA1,
		a2: HeroA2,
		b1: HeroB1
		// ... more mappings
	};

	onMount(() => {
		const hashManager = new HashManager();
		variant = hashManager.getVariant();
		HeroComponent = componentMap[variant] || HeroControl;

		// Track view
		if (typeof umami !== 'undefined') {
			umami.track(`view_${variant || 'control'}`);
		}
	});
</script>

{#if HeroComponent}
	<HeroComponent
		on:conversion={() => {
			umami?.track(`conversion_${variant || 'control'}`);
		}}
	/>
{/if}
```

## 8. Debugging & Testing

### 8.1 Debug Mode

**URL-Parameter für Testing:**

```
?debug=true          # Zeigt aktuelle Variante
?force=a2           # Erzwingt spezifische Variante
?reset=true         # Löscht Zuweisung
?show=all           # Zeigt alle Varianten untereinander
```

### 8.2 Test-URLs für Team

```
Preview-Links:
- Control: https://ulo.ad/?preview=control
- Variant A1: https://ulo.ad/?preview=a1
- Variant A2: https://ulo.ad/?preview=a2
- Variant B1: https://ulo.ad/?preview=b1
- Compare: https://ulo.ad/?compare=control,a1,b1
```

## 9. Rollback-Strategie

### 9.1 Notfall-Abschaltung

```typescript
// Emergency switch in environment
PUBLIC_AB_TESTING_ENABLED = false;

// Code check
if (import.meta.env.PUBLIC_AB_TESTING_ENABLED === 'false') {
	// Show only control
	return HeroControl;
}
```

### 9.2 Graduelle Rückführung

```javascript
// Woche 1: Test läuft
distribution = { control: 40, a: 20, b: 20, c: 20 };

// Problem erkannt: Zurück zu Control
distribution = { control: 70, a: 10, b: 10, c: 10 };

// Finale Abschaltung
distribution = { control: 100 };
```

## 10. Dokumentation & Kommunikation

### 10.1 Team-Dokumentation

**Confluence/Notion Page:**

```markdown
# Aktuelle A/B Tests

## Homepage Hero Test

- Start: 01.02.2025
- Varianten: Control, A2, B1, C2
- Status: Aktiv
- Zwischenstand: A2 führt mit +15% Conversion

## Learnings

- Value-Propositions funktionieren besser als Features
- Konkrete Zahlen ("3 Hours") besser als vage ("Save Time")
- Social Proof wichtig aber nicht primär
```

### 10.2 Stakeholder-Reporting

**Wöchentlicher Report:**

```yaml
Test: Homepage Hero
Woche: 2
Besucher: 5,000
Conversions: 180

Ergebnisse:
  Control: 3.2% CR (Baseline)
  A2: 4.1% CR (+28% 🟢)
  B1: 3.0% CR (-6% 🔴)
  C2: 3.5% CR (+9% 🟡)

Empfehlung: A2 weiter optimieren
Nächste Schritte: A3 mit noch spezifischeren Zahlen
```

## 11. Zeitplan

### Woche 1: Implementation

- Mo-Mi: Technische Basis
- Do-Fr: Content-Erstellung

### Woche 2: Launch

- Mo: Soft Launch (10%)
- Mi: Ramp-up (50%)
- Fr: Full Launch (100%)

### Woche 3: Erste Iteration

- Mo: Daten-Analyse
- Mi: Neue Versionen
- Fr: Deploy V2

### Woche 4: Optimierung

- Mo: Winner-Analyse
- Mi: Champion festlegen
- Fr: Neue Challenger

### Monat 2+: Kontinuierlich

- Wöchentliche Reviews
- Monatliche große Updates
- Quartals-Reports

## 12. Budget & Ressourcen

### Entwicklung

- Initial-Setup: 3 Tage
- Pro Variante: 0.5 Tage
- Analyse/Woche: 2 Stunden

### Tools (bereits vorhanden)

- Umami: Kostenlos (Self-hosted)
- SvelteKit: Kostenlos
- Hosting: Bereits bezahlt

### Gesamt

- **Woche 1:** 40 Stunden
- **Fortlaufend:** 5 Stunden/Woche

## Anhang: Checklisten

### Pre-Launch Checklist

- [ ] Alle Varianten getestet
- [ ] Mobile responsive
- [ ] Tracking funktioniert
- [ ] Rollback-Plan ready
- [ ] Team informiert

### Weekly Review Checklist

- [ ] Daten aus Umami exportiert
- [ ] Conversion Rates berechnet
- [ ] Signifikanz geprüft
- [ ] Nächste Tests geplant
- [ ] Report verschickt

### Iteration Checklist

- [ ] Hypothesis dokumentiert
- [ ] Neue Version erstellt
- [ ] QA durchgeführt
- [ ] Traffic-Split angepasst
- [ ] Monitoring aktiviert

---

_Version: 1.0_
_Letzte Aktualisierung: Januar 2025_
_Verantwortlich: Development Team_
_Review-Zyklus: Wöchentlich_
