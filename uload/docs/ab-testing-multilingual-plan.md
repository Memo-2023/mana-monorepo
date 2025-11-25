# A/B Testing Multilingual Implementation Plan

## Aktueller Status

- ❌ AB-Testing Texte sind hart kodiert in `/src/lib/ab-testing/config/variants.ts`
- ✅ Paraglide ist bereits installiert und konfiguriert
- ✅ 5 Sprachen werden unterstützt: EN, DE, IT, FR, ES
- ✅ Hauptseite nutzt bereits Paraglide (`import * as m from '$paraglide/messages'`)

## Implementierungsansatz

### Option 1: Einfacher Ansatz (Empfohlen) ⭐

**Alle Varianten-Texte in die Message-Files**

```json
// messages/en.json
{
	// Control
	"hero_control_headline": "Short Links That Work Harder",
	"hero_control_subheadline": "Professional URL management with real-time analytics",
	"hero_control_cta": "Start Free - No Credit Card",

	// Variant A1
	"hero_a1_headline": "Save Time on Every Link You Share",
	"hero_a1_subheadline": "Automate your URL workflow with smart tools",
	"hero_a1_cta": "Start Saving Time",
	"hero_a1_feature_1": "Save 3+ hours weekly",
	"hero_a1_feature_2": "Automate link creation",
	"hero_a1_feature_3": "Track everything",

	// Variant A2
	"hero_a2_headline": "Save 3 Hours Per Week on Link Management"
	// ... etc
}
```

**Vorteile:**

- ✅ Einfach zu implementieren
- ✅ Übersetzungen zentral verwaltet
- ✅ Konsistent mit bestehendem System
- ✅ Leicht zu pflegen

**Nachteile:**

- ❌ Viele Message-Keys (9 Varianten × 3-6 Texte × 5 Sprachen)
- ❌ Message-Files werden größer

### Option 2: Dynamischer Ansatz

**Varianten-spezifische Message-Files**

```
messages/
├── en.json          # Haupt-Messages
├── de.json
└── ab-testing/
    ├── en/
    │   ├── control.json
    │   ├── a1.json
    │   └── ...
    └── de/
        ├── control.json
        └── ...
```

**Vorteile:**

- ✅ Bessere Organisation
- ✅ Varianten-Texte isoliert

**Nachteile:**

- ❌ Komplexere Implementierung
- ❌ Nicht Standard-Paraglide

## Empfohlene Implementierung (Option 1)

### Schritt 1: Message-Keys hinzufügen

Alle Varianten-Texte in die bestehenden Message-Files einfügen.

### Schritt 2: Variants Config anpassen

```typescript
// variants.ts
import * as m from '$paraglide/messages';

export function getVariantContent(variantId: string): VariantContent {
	const locale = getCurrentLocale();

	switch (variantId) {
		case 'control':
			return {
				id: 'control',
				name: 'Control',
				headline: m.hero_control_headline(),
				subheadline: m.hero_control_subheadline(),
				ctaText: m.hero_control_cta()
				// ...
			};
		case 'a1':
			return {
				id: 'a1',
				name: 'Value Generic',
				headline: m.hero_a1_headline(),
				subheadline: m.hero_a1_subheadline(),
				ctaText: m.hero_a1_cta(),
				features: [m.hero_a1_feature_1(), m.hero_a1_feature_2(), m.hero_a1_feature_3()]
				// ...
			};
		// ...
	}
}
```

### Schritt 3: HeroABTest Component anpassen

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { getVariantContent } from '../config/variants';
	import { getCurrentLocale } from '$lib/locale';

	let variant = $state<string>('control');
	let content = $state<VariantContent>();

	onMount(() => {
		variant = hashManager.getVariant();
		// Content wird dynamisch basierend auf Sprache geladen
		content = getVariantContent(variant);
	});

	// Re-render bei Sprachwechsel
	$: if (browser) {
		const locale = getCurrentLocale();
		content = getVariantContent(variant);
	}
</script>
```

## Zeitplan

### Phase 1: Vorbereitung (1-2 Stunden)

1. [ ] Alle Varianten-Texte sammeln und strukturieren
2. [ ] Übersetzungen vorbereiten (DeepL/ChatGPT für erste Version)
3. [ ] Message-Keys definieren (Naming Convention)

### Phase 2: Implementation (2-3 Stunden)

1. [ ] Message-Keys zu allen 5 Sprach-Files hinzufügen
2. [ ] variants.ts auf dynamische Messages umstellen
3. [ ] HeroABTest für Sprachwechsel anpassen
4. [ ] Testing mit verschiedenen Sprachen

### Phase 3: Qualitätssicherung (1 Stunde)

1. [ ] Alle 9 Varianten in allen 5 Sprachen testen
2. [ ] Sprachwechsel während Session testen
3. [ ] URL-Hash bleibt bei Sprachwechsel erhalten

## Message-Key Naming Convention

```
hero_[variant]_[element]_[index]

Beispiele:
hero_control_headline
hero_a1_feature_1
hero_b2_social_proof
hero_c3_integration_list
```

## Anzahl benötigter Übersetzungen

| Variante  | Headlines | Subheadlines | CTA    | Features | Social | Total  |
| --------- | --------- | ------------ | ------ | -------- | ------ | ------ |
| Control   | 1         | 1            | 1      | 0        | 0      | 3      |
| A1        | 1         | 1            | 1      | 3        | 0      | 6      |
| A2        | 1         | 1            | 1      | 3        | 0      | 6      |
| A3        | 1         | 1            | 1      | 3        | 0      | 6      |
| B1        | 1         | 1            | 1      | 0        | 1      | 4      |
| B2        | 1         | 1            | 1      | 0        | 1      | 4      |
| B3        | 1         | 1            | 1      | 0        | 1      | 4      |
| C1        | 1         | 1            | 1      | 6        | 0      | 9      |
| C2        | 1         | 1            | 1      | 4        | 0      | 7      |
| C3        | 1         | 1            | 1      | 4        | 0      | 7      |
| **Total** | **10**    | **10**       | **10** | **26**   | **3**  | **56** |

**56 Texte × 5 Sprachen = 280 Übersetzungen**

## Alternativer Ansatz: Basis-Übersetzung + Variablen

Für weniger Übersetzungsaufwand könnten wir Template-Strings verwenden:

```json
{
	"hero_save_time": "Save {amount} on {activity}",
	"hero_trust_numbers": "Join {count}+ {audience} Using uLoad"
}
```

Dann in variants.ts:

```typescript
headline: m.hero_save_time({ amount: '3 Hours Per Week', activity: 'Link Management' });
```

Dies reduziert die Anzahl der Übersetzungen erheblich!

## Empfehlung

1. **Kurzfristig**: Option 1 mit vollständigen Übersetzungen für Control + A1, B1, C1 (die aktuell aktiven)
2. **Mittelfristig**: Template-Ansatz für neue Varianten
3. **Langfristig**: Eigenes CMS/Admin-Interface für Varianten-Texte

## Nächste Schritte

1. Entscheidung über Ansatz
2. Übersetzungen vorbereiten (kann ich mit KI helfen)
3. Implementation (ca. 3-4 Stunden)
4. Testing in allen Sprachen
