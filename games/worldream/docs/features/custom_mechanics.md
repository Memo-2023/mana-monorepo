# Custom Mechanics System - Konzeptbericht

## Executive Summary

Worldream kann von einer reinen Text-Plattform zu einem flexiblen System erweitert werden, das es Nutzern ermöglicht, eigene Mechaniken und Regelsysteme zu erstellen. Dieser Bericht stellt verschiedene Ansätze vor, die es ermöglichen würden, beliebige Spielmechaniken, Progressionssysteme und Weltregeln zu implementieren, ohne die Einfachheit und Flexibilität der Plattform zu opfern.

## Problemstellung

Aktuelle Weltenbau-Tools fallen typischerweise in zwei Extreme:

1. **Zu simpel**: Reine Text-Editoren ohne strukturierte Daten oder Mechaniken
2. **Zu starr**: Vordefinierte Systeme (D&D, Pathfinder), die Nutzer in bestimmte Regelwerke zwingen

Worldream hat die Chance, die goldene Mitte zu finden: Eine Plattform, die es Nutzern erlaubt, ihre eigenen Mechaniken zu definieren, während sie gleichzeitig von der Arbeit anderer profitieren können.

## Kernkonzepte

### 1. Custom Fields System - Das Fundament

#### Überblick
Das Custom Fields System bildet die Basis aller erweiterten Mechaniken. Es erlaubt Nutzern, eigene strukturierte Datenfelder zu beliebigen Content Nodes hinzuzufügen.

#### Funktionsweise
Nutzer können für jeden Node-Typ (Character, Object, Place, Story, World) eigene Felder definieren. Diese Felder sind typisiert und können verschiedene Formen annehmen:

- **Text-Felder**: Für kurze oder lange Textinhalte
- **Zahlen-Felder**: Integer oder Dezimalzahlen mit optionalen Min/Max-Werten
- **Bereichs-Felder**: Slider zwischen zwei Werten (z.B. 0-100 für Prozentwerte)
- **Auswahl-Felder**: Dropdown oder Radio-Buttons mit vordefinierten Optionen
- **Formel-Felder**: Berechnete Werte basierend auf anderen Feldern
- **Referenz-Felder**: Verweise auf andere Nodes (z.B. "Heimatort" → Place-Node)

#### Anwendungsbeispiele

**Fantasy-RPG Charakter:**
- Stärke: Zahl (3-18)
- Klasse: Auswahl (Krieger, Magier, Schurke)
- Trefferpunkte: Formel (Konstitution × 10 + Level × 5)
- Heimat: Referenz auf Place-Node

**Sci-Fi Raumschiff:**
- Hüllenstärke: Bereich (0-100%)
- Antriebstyp: Auswahl (Warp, Hyperraum, Subraum)
- Crew-Kapazität: Zahl (1-10000)
- Energieverbrauch: Formel (Antrieb × 2 + Waffen + Schilde)

#### Kategorisierung und Organisation
Felder können in logische Gruppen organisiert werden:
- Kampfwerte (Angriff, Verteidigung, Initiative)
- Soziale Attribute (Charisma, Reputation, Einfluss)
- Ressourcen (Gold, Munition, Treibstoff)

Diese Kategorien helfen bei der Übersichtlichkeit, besonders wenn Dutzende Custom Fields existieren.

### 2. Rule Templates - Vorgefertigte Systeme

#### Konzept
Rule Templates sind kuratierte Sammlungen von Custom Fields, Berechnungen und Regeln, die als Paket importiert werden können. Sie lösen das "Kaltstartproblem" - neue Nutzer müssen nicht bei Null anfangen.

#### Template-Struktur
Ein Template enthält:
- **Metadaten**: Name, Beschreibung, Autor, Version
- **Feld-Definitionen**: Alle Custom Fields des Systems
- **Berechnungsregeln**: Formeln und Abhängigkeiten
- **Standardwerte**: Sinnvolle Ausgangswerte
- **Dokumentation**: Erklärungen zur Nutzung
- **Beispiel-Content**: Optional vorgefertigte Charaktere/Objekte

#### Community-Aspekt
Templates können in einer öffentlichen Bibliothek geteilt werden:

**Offizielle Templates:**
- "Worldream Starter" - Einfache Basis-Mechaniken
- "Narrative Focus" - Für story-zentrierte Welten
- "Tactical Combat" - Detaillierte Kampfmechaniken

**Community Templates:**
- "Lovecraftian Horror" - Wahnsinn, Okkultismus, Verbotenes Wissen
- "Political Intrigue" - Einfluss, Loyalität, Geheimnisse
- "Hard Sci-Fi" - Realistische Physik, Ressourcenmanagement
- "Superhelden" - Kräfte, Schwächen, Geheimidentitäten

#### Evolution und Anpassung
Templates sind nicht statisch:
- Nutzer können importierte Templates modifizieren
- Modifizierte Versionen können als neue Templates geteilt werden
- Versionierung ermöglicht Updates ohne Datenverlust
- "Forking" erlaubt Varianten (z.B. "D&D 5e - Grimdark Edition")

### 3. Dynamic Traits System

#### Grundkonzept
Traits sind mehr als simple Werte - sie sind lebendige Eigenschaften, die sich entwickeln, interagieren und die Story beeinflussen.

#### Trait-Typen

**Skills (Fähigkeiten):**
- Haben Erfahrungsstufen (Anfänger → Meister)
- Können durch Übung verbessert werden
- Verfallen möglicherweise ohne Nutzung
- Beispiel: "Bogenschießen", "Diplomatie", "Hacken"

**Attributes (Attribute):**
- Grundlegende Charaktereigenschaften
- Beeinflussen andere Werte
- Ändern sich selten
- Beispiel: "Intelligenz", "Ausdauer", "Willenskraft"

**Resources (Ressourcen):**
- Verbrauchbare oder regenerierende Werte
- Haben Maximum und aktuellen Wert
- Beispiel: "Mana", "Reputation", "Sanity"

**States (Zustände):**
- Temporäre Bedingungen
- Haben Auslöser und Dauer
- Beispiel: "Vergiftet", "Inspiriert", "Erschöpft"

**Relationships (Beziehungen):**
- Verbindungen zu anderen Entities
- Mehrdimensional und dynamisch
- Beispiel: "Mentor von X", "Rivale von Y"

#### Progression und Entwicklung

**Erfahrungsbasiert:**
- Traits verbessern sich durch Nutzung
- "Schwertkampf" steigt nach 10 erfolgreichen Kämpfen
- Realistische Lernkurven (schnell am Anfang, langsamer später)

**Meilenstein-basiert:**
- Große Sprünge bei bestimmten Ereignissen
- "Magieresistenz" nach Überleben eines Drachenangriffs
- Story-relevante Entwicklungen

**Verfall und Verlust:**
- Ungenutzte Skills können schwächer werden
- Traumatische Ereignisse können Traits reduzieren
- Alter oder Verletzungen beeinflussen physische Traits

#### Abhängigkeiten und Synergien

**Voraussetzungen:**
- "Fortgeschrittene Magie" benötigt "Grundlegende Magie" Level 5
- "Adelstitel" benötigt "Reputation" > 75

**Modifikatoren:**
- "Müdigkeit" reduziert alle physischen Skills um 20%
- "Gesegnete Waffe" erhöht "Schwertkampf" um +3
- "Mentor" verdoppelt Lerngeschwindigkeit

**Kombinationen:**
- "Akrobatik" + "Schwertkampf" = Spezialangriff verfügbar
- "Alchemie" + "Kochen" = Kann magische Speisen herstellen

### 4. State Machines - Zustandsautomaten

#### Konzept
State Machines modellieren komplexe Zustände und deren Übergänge. Sie sind ideal für alles, was klare Phasen oder Stadien durchläuft.

#### Anwendungsbereiche

**Charakter-Loyalität:**
```
Feindlich → Misstrauisch → Neutral → Freundlich → Loyal → Ergeben
```
Übergänge durch: Geschenke, gemeinsame Quests, Verrat, Zeit

**Quest-Fortschritt:**
```
Unbekannt → Gerücht → Entdeckt → Angenommen → In Arbeit → Fast fertig → Abgeschlossen
                                            ↓
                                     Gescheitert → Wiederholt
```

**Objekt-Zustände:**
```
Magisches Schwert:
Versiegelt → Erwachend → Aktiv → Überladen → Ausgebrannt
                            ↓
                      Korrumpiert → Gereinigt
```

**Beziehungs-Dynamik:**
```
Fremde → Bekannte → Freunde → Beste Freunde
                        ↓            ↓
                    Liebende    Zerstritten → Versöhnt
```

#### Zustandseigenschaften
Jeder Zustand kann eigene Eigenschaften haben:

**Loyalität "Ergeben":**
- Befolgt alle Befehle automatisch
- Teilt alle Geheimnisse
- Kämpft bis zum Tod
- Immun gegen Bestechung

**Quest "Fast fertig":**
- Finale Konfrontation verfügbar
- Keine neuen Nebenquests
- Zeitdruck erhöht
- Belohnung vorbereitet

#### Übergangsbedingungen

**Einfache Trigger:**
- Zeit vergangen (3 Tage im Zustand)
- Aktion ausgeführt (Geschenk gegeben)
- Schwellwert erreicht (Reputation > 50)

**Komplexe Bedingungen:**
- Mehrere Anforderungen (Gold > 100 UND Quest erledigt)
- Wahrscheinlichkeiten (30% Chance bei jedem Gespräch)
- Externe Events (Wenn Krieg ausbricht)

### 5. Goals & Achievements System

#### Zielsetzung
Goals geben Struktur und Richtung. Sie machen Fortschritt messbar und belohnen Spieler/Leser für Engagement.

#### Ziel-Typen

**Persönliche Ziele (Character Goals):**
- "Werde der reichste Händler der Stadt"
- "Räche den Tod meines Vaters"
- "Meistere alle Kampfkünste"

**Welt-Ziele (World Goals):**
- "Verhindere die Apokalypse"
- "Vereinige die zerstrittenen Königreiche"
- "Entdecke den verschollenen Kontinent"

**Meta-Ziele (Reader/Player Goals):**
- "Erkunde alle Locations"
- "Triff alle Charaktere"
- "Enthülle alle Geheimnisse"

#### Fortschrittsverfolgung

**Quantitative Ziele:**
- Sammle 1000 Goldstücke (aktuell: 450/1000)
- Besiege 10 Drachen (aktuell: 3/10)
- Bereise 5 Kontinente (aktuell: 2/5)

**Qualitative Ziele:**
- Meilensteine mit Ja/Nein
- "Finde den verlorenen Tempel" ✓
- "Überzeuge den König" ✗
- "Entschlüssele die Prophezeiung" ✓

**Bedingte Ziele:**
- Erscheinen nur unter bestimmten Umständen
- Versteckte Ziele, die sich erst enthüllen
- Branching paths mit unterschiedlichen Zielen

#### Belohnungssysteme

**Mechanische Belohnungen:**
- Neue Traits oder Skills freischalten
- Stat-Boosts (+5 auf alle Kampfwerte)
- Spezialfähigkeiten oder Items

**Narrative Belohnungen:**
- Neue Story-Pfade öffnen sich
- Charaktere reagieren anders
- Weltveränderungen (neuer König, Frieden)

**Meta-Belohnungen:**
- Achievements/Trophäen
- Freischaltbare Bonus-Inhalte
- Alternative Enden

### 6. Relationship Matrix

#### Mehrdimensionale Beziehungen
Beziehungen sind selten eindimensional. Die Relationship Matrix erlaubt nuancierte Darstellung.

#### Dimensionen

**Klassische Dimensionen:**
- Zuneigung (-100 bis +100)
- Respekt (0 bis 100)
- Vertrauen (0 bis 100)
- Furcht (0 bis 100)

**Situative Dimensionen:**
- Schuld (was schuldet A dem B?)
- Wissen (was weiß A über B?)
- Einfluss (wie sehr kann A B beeinflussen?)

**Kulturelle Dimensionen:**
- Ehre (in Samurai-Settings)
- Blutschuld (in Vampir-Settings)
- Karma (in spirituellen Settings)

#### Asymmetrie und Perspektive
Beziehungen sind oft nicht symmetrisch:
- A vertraut B: 90, B vertraut A: 20
- A fürchtet B: 80, B beachtet A kaum: 10
- A liebt B: 100, B sieht A als Freund: 60

#### Dynamische Entwicklung

**Event-basierte Änderungen:**
- Gemeinsame Schlacht: Vertrauen +20, Respekt +15
- Verrat: Vertrauen -100, Furcht +30, Zuneigung -50
- Geschenk: Zuneigung +10, Schuld +Geschenkwert

**Zeit-basierte Änderungen:**
- Ohne Kontakt sinkt Vertrauen langsam
- Alte Wunden heilen (Zorn -1 pro Monat)
- Gewohnheit steigert Zuneigung

**Schwellenwert-Effekte:**
- Vertrauen > 80: Teilt Geheimnisse
- Furcht > 90: Flieht bei Begegnung
- Respekt < 20 UND Furcht < 30: Wird aggressiv
- Zuneigung > 60 UND Vertrauen > 70: Romantik möglich

### 7. Inventory & Crafting System

#### Inventar-Management

**Slot-basierte Systeme:**
- Ausrüstungsplätze (Kopf, Brust, Hände, etc.)
- Kategorisierte Taschen (Waffen, Tränke, Materialien)
- Begrenzte Kapazität pro Kategorie

**Gewichts-basierte Systeme:**
- Realistisches Gewichtsmanagement
- Traglast basierend auf Stärke
- Überladung reduziert Beweglichkeit

**Abstraktes System:**
- "Bedeutende Gegenstände" ohne Details
- Narrative Freiheit bei Kleinzeug
- Fokus auf story-relevante Items

#### Crafting-Mechaniken

**Rezept-basiert:**
- Feste Kombinationen (Eisen + Kohle = Stahl)
- Qualitätsstufen basierend auf Skill
- Chance auf besondere Eigenschaften

**Experimentell:**
- Freie Kombinationen mit Überraschungen
- Entdeckung neuer Rezepte
- Risiko von Fehlschlägen oder Unfällen

**Narrativ:**
- Crafting als Story-Element
- Quests für seltene Materialien
- Legendäre Schmiede oder Werkstätten

### 8. Magic & Ability Systems

#### Magie-Paradigmen

**Mana-basiert:**
- Klassisches Ressourcen-System
- Regeneration über Zeit oder Ruhe
- Verschiedene Mana-Typen (Feuer, Wasser, etc.)

**Vorbereitung-basiert:**
- Zauber müssen vorbereitet werden
- Begrenzte Slots pro Tag
- Flexibilität vs. Macht

**Risiko-basiert:**
- Magie hat Konsequenzen
- Erschöpfung, Wahnsinn, Corruption
- Große Macht = Großes Risiko

**Komponenten-basiert:**
- Benötigt physische Komponenten
- Seltene Zutaten für mächtige Zauber
- Ökonomischer Aspekt

#### Fähigkeiten-Kombinationen

**Synergie-System:**
- Feuer + Wind = Feuersturm
- Illusion + Telepathie = Falsche Erinnerungen
- Heilung + Nekromantie = Untod verhindern

**Combo-System:**
- Reihenfolgen wichtig
- Schnelligkeit vs. Macht
- Unterbrechungsrisiko

### 9. Timeline & Event System

#### Kalender-Systeme

**Eigene Zeitrechnung:**
- Anpassbare Tage, Wochen, Monate
- Mehrere Monde oder Sonnen
- Kulturelle Unterschiede (Ork-Kalender vs. Elfen-Kalender)

**Event-Planung:**
- Wiederkehrende Ereignisse (Feste, Märkte)
- Einmalige Events (Sonnenfinsternis, Komet)
- Bedingte Events (Wenn X dann Y)

#### Trigger-Mechanismen

**Zeit-Trigger:**
- Nach X Tagen geschieht Y
- Bestimmtes Datum erreicht
- Periodische Events

**Bedingungs-Trigger:**
- Wenn Held Level 10 erreicht
- Wenn zwei Charaktere sich treffen
- Wenn Item gefunden wird

**Kaskaden-Events:**
- Event A löst Event B aus
- Kettenreaktionen möglich
- Butterfly-Effect-Simulation

### 10. Faction & Reputation System

#### Fraktions-Mechaniken

**Fraktions-Eigenschaften:**
- Werte und Ideologie
- Ressourcen und Macht
- Territorium und Einfluss
- Feinde und Verbündete

**Spieler-Interaktion:**
- Reputation pro Fraktion (-100 bis +100)
- Ränge und Titel
- Exklusive Quests und Belohnungen
- Konsequenzen der Zugehörigkeit

**Fraktions-Dynamik:**
- Kriege und Allianzen
- Machtkämpfe intern
- Wirtschaftliche Konkurrenz
- Ideologische Wandel

#### Reputation-Effekte

**Soziale Auswirkungen:**
- NPC-Reaktionen ändern sich
- Preise in Läden variieren
- Zugang zu exklusiven Orten
- Informationsfluss

**Mechanische Auswirkungen:**
- Rekrutierbare Verbündete
- Verfügbare Quests
- Handelsmöglichkeiten
- Sichere Häfen

## Implementierungsstrategie

### Phase 1: Foundation (Monate 1-2)
1. **Custom Fields System** implementieren
2. Basis-UI für Feld-Definition
3. Einfache Formeln und Berechnungen
4. Import/Export als JSON

### Phase 2: Templates (Monate 3-4)
1. Template-Struktur definieren
2. Template-Bibliothek aufbauen
3. Community-Sharing vorbereiten
4. Erste offizielle Templates

### Phase 3: Advanced Mechanics (Monate 5-8)
1. Dynamic Traits System
2. State Machines
3. Relationship Matrix
4. Goals & Achievements

### Phase 4: Specialized Systems (Monate 9-12)
1. Inventory & Crafting
2. Magic & Abilities
3. Timeline & Events
4. Factions & Reputation

### Phase 5: Polish & Integration (Monate 13-14)
1. Visuelle Editoren
2. Performance-Optimierung
3. Tutorial-System
4. Community-Features

## Technische Überlegungen

### Datenbankstruktur

**Erweiterung content_nodes:**
```
- custom_schema: JSONB (Feld-Definitionen)
- custom_data: JSONB (Aktuelle Werte)
- mechanics_template: UUID (Verweis auf Template)
- mechanics_version: INTEGER (Für Updates)
```

**Neue Tabellen:**
```
- mechanics_templates (Template-Bibliothek)
- mechanics_calculations (Formel-Cache)
- mechanics_events (Event-Queue)
- mechanics_history (Änderungsprotokoll)
```

### Performance-Überlegungen

**Caching:**
- Berechnete Werte cachen
- Abhängigkeits-Graph für Updates
- Lazy Loading für komplexe Mechaniken

**Skalierung:**
- Mechaniken optional aktivierbar
- Progressive Enhancement
- Modularer Aufbau

### User Experience

**Onboarding:**
- Wizard für erste Mechaniken
- Template-Empfehlungen basierend auf Genre
- Interaktive Tutorials

**Komplexitäts-Management:**
- Standard/Advanced Modi
- Verstecken ungenutzter Features
- Kontextuelle Hilfe

## Risiken und Herausforderungen

### Komplexitäts-Falle
**Risiko:** System wird zu komplex für Casual-Nutzer
**Mitigation:** 
- Klare Trennung zwischen Basic und Advanced
- Templates als Einstiegshilfe
- Progressive Disclosure of Features

### Performance-Probleme
**Risiko:** Viele Berechnungen verlangsamen das System
**Mitigation:**
- Intelligentes Caching
- Background-Processing
- Optimierte Formeln

### Inkonsistenzen
**Risiko:** Nutzer erstellen widersprüchliche Regeln
**Mitigation:**
- Validierungs-System
- Warnings bei Konflikten
- Rollback-Möglichkeiten

### Community-Qualität
**Risiko:** Schlechte Templates überfluten Bibliothek
**Mitigation:**
- Kuratierung und Bewertungen
- Offizielle vs. Community-Trennung
- Qualitäts-Guidelines

## Erfolgskriterien

### Quantitative Metriken
- 50% der Nutzer verwenden mindestens ein Custom Field
- 20% der Nutzer erstellen eigene Templates
- 30% Steigerung der Session-Dauer
- 40% höhere Retention nach 30 Tagen

### Qualitative Ziele
- Nutzer berichten von mehr Kreativität
- Reduzierte Abhängigkeit von externen Tools
- Positive Community-Entwicklung
- Entstehung von Sub-Communities um Templates

## Fazit

Das Custom Mechanics System würde Worldream zu einer einzigartigen Plattform machen, die die Flexibilität eines Text-Editors mit der Struktur eines Regelsystems verbindet. Durch den modularen, community-getriebenen Ansatz kann jeder Nutzer genau die Komplexität wählen, die zu seinem Projekt passt.

Der Schlüssel zum Erfolg liegt in der schrittweisen Implementierung, beginnend mit dem Custom Fields System als solidem Fundament. Von dort aus können komplexere Systeme aufgebaut werden, immer mit dem Fokus auf Nutzerfreundlichkeit und Story-Förderung.

Diese Mechaniken sind nicht nur Features - sie sind Werkzeuge, die Geschichtenerzählern helfen, reichere, konsistentere und interaktivere Welten zu erschaffen. Sie transformieren Worldream von einem Dokumentations-Tool zu einer lebendigen Plattform für kreatives Weltenbau.

## Anhang: Use Cases

### Use Case 1: Fantasy-Autor
Maria schreibt eine Fantasy-Serie und nutzt Worldream für Worldbuilding. Sie importiert das "Classic Fantasy" Template, das grundlegende Stats wie Stärke und Magie enthält. Sie passt es an, fügt eigene Magieformen hinzu und teilt ihr "Elemental Harmony" System mit der Community. Ihre Charaktere entwickeln sich über die Bücher hinweg, und sie trackt deren Fortschritt in Worldream.

### Use Case 2: Pen&Paper Spielleiter
Tom leitet eine Cyberpunk-Kampagne. Er kombiniert das "Cyberpunk 2077" Template mit dem "Corporate Politics" Template. Seine Spieler können ihre Charaktere in Worldream verwalten, während er die Faction-Reputation trackt und Story-Events plant. Das System berechnet automatisch Kampfwerte basierend auf Cyberware-Implantaten.

### Use Case 3: Indie-Game Developer
Alex entwickelt ein narratives Indie-Game. Sie nutzt Worldream für das Narrative Design und exportiert die Mechaniken als JSON für ihre Game-Engine. Die State Machines definieren NPC-Verhalten, während das Goals System die Quest-Struktur vorgibt. Updates in Worldream können direkt ins Spiel importiert werden.

### Use Case 4: Bildungsbereich
Professor Kim nutzt Worldream für historische Simulationen. Studenten erstellen historische Charaktere mit period-appropriate Traits und simulieren politische Entscheidungen. Das Timeline-System hilft, Ursache und Wirkung zu verstehen, während das Faction-System Machtdynamiken visualisiert.

### Use Case 5: Collaborative Storytelling
Eine Online-Community erstellt gemeinsam eine Science-Fiction-Welt. Verschiedene Autoren fügen Charaktere und Orte hinzu, während das Regel-System Konsistenz sicherstellt. Das Reputation-System trackt, wie Charaktere verschiedener Autoren miteinander interagieren. Goals geben der Community gemeinsame Ziele.

---

*Dieser Bericht stellt eine Vision für die Zukunft von Worldream dar. Die Implementierung sollte iterativ erfolgen, mit kontinuierlichem Nutzer-Feedback und Anpassungen basierend auf tatsächlicher Verwendung.*