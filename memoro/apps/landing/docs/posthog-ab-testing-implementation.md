# PostHog A/B-Testing Implementation für Memoro

**Stand:** 23. Juli 2025  
**Autor:** Development Team  
**Status:** ✅ Aktiv

## Übersicht

Wir haben PostHog als Analytics- und A/B-Testing-Plattform für die Memoro-Landingpage integriert. PostHog läuft parallel zu Plausible Analytics und bietet erweiterte Funktionen für Experimente, Feature Flags und detaillierte User-Insights.

## Technische Implementation

### 1. PostHog-Komponente (`src/components/PostHog.astro`)

Die PostHog-Integration ist GDPR-konform implementiert:

- **Lädt nur nach Cookie-Consent**: Respektiert die Nutzer-Entscheidung
- **EU-Server**: Daten werden in der EU gespeichert
- **Anonyme Profile**: `person_profiles: 'identified_only'`
- **Event-basiertes Tracking**: Keine automatische Erfassung sensibler Daten

**Wichtige Konfiguration:**
```javascript
posthog.init(PROJECT_KEY, {
  api_host: 'https://eu.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: false // Volle Kontrolle über Events
});
```

### 2. Experiment Utilities (`src/utils/experiments.ts`)

Zentrale Funktionen für A/B-Tests:

- `getExperiment(key)`: Holt die aktuelle Variante
- `trackEvent(name, properties)`: Sendet Custom Events
- `trackExperimentConversion(experiment, type)`: Trackt Conversions
- `applyExperimentClasses()`: CSS-basierte Varianten

### 3. Cookie-Consent Integration

- PostHog wird in der Analytics-Kategorie behandelt
- UI-Texte erwähnen explizit "Plausible & PostHog"
- Opt-Out wird respektiert

## Implementierte A/B-Tests

### 1. Hero CTA Test (`hero-cta-test`)

**Ziel:** Optimierung der Haupt-Call-to-Action auf der Homepage

**Varianten:**
- **Control (50%)**: 
  - Primary: "So funktioniert's" → `#how-it-works`
  - Secondary: "Live-Demo (2 Min)" → `/de/demo`
  
- **Variant B (50%)**:
  - Primary: "Kostenlos testen" → `/de/download`
  - Secondary: "So funktioniert's" → `#how-it-works`

**Implementation:**
- Script in `HeroABTestScript.astro`
- Dynamische CTA-Änderung via JavaScript
- Tracking von Impressions und Klicks

## Event-Tracking Schema

### Basis-Events

| Event Name | Beschreibung | Properties |
|------------|--------------|------------|
| `$pageview` | Automatisch bei Seitenaufruf | `locale` |
| `$pageleave` | Beim Verlassen der Seite | - |

### Experiment-Events

| Event Name | Beschreibung | Properties |
|------------|--------------|------------|
| `experiment_variant_shown` | Nutzer sieht eine Variante | `experiment`, `variant` |
| `hero_cta_clicked` | Klick auf Hero-CTA | `experiment`, `variant`, `button_type`, `destination` |
| `experiment_conversion` | Conversion erfolgt | `experiment`, `variant`, `conversion_type`, `platform` |

### Download-Events

| Event Name | Beschreibung | Properties |
|------------|--------------|------------|
| `download_page_viewed` | Download-Seite aufgerufen | `lang` |
| `download_button_clicked` | App-Download geklickt | `platform`, `source`, `lang`, `hero_experiment_variant` |

## PostHog Dashboard-Konfiguration

### Aktivierte Produkte
- ✅ **Product Analytics**: User-Journeys und Funnels
- ✅ **Web Analytics**: Basis-Metriken (parallel zu Plausible)
- ✅ **Feature Flags**: A/B-Test-Infrastruktur
- ✅ **Experiments**: Statistische Auswertung
- ✅ **Session Replay**: User-Verhalten verstehen

### Empfohlene Dashboards

#### 1. "Hero CTA A/B Test Results"
- **Conversion Funnel**: Impression → Click → Download Page → App Download
- **CTR by Variant**: Click-Through-Rate Vergleich
- **Download Conversions**: Finale Conversions nach Variante
- **Platform Distribution**: iOS vs. Android

#### 2. "User Journey Analysis"
- **Path Analysis**: Häufigste Wege zur Download-Seite
- **Drop-off Points**: Wo verlieren wir Nutzer?
- **Session Duration**: Verweildauer nach Variante

## Best Practices & Guidelines

### 1. Neue A/B-Tests erstellen

```typescript
// 1. Feature Flag in PostHog Dashboard anlegen
// 2. Test-Komponente erstellen:
const variant = await getExperiment('my-new-test');

if (variant === 'variant-b') {
  // Variante B anwenden
}

// 3. Events tracken
trackEvent('my_test_interaction', {
  experiment: 'my-new-test',
  variant: variant || 'control'
});
```

### 2. Conversion-Tracking

Immer die komplette Journey tracken:
1. Impression (Variante gezeigt)
2. Interaction (Nutzer-Aktion)
3. Conversion (Ziel erreicht)

### 3. Statistische Signifikanz

- Mindestens 1000 Nutzer pro Variante
- Test mindestens 2 Wochen laufen lassen
- Wochentags-Effekte berücksichtigen

## Wartung & Monitoring

### Tägliche Checks
- [ ] Events kommen in PostHog an
- [ ] Feature Flags funktionieren
- [ ] Keine JavaScript-Fehler in Console

### Wöchentliche Reviews
- [ ] A/B-Test Performance prüfen
- [ ] Signifikanz-Level checken
- [ ] Anomalien untersuchen

### Monatliche Aufgaben
- [ ] Abgeschlossene Tests dokumentieren
- [ ] Neue Test-Ideen priorisieren
- [ ] PostHog-Kosten überprüfen

## Troubleshooting

### Problem: PostHog lädt nicht
1. Cookie-Consent prüfen: `localStorage.getItem('memoro_cookie_consent')`
2. API-Key in `.env` verifizieren
3. Browser-Console auf Fehler checken

### Problem: Feature Flag gibt null zurück
1. Flag-Name exakt prüfen (case-sensitive!)
2. Rollout-Percentage in PostHog checken
3. Cache leeren und neu laden

### Problem: Events werden nicht getrackt
1. Network-Tab öffnen, nach `eu.posthog.com/e/` suchen
2. `window.posthog` in Console prüfen
3. Event-Namen auf Tippfehler checken

## Zukünftige Optimierungen

### Phase 1 (Abgeschlossen ✅)
- PostHog-Integration
- Erster A/B-Test (Hero CTA)
- Conversion-Tracking

### Phase 2 (Geplant)
- Pricing-Layout A/B-Test
- Navigation-Varianten
- Form-Optimierung

### Phase 3 (Zukunft)
- Personalisierung basierend auf Quelle
- Multi-Variate Tests
- KI-gestützte Optimierung

## Kontakt & Support

**PostHog-Dashboard:** https://eu.posthog.com  
**Dokumentation:** https://posthog.com/docs  
**Support:** support@posthog.com

**Internes Team:**
- A/B-Tests: Development Team
- Analytics: Marketing Team
- Datenschutz: Legal Team

---

**Hinweis:** Diese Dokumentation wird regelmäßig aktualisiert. Letzte Änderung: 23. Juli 2025