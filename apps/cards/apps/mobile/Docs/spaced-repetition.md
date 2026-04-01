# Spaced Repetition System - Dokumentation

## Überblick

Cards implementiert ein wissenschaftlich fundiertes **Spaced Repetition System (SRS)** basierend auf dem **SuperMemo 2 (SM-2) Algorithmus**. Dieses System optimiert den Lernprozess durch intelligente Wiederholungsintervalle, die sich an die individuelle Lernleistung anpassen.

## Was ist Spaced Repetition?

Spaced Repetition ist eine Lernmethode, die auf der **Vergessenskurve** von Hermann Ebbinghaus basiert. Das Prinzip: 
- Informationen werden in zunehmend größeren Intervallen wiederholt
- Je besser man sich erinnert, desto länger das nächste Intervall
- Schwierige Karten werden öfter wiederholt als leichte

## Der SM-2 Algorithmus

### Grundprinzipien

Der SM-2 Algorithmus berechnet optimale Wiederholungsintervalle basierend auf:

1. **Qualität der Antwort (Q)**: Bewertung von 0-5
2. **Ease Factor (EF)**: Schwierigkeitsgrad der Karte (min. 1.3)
3. **Interval (I)**: Tage bis zur nächsten Wiederholung
4. **Repetitions (R)**: Anzahl erfolgreicher Wiederholungen

### Qualitätsstufen

In Cards werden 4 Bewertungsstufen verwendet:

| Button | Qualität (Q) | Bedeutung | Typisches Intervall |
|--------|--------------|-----------|-------------------|
| **Nochmal** | 1 | Antwort vergessen | < 1 Minute |
| **Schwer** | 3 | Mit Mühe erinnert | ~6 Minuten |
| **Gut** | 4 | Normal erinnert | ~10 Minuten / 1 Tag |
| **Leicht** | 5 | Perfekt erinnert | ~4 Tage |

### Algorithmus-Formel

```typescript
// Ease Factor Berechnung
EF' = EF + (0.1 - (5 - Q) * (0.08 + (5 - Q) * 0.02))
EF = max(1.3, EF')  // Minimum 1.3

// Intervall-Berechnung
if (Q < 3) {
  // Falsche Antwort
  R = 0
  I = 1 Tag
} else {
  // Richtige Antwort
  if (R == 0) I = 1 Tag
  else if (R == 1) I = 6 Tage
  else I = I(prev) * EF
  
  R = R + 1
}
```

## Implementation in Cards

### Datenbankstruktur

#### `card_progress` Tabelle
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users)
- card_id: UUID (Foreign Key → cards)
- deck_id: UUID (Foreign Key → decks)
- ease_factor: Decimal (Default: 2.5)
- interval: Integer (Tage)
- repetitions: Integer
- next_review_date: Timestamp
- last_reviewed_at: Timestamp
- total_reviews: Integer
- correct_reviews: Integer
- incorrect_reviews: Integer
- status: Enum ('new', 'learning', 'review', 'relearning')
```

### Karten-Status

1. **new**: Noch nie gelernt
2. **learning**: In Lernphase (Intervall < 10 Tage)
3. **review**: Langzeit-Wiederholung (Intervall ≥ 10 Tage)
4. **relearning**: Nach Fehler zurück in Lernphase

### Lernmodi

#### 1. Alle Karten
- Zeigt alle Karten des Decks
- Standardreihenfolge nach Position

#### 2. Neue Karten
- Nur Karten mit Status `new`
- Noch nie studierte Karten

#### 3. Wiederholung
- Karten mit `next_review_date ≤ heute`
- Sortiert nach Überfälligkeit (älteste zuerst)

#### 4. Favoriten
- Nur als Favorit markierte Karten

#### 5. Zufällig
- Alle Karten in zufälliger Reihenfolge

## Lernablauf

### 1. Session Start
```typescript
1. Deck auswählen
2. Lernmodus wählen
3. Karten werden gefiltert/sortiert
4. Session wird in Datenbank erstellt
```

### 2. Karte lernen
```typescript
1. Karte anzeigen
2. Antwort geben (Flashcard umdrehen, Quiz beantworten)
3. Schwierigkeit bewerten
4. SM-2 berechnet nächstes Review-Datum
5. Progress in Datenbank speichern
```

### 3. Session Ende
```typescript
1. Statistiken berechnen
2. Session in Datenbank aktualisieren
3. Zusammenfassung anzeigen
```

## Beispiel-Lernverlauf

### Tag 1: Erste Begegnung
- Neue Karte lernen
- Bewertung: "Gut" (Q=4)
- Nächste Review: **Morgen**

### Tag 2: Erste Wiederholung
- Bewertung: "Gut" (Q=4)
- EF bleibt bei 2.5
- Nächste Review: **In 6 Tagen**

### Tag 8: Zweite Wiederholung
- Bewertung: "Leicht" (Q=5)
- EF steigt auf 2.6
- Nächste Review: **In 15 Tagen** (6 * 2.6)

### Tag 23: Dritte Wiederholung
- Bewertung: "Schwer" (Q=3)
- EF sinkt auf 2.36
- Nächste Review: **In 35 Tagen** (15 * 2.36)

## Vorteile des Systems

### 1. **Effizienz**
- Minimaler Zeitaufwand
- Fokus auf schwierige Karten
- Automatische Intervall-Anpassung

### 2. **Langzeit-Retention**
- Optimale Wiederholungszeitpunkte
- Bekämpft die Vergessenskurve
- Nachweislich 90%+ Retention möglich

### 3. **Personalisierung**
- Individuelle Ease Factors pro Karte
- Anpassung an Lerngeschwindigkeit
- Berücksichtigt Schwierigkeitsgrad

## Code-Referenzen

### Hauptdateien

1. **`utils/spacedRepetition.ts`**
   - SM-2 Algorithmus Implementation
   - Hilfsfunktionen für Intervalle

2. **`store/studyStore.ts`**
   - Progress Management
   - Session Verwaltung
   - Supabase Integration

3. **`app/study/session/[id].tsx`**
   - Lern-UI mit Bewertungsbuttons
   - Intervall-Vorschau

4. **Datenbank-Migrationen**
   - `create_card_progress_table`
   - `create_study_sessions_table`

### Wichtige Funktionen

```typescript
// Hauptfunktion für SM-2 Berechnung
calculateSM2(quality, repetitions, previousInterval, previousEaseFactor)

// Schwierigkeit zu Qualität konvertieren
difficultyToQuality(difficulty: 'easy' | 'medium' | 'hard' | 'again')

// Prüfen ob Karte fällig ist
isCardDue(nextReviewDate: Date | string)

// Review-Queue organisieren
organizeReviewQueue(cards: CardProgress[])
```

## Best Practices

### Für Nutzer

1. **Ehrliche Bewertung**: Bewerte Karten ehrlich für optimale Intervalle
2. **Tägliches Lernen**: Regelmäßigkeit ist wichtiger als Intensität
3. **Reviews priorisieren**: Fällige Reviews vor neuen Karten

### Für Entwickler

1. **Ease Factor Grenzen**: Nie unter 1.3 fallen lassen
2. **Timezone-Handling**: Reviews um 4 Uhr morgens zurücksetzen
3. **Progress Backup**: Regelmäßig in Datenbank persistieren

## Wissenschaftliche Grundlagen

### Forschung
- Basiert auf Piotr Wozniak's SuperMemo Forschung (1987)
- Ebbinghaus Vergessenskurve (1885)
- Cognitive Science Prinzipien

### Effektivität
- **Studien zeigen**: 50% weniger Lernzeit bei gleicher Retention
- **Langzeit-Retention**: Bis zu 95% nach 1 Jahr möglich
- **Optimal für**: Vokabeln, Fakten, Formeln, Konzepte

## Vergleich mit anderen Systemen

| Feature | Cards | Anki | Quizlet |
|---------|----------|------|---------|
| Algorithmus | SM-2 | SM-2+ | Proprietary |
| Open Source | ✅ | ✅ | ❌ |
| Cloud Sync | ✅ | Partial | ✅ |
| Mobile App | ✅ | ✅ | ✅ |
| Kostenlos | ✅ | ✅ | Freemium |

## Zukünftige Verbesserungen

### Geplant
- [ ] FSRS (Free Spaced Repetition Scheduler) als Alternative
- [ ] Machine Learning für personalisierte Intervalle
- [ ] Heatmap-Kalender für Lernstreak
- [ ] Detaillierte Statistiken pro Karte
- [ ] Import/Export von Anki-Decks

### Experimentell
- [ ] Adaptive Tageszeit-Optimierung
- [ ] Kontext-basierte Schwierigkeit
- [ ] Gruppen-Lernstatistiken

## Troubleshooting

### Problem: Zu viele Reviews
**Lösung**: Tägliches Limit einführen, schwierige Karten vereinfachen

### Problem: Karten werden zu schnell vergessen
**Lösung**: Ease Factor manuell reduzieren, mehr Kontext hinzufügen

### Problem: Intervalle zu lang
**Lösung**: Bei Unsicherheit "Schwer" statt "Gut" wählen

## Fazit

Das Spaced Repetition System in Cards bietet eine wissenschaftlich fundierte, effiziente Methode zum Langzeit-Lernen. Durch die SM-2 Implementation erreichen Nutzer optimale Lernresultate mit minimalem Zeitaufwand.

---

*Letzte Aktualisierung: November 2024*
*Version: 1.0.0*