# Decks erstellen in Manadeck

## Übersicht

Manadeck ermöglicht es Benutzern, eigene Lernkarten-Decks zu erstellen und zu verwalten. Diese Anleitung zeigt dir, wie du neue Decks erstellen und konfigurieren kannst.

## Deck-Erstellung Schritt für Schritt

### 1. Deck-Erstellung starten

Es gibt mehrere Wege, ein neues Deck zu erstellen:

- **Home-Seite**: Klicke auf den "Neues Deck erstellen" Button im Schnellstart-Bereich
- **Decks-Seite**: Wenn noch keine Decks vorhanden sind, klicke auf "Deck erstellen"
- **Direkter Weg**: Navigiere zu `/deck/create`

### 2. Deck-Informationen eingeben

Beim Erstellen eines neuen Decks musst du folgende Informationen angeben:

#### Grunddaten

- **Titel**: Ein aussagekräftiger Name für dein Deck
- **Beschreibung**: Eine kurze Erklärung, worum es in dem Deck geht
- **Kategorie**: Wähle eine passende Kategorie (Sprachen, Wissenschaft, Mathematik, etc.)

#### Sichtbarkeits-Einstellungen

- **Privat**: Nur du kannst das Deck sehen und verwenden
- **Öffentlich**: Andere Benutzer können dein Deck in der Explore-Sektion finden

### 3. Karten hinzufügen

Nach der Deck-Erstellung kannst du Karten hinzufügen:

#### Kartentypen

Manadeck unterstützt verschiedene Kartentypen:

1. **Text-Karten**: Klassische Vorderseite/Rückseite Karten
2. **Bild-Karten**: Karten mit Bildern
3. **Audio-Karten**: Karten mit Audiodateien
4. **Multiple-Choice**: Karten mit Auswahlmöglichkeiten

#### Karten-Erstellung

- **Vorderseite**: Die Frage oder der Begriff
- **Rückseite**: Die Antwort oder Erklärung
- **Hinweise**: Optionale Hilfestellungen
- **Tags**: Zur besseren Organisation und Suche

### 4. KI-unterstützte Erstellung

Manadeck bietet KI-Features zur Deck-Erstellung:

#### Smart Card Creator

- Automatische Generierung von Karten basierend auf einem Thema
- KI schlägt passende Fragen und Antworten vor
- Unterstützt verschiedene Schwierigkeitsgrade

#### Image Card Creator

- Erstellung von Bildkarten mit KI-generierten oder hochgeladenen Bildern
- Automatische Beschreibungen und Fragen zu Bildern

### 5. Deck-Verwaltung

#### Einstellungen

- **Metadaten bearbeiten**: Titel, Beschreibung, Kategorie ändern
- **Sichtbarkeit**: Zwischen privat und öffentlich wechseln
- **Tags**: Deck-Tags für bessere Organisation

#### Organisation

- **Favoriten**: Wichtige Decks als Favoriten markieren
- **Sortierung**: Decks nach verschiedenen Kriterien sortieren
- **Suchfunktion**: Decks schnell finden

## Best Practices

### Deck-Design

1. **Klare Titel**: Verwende aussagekräftige und spezifische Titel
2. **Gute Beschreibungen**: Erkläre kurz, was gelernt wird und für wen das Deck geeignet ist
3. **Konsistente Struktur**: Halte das Format der Karten einheitlich
4. **Angemessene Größe**: 20-50 Karten pro Deck für optimales Lernen

### Karten-Gestaltung

1. **Eine Idee pro Karte**: Jede Karte sollte nur ein Konzept behandeln
2. **Klare Formulierungen**: Vermeide mehrdeutige Fragen
3. **Sinnvolle Reihenfolge**: Ordne Karten logisch an
4. **Regelmäßige Updates**: Überarbeite und verbessere deine Karten

### Öffentliche Decks

Wenn du dein Deck öffentlich machst:

1. **Qualität sicherstellen**: Überprüfe alle Karten auf Richtigkeit
2. **Vollständigkeit**: Stelle sicher, dass das Deck ein Thema vollständig abdeckt
3. **Zielgruppe definieren**: Gib an, für wen das Deck geeignet ist
4. **Lizenz beachten**: Verwende nur Inhalte, die du verwenden darfst

## Technische Details

### Datenbankstruktur

Decks werden in der `decks` Tabelle gespeichert mit folgenden Feldern:

- `id`: Eindeutige ID
- `title`: Deck-Titel
- `description`: Beschreibung
- `is_public`: Sichtbarkeits-Flag
- `user_id`: Ersteller-ID
- `category`: Kategorie
- `created_at`: Erstellungsdatum
- `metadata`: Zusätzliche Informationen (JSON)

### API-Endpunkte

- `POST /api/decks`: Neues Deck erstellen
- `PUT /api/decks/:id`: Deck bearbeiten
- `DELETE /api/decks/:id`: Deck löschen
- `GET /api/decks/public`: Öffentliche Decks abrufen

## Fehlerbehebung

### Häufige Probleme

1. **Deck wird nicht gespeichert**
   - Überprüfe die Internetverbindung
   - Stelle sicher, dass alle Pflichtfelder ausgefüllt sind

2. **Karten werden nicht angezeigt**
   - Lade die Seite neu
   - Überprüfe, ob die Karten korrekt gespeichert wurden

3. **Bilder werden nicht hochgeladen**
   - Überprüfe die Dateigröße (max. 5MB)
   - Unterstützte Formate: JPG, PNG, WebP

## Support

Bei Problemen oder Fragen:

- Überprüfe diese Dokumentation
- Schaue in die FAQ-Sektion
- Kontaktiere den Support über die App

---

_Letzte Aktualisierung: 2025-09-24_
