# ROI-Rechner Komponente

## Übersicht
Interaktiver ROI (Return on Investment) Rechner zur Visualisierung der Zeit- und Geldersparnis mit Memoro.

## Features
- 🎚️ **Interaktive Slider** für alle Parameter
- 📊 **Echtzeit-Berechnung** bei jeder Änderung
- 💰 **Zeit- und Geldersparnis** für Woche/Monat/Jahr
- 📈 **ROI-Berechnung** zeigt Amortisationszeit
- 🌍 **Mehrsprachig** (DE/EN)
- 📱 **Responsive Design** für alle Geräte
- 🎨 **Anpassbares Design** mit Farbschema

## Verwendung

### Basic Usage
```astro
import ROICalculator from "../components/ROICalculator.astro";

<ROICalculator />
```

### Mit Custom Props
```astro
<ROICalculator 
  lang="de"
  title="Berechnen Sie Ihre Zeitersparnis"
  subtitle="Finden Sie heraus, wie viel Sie sparen können"
  accentColor="primary"
/>
```

## Props

| Prop | Type | Default | Beschreibung |
|------|------|---------|--------------|
| `lang` | `'de' \| 'en'` | `'de'` | Sprache der Komponente |
| `title` | `string` | Auto | Überschrift des Rechners |
| `subtitle` | `string` | Auto | Untertitel/Beschreibung |
| `accentColor` | `string` | `'primary'` | Farbschema für Akzente |

## Einstellbare Parameter

### Meetings pro Woche
- **Range:** 1-30 Meetings
- **Default:** 10 Meetings
- **Einfluss:** Direkte Multiplikation der Zeitersparnis

### Minuten pro Meeting
- **Range:** 15-120 Minuten
- **Default:** 45 Minuten
- **Schritte:** 15 Minuten
- **Einfluss:** Basis für Protokoll-Zeit

### Minuten für Protokoll
- **Range:** 10-90 Minuten
- **Default:** 30 Minuten
- **Schritte:** 5 Minuten
- **Einfluss:** Hauptfaktor für Zeitersparnis (80% mit Memoro gespart)

### Stundensatz
- **Range:** 20-200 €/Stunde
- **Default:** 50 €/Stunde
- **Schritte:** 10 €
- **Einfluss:** Berechnung der Geldersparnis

## Berechnungslogik

### Zeitersparnis
```javascript
// 80% Zeitersparnis bei der Protokollerstellung
minutesSavedPerMeeting = protocolTime * 0.8
minutesSavedPerWeek = minutesSavedPerMeeting * meetings
hoursSavedPerWeek = minutesSavedPerWeek / 60
hoursSavedPerMonth = hoursSavedPerWeek * 4.33
hoursSavedPerYear = hoursSavedPerWeek * 52
daysSavedPerYear = hoursSavedPerYear / 8
```

### Geldersparnis
```javascript
moneySavedPerWeek = hoursSavedPerWeek * hourlyRate
moneySavedPerMonth = hoursSavedPerMonth * hourlyRate
moneySavedPerYear = hoursSavedPerYear * hourlyRate
```

### ROI (Return on Investment)
```javascript
memoroCostPerMonth = 15 // Durchschnittlicher Memoro-Preis
daysToROI = Math.ceil(memoroCostPerMonth / (moneySavedPerMonth / 30))
```

## Annahmen

- **80% Zeitersparnis** bei der Protokollerstellung durch Memoro
- **4.33 Wochen** pro Monat (Durchschnitt)
- **52 Wochen** pro Jahr
- **8 Stunden** Arbeitstag für Tagesberechnung
- **15€/Monat** durchschnittliche Memoro-Kosten für ROI

## Styling

Die Komponente verwendet:
- Tailwind CSS für Layout und Styling
- Custom CSS für Slider-Styling
- Gradient-Backgrounds für visuelle Attraktivität
- Smooth Transitions für bessere UX

### Slider-Styling
```css
.slider {
  background: linear-gradient(to right, 
    #ef4444 0%, 
    #ef4444 var(--value, 50%), 
    #e5e7eb var(--value, 50%), 
    #e5e7eb 100%
  );
}
```

## Integration

### Auf Landing Pages
```astro
// In meeting-protokoll-software.mdx
import ROICalculator from "../components/ROICalculator.astro";

<ROICalculator 
  lang="de"
  title="ROI-Rechner: Ihre Zeitersparnis mit automatischen Protokollen"
  subtitle="Berechnen Sie konkret Ihre Einsparungen"
/>
```

### Auf der Homepage
```astro
// Nach NumbersSection für maximale Wirkung
<NumbersSection />

<ROICalculator 
  lang={lang}
  title="Berechnen Sie Ihre Zeitersparnis"
/>

<TestimonialSection />
```

## Browser-Kompatibilität

- ✅ Chrome/Edge (alle Versionen)
- ✅ Firefox (alle Versionen)
- ✅ Safari (12+)
- ✅ Mobile Browser (iOS/Android)

## Performance

- **Bundle Size:** ~5KB (unkomprimiert)
- **JavaScript:** Vanilla JS, keine Dependencies
- **Rendering:** Client-side Berechnungen
- **Accessibility:** ARIA-Labels für Screenreader

## Zukünftige Verbesserungen

- [ ] Speichern der Einstellungen im LocalStorage
- [ ] Export der Berechnung als PDF
- [ ] Vergleich mit anderen Tools
- [ ] Erweiterte Berechnungen (Team-Größe, etc.)
- [ ] A/B Testing verschiedener Default-Werte
- [ ] Analytics-Integration für Usage-Tracking

---

*Komponente erstellt: 28. Dezember 2024*