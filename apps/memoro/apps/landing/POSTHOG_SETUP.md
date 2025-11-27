# PostHog A/B Testing Setup

Dieses Dokument beschreibt die PostHog-Integration für A/B-Testing auf der Memoro-Website.

## 1. Initiale Einrichtung

### PostHog-Account erstellen

1. Gehe zu [PostHog EU](https://eu.posthog.com)
2. Erstelle einen Account (EU-Region für GDPR-Compliance)
3. Erstelle ein neues Projekt "Memoro Landing"

### Environment-Variablen

Erstelle eine `.env`-Datei basierend auf `.env.example`:

```bash
PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Testen der Integration

1. Starte den Dev-Server: `npm run dev`
2. Akzeptiere Analytics-Cookies im Cookie-Banner
3. Öffne die Browser-Konsole und prüfe: `window.posthog` sollte verfügbar sein
4. Überprüfe im PostHog-Dashboard, ob Events ankommen

## 2. A/B-Tests erstellen

### Im PostHog-Dashboard

1. Navigiere zu "Feature Flags" → "New Feature Flag"
2. Erstelle ein neues Flag, z.B. `hero-cta-test`
3. Konfiguriere die Varianten:
   - Control: Default (kein Wert)
   - Variant B: `variant-b`
4. Setze die Rollout-Percentage (z.B. 50/50)

### Im Code implementieren

#### Option 1: Fertige Experiment-Komponente nutzen

```astro
---
import HeroCtaExperiment from '../components/experiments/HeroCtaExperiment.astro';
---

<HeroCtaExperiment />
```

#### Option 2: Custom Implementation

```astro
<div id="my-experiment" data-experiment="my-test">
	<!-- Default content -->
</div>

<script>
	import { getExperiment, trackEvent } from '../utils/experiments';

	const variant = await getExperiment('my-test');
	if (variant === 'variant-b') {
		// Apply variant B changes
	}
</script>
```

## 3. Verfügbare Utilities

### `getExperiment(key)`

Holt die aktuelle Variante für einen Test:

```javascript
const variant = await getExperiment('hero-cta-test');
// Returns: null | 'control' | 'variant-b' | ...
```

### `trackEvent(name, properties)`

Trackt ein Custom Event:

```javascript
trackEvent('button_clicked', {
	button_id: 'download-cta',
	page: 'home',
});
```

### `trackExperimentConversion(experiment, type)`

Trackt eine Conversion für einen A/B-Test:

```javascript
trackExperimentConversion('hero-cta-test', 'download_click');
```

### `applyExperimentClasses(elementId, experimentKey, variantClasses)`

Wendet CSS-Klassen basierend auf der Variante an:

```javascript
applyExperimentClasses('hero-section', 'hero-test', {
	control: 'bg-blue-500',
	'variant-b': 'bg-green-500',
});
```

## 4. Best Practices

### Performance

- PostHog lädt nur nach Cookie-Consent
- Script ist asynchron und blockiert nicht
- Feature Flags werden gecached

### GDPR-Compliance

- Analytics nur mit expliziter Zustimmung
- EU-Server verwenden
- `person_profiles: 'identified_only'` für anonyme Nutzer

### Testing-Strategie

1. **Start klein**: Beginne mit unkritischen Elementen
2. **Messe richtig**: Definiere klare Success-Metriken
3. **Dokumentiere**: Halte Tests und Ergebnisse fest
4. **Iteriere**: Nutze Learnings für neue Tests

## 5. Geplante A/B-Tests

### Phase 1 (Sofort möglich)

- **Hero CTA**: "App herunterladen" vs. "Kostenlos testen"
- **Download Button Position**: Rechts vs. Links in Navigation
- **Testimonial Position**: Oben vs. Unten auf Homepage

### Phase 2 (Nach ersten Learnings)

- **Pricing Layout**: Grid vs. Tabelle
- **Feature-Reihenfolge**: Verschiedene Priorisierungen
- **Formulare**: Anzahl der Felder reduzieren

## 6. Monitoring & Analyse

### PostHog Dashboard

- **Experiments**: Übersicht aller laufenden Tests
- **Feature Flags**: Status und Rollout-Percentage
- **Insights**: Custom Dashboards für Conversions

### Wichtige Metriken

- Conversion Rate (Download-Klicks)
- Bounce Rate pro Variante
- Time on Page
- Scroll-Tiefe

## 7. Troubleshooting

### PostHog lädt nicht

1. Prüfe Cookie-Consent Status
2. Checke Browser-Konsole für Fehler
3. Verifiziere API-Key in `.env`

### Feature Flag gibt null zurück

1. Stelle sicher, dass PostHog geladen ist
2. Prüfe Flag-Name (Case-sensitive!)
3. Checke Rollout-Settings im Dashboard

### Events werden nicht getrackt

1. Öffne Network-Tab und suche nach `posthog.com/e/`
2. Prüfe, ob `autocapture: false` gesetzt ist
3. Nutze `posthog.debug()` für Details

## 8. Migration von Plausible

Aktuell laufen Plausible und PostHog parallel. Nach 2-4 Wochen:

1. Vergleiche Metriken beider Tools
2. Stelle sicher, dass PostHog alle benötigten Daten erfasst
3. Entferne Plausible-Komponente
4. Update Cookie-Consent Beschreibung
5. Entferne Plausible DNS-Prefetch

## Support

Bei Fragen oder Problemen:

- PostHog Docs: https://posthog.com/docs
- Astro + PostHog: https://posthog.com/tutorials/astro-ab-tests
