# Time Simulation System - Lebendige Welten

## Vision

Ein revolutionäres Zeitsimulationssystem, das Worldream-Welten zum Leben erweckt. Charaktere führen autonome Leben, treffen Entscheidungen, interagieren miteinander und die Welt entwickelt sich organisch weiter - auch wenn der Autor nicht aktiv schreibt.

## 🎯 Kernkonzepte

### Was ist Time Simulation?

Time Simulation ermöglicht es, Zeit in der fiktiven Welt vergehen zu lassen und automatisch zu generieren, was in dieser Zeit passiert ist. Jeder Charakter hat einen Tagesablauf, Ziele, Bedürfnisse und reagiert auf Ereignisse in der Welt.

Stellen Sie sich vor: Sie lassen in Ihrer Geschichte einen halben Tag vergehen. Anstatt manuell zu überlegen, was jeder Charakter in dieser Zeit getan hat, generiert das System automatisch plausible Aktivitäten. Der Schmied hat Hufeisen geschmiedet, die Händlerin war auf dem Markt, der Dieb hat die Taverne ausgekundschaftet, und zwei Charaktere sind sich zufällig begegnet und hatten eine bedeutsame Unterhaltung. All das entsteht organisch aus den Persönlichkeiten, Bedürfnissen und Umständen der Charaktere.

### Warum ist das revolutionär?

- **Lebendige Welten**: Charaktere sind keine statischen Entitäten mehr, die nur existieren, wenn sie "auf der Bühne" sind. Sie leben, arbeiten, schlafen, treffen Entscheidungen - auch im Hintergrund.

- **Emergente Geschichten**: Unerwartete Ereignisse entstehen durch die natürliche Interaktion von Charakteren. Vielleicht entwickelt sich eine Romanze zwischen zwei Nebenfiguren, oder ein zufälliges Treffen führt zu einem neuen Konflikt.

- **Realismus**: Die Welt fühlt sich echt an, da sie sich kontinuierlich entwickelt. Märkte schwanken, Beziehungen verändern sich, Geheimnisse werden entdeckt - alles ohne direktes Zutun des Autors.

- **Inspiration**: Autoren entdecken neue Story-Möglichkeiten durch Simulation. Das System kann Wendungen vorschlagen, die der Autor selbst nicht erdacht hätte.

- **Konsistenz**: Keine Logiklöcher mehr wie "Was hat Charakter X die ganze Zeit gemacht?" - das System trackt kontinuierlich alle Aktivitäten.

## 🚀 Implementierungs-Ansätze

### Ansatz 1: **Event-Driven Simulation**

#### Konzept

Die Event-Driven Simulation behandelt Zeit als eine Abfolge von diskreten Ereignissen. Jedes Ereignis hat einen Zeitpunkt, eine Dauer und Konsequenzen. Das System generiert zunächst geplante Ereignisse (wie tägliche Routinen), prüft dann auf Kollisionen (wenn Charaktere sich zur gleichen Zeit am gleichen Ort befinden) und erzeugt daraus neue Ereignisse (Begegnungen, Konflikte, Entdeckungen).

Das System arbeitet in mehreren Phasen:

1. **Routine-Generierung**: Basierend auf Tageszeit und Charakterprofil werden alltägliche Aktivitäten geplant (Arbeit, Mahlzeiten, Schlaf)
2. **Kollisionserkennung**: Das System erkennt, wenn mehrere Charaktere zur gleichen Zeit am gleichen Ort sind
3. **Interaktions-Generierung**: Aus Kollisionen werden Begegnungen, die zu Gesprächen, Konflikten oder gemeinsamen Aktivitäten führen können
4. **Kettenreaktionen**: Ereignisse können Folgeereignisse auslösen (ein Streit führt zu Racheplänen, eine Entdeckung zu Gerüchten)
5. **Weltzustands-Update**: Die Auswirkungen aller Ereignisse werden auf den Weltzustand angewendet

#### Event-Kategorien

- **Routine-Events**: Alltägliche, vorhersehbare Aktivitäten (Arbeit, Essen, Schlafen)
- **Begegnungs-Events**: Geplante oder zufällige Treffen zwischen Charakteren
- **Entscheidungs-Events**: Charaktere treffen wichtige Entscheidungen basierend auf ihrer Situation
- **Umwelt-Events**: Wetteränderungen, Tageszeiten, Naturereignisse
- **Konflikt-Events**: Streitigkeiten, Kämpfe, Diskussionen
- **Entdeckungs-Events**: Charaktere finden Objekte, erfahren Geheimnisse, machen Beobachtungen
- **Zustandsänderungs-Events**: Objekte werden bewegt, Orte verändern sich, Ressourcen werden verbraucht

#### Vorteile

- **Präzise Kontrolle**: Jedes Ereignis kann einzeln überprüft und angepasst werden
- **Nachvollziehbarkeit**: Klare Kausalketten - man kann genau sehen, warum etwas passiert ist
- **Performance**: Effizient, da nur relevante Ereignisse berechnet werden
- **Deterministisch**: Mit gleichen Eingaben entstehen gleiche Ergebnisse (gut für Debugging)
- **Skalierbar**: Funktioniert gut mit wenigen oder vielen Charakteren
- **Flexibel**: Neue Event-Typen können einfach hinzugefügt werden
- **Unterbrechbar**: Simulation kann jederzeit pausiert und fortgesetzt werden

#### Nachteile

- **Diskrete Zeitschritte**: Kontinuierliche Prozesse sind schwer abzubilden
- **Komplexe Interaktionen**: Bei vielen gleichzeitigen Ereignissen wird die Verwaltung komplex
- **Vorhersehbarkeit**: Kann zu repetitiven Mustern führen, wenn nicht genug Variation eingebaut wird
- **Speicherbedarf**: Alle Events müssen gespeichert werden für die Historie
- **Schwierige Parallelität**: Events müssen sequenziell verarbeitet werden
- **Künstliche Granularität**: Die Wahl der Zeitschritte beeinflusst stark das Ergebnis

### Ansatz 2: **Agent-Based Simulation**

#### Konzept

Bei der Agent-Based Simulation ist jeder Charakter ein völlig autonomer "Agent" mit eigenem Entscheidungssystem. Jeder Agent hat Bedürfnisse (Hunger, Schlaf, Soziales), Ziele (kurzfristig und langfristig), Erinnerungen und Beziehungen. Die Simulation läuft, indem jeder Agent kontinuierlich seine Umgebung wahrnimmt, seine Situation bewertet und Entscheidungen trifft.

Das Besondere: Es gibt keine zentrale Kontrolle. Die Welt entwickelt sich durch das Zusammenspiel aller autonomen Agenten. Jeder Agent durchläuft einen Zyklus:

1. **Wahrnehmung**: Was passiert um mich herum? Wer ist in der Nähe?
2. **Bewertung**: Wie geht es mir? Was brauche ich am dringendsten?
3. **Planung**: Was sollte ich als nächstes tun?
4. **Ausführung**: Die gewählte Aktion durchführen
5. **Lernen**: Aus dem Ergebnis lernen und Verhalten anpassen

#### Systeme pro Agent

- **Bedürfnissystem**: Hunger, Durst, Schlaf, Sicherheit, Soziales, Selbstverwirklichung - alle verfallen über Zeit und beeinflussen Entscheidungen
- **Zielsystem**: Kurz-, mittel- und langfristige Ziele mit Prioritäten und Fortschrittstracking
- **Erinnerungssystem**: Wichtige Ereignisse werden gespeichert und beeinflussen zukünftige Entscheidungen
- **Beziehungssystem**: Dynamische Beziehungen zu anderen Agenten mit Vertrauen, Zuneigung, Respekt
- **Emotionssystem**: Aktuelle Stimmung beeinflusst Entscheidungen und Interaktionen
- **Fähigkeitssystem**: Was kann der Agent tun und wie gut?

#### Vorteile

- **Emergente Komplexität**: Aus einfachen Regeln entstehen komplexe, realistische Verhaltensweisen
- **Natürliche Interaktionen**: Charaktere reagieren organisch aufeinander
- **Individuelle Persönlichkeiten**: Jeder Agent verhält sich einzigartig
- **Lernfähigkeit**: Agenten können aus Erfahrungen lernen und sich entwickeln
- **Parallelisierbar**: Agenten können gleichzeitig berechnet werden
- **Realistische Entscheidungen**: Berücksichtigt multiple Faktoren wie Bedürfnisse, Ziele, Emotionen
- **Dynamische Anpassung**: Agenten passen sich an veränderte Umstände an

#### Nachteile

- **Rechenintensiv**: Jeder Agent braucht kontinuierliche Berechnung
- **Schwer vorhersagbar**: Emergentes Verhalten kann zu unerwarteten Ergebnissen führen
- **Komplexes Balancing**: Schwierig, alle Systeme gut aufeinander abzustimmen
- **Debugging-Herausforderung**: Bei Fehlverhalten ist schwer nachzuvollziehen, warum
- **Potentielles Chaos**: Ohne Einschränkungen können unrealistische Situationen entstehen
- **Speicherintensiv**: Jeder Agent braucht viel Zustandsinformation
- **Schwierige Kontrolle**: Autor hat weniger direkte Kontrolle über Ereignisse

### Ansatz 3: **Narrative Graph Simulation**

#### Konzept

Die Narrative Graph Simulation modelliert Zeit als einen Graphen von möglichen Story-Pfaden. Anstatt einzelne Aktionen zu simulieren, arbeitet das System mit narrativen "Beats" - bedeutsamen Momenten, die die Geschichte vorantreiben. Das System bewertet verschiedene mögliche Entwicklungen nach ihrer narrativen Qualität und wählt den interessantesten Pfad.

Das System denkt wie ein Geschichtenerzähler:

1. **Beat-Generierung**: Welche interessanten Dinge könnten als nächstes passieren?
2. **Plausibilitätsbewertung**: Wie wahrscheinlich ist jeder Beat basierend auf Charakteren und Kontext?
3. **Interessantheitsbewertung**: Wie spannend/bedeutsam wäre dieser Beat für die Geschichte?
4. **Konsistenzbewertung**: Passt dieser Beat zu dem, was bisher passiert ist?
5. **Pfadauswahl**: Wähle den optimalen Pfad durch die möglichen Beats
6. **Elaboration**: Fülle die gewählten Beats mit Details

#### Story-Beat Kategorien

- **Routine-Beats**: Normale Tagesabläufe, die Charaktere etablieren
- **Konflikt-Beats**: Spannungen, Streitigkeiten, Kämpfe
- **Entdeckungs-Beats**: Geheimnisse werden gelüftet, Objekte gefunden
- **Beziehungs-Beats**: Entwicklungen zwischen Charakteren
- **Twist-Beats**: Überraschende Wendungen
- **Entwicklungs-Beats**: Charakterentwicklung, Lernen, Wachstum
- **Atmosphären-Beats**: Stimmungsvolle Momente ohne direkte Action

#### Vorteile

- **Narrativ fokussiert**: Garantiert interessante Geschichten
- **Dramaturgische Qualität**: Berücksichtigt Spannungsbogen und Pacing
- **Genrekonfom**: Kann auf bestimmte Genres optimiert werden
- **Autorenkontrolle**: Autor kann narrative Präferenzen einstellen
- **Effizient**: Überspringt langweilige Details
- **Kohärente Geschichten**: Achtet auf narrativen Zusammenhang
- **Thematische Konsistenz**: Kann Themen und Motive durchziehen

#### Nachteile

- **Weniger Realismus**: Priorisiert Drama über Realismus
- **Künstlich**: Kann sich "geschrieben" anfühlen statt organisch
- **Weniger Überraschungen**: Tendiert zu konventionellen Narrativen
- **Schwierige Balance**: Zwischen Interessantheit und Plausibilität
- **Genre-Bias**: Funktioniert besser für manche Genres als andere
- **Weniger Details**: Alltägliches wird oft übersprungen
- **Autorabhängig**: Qualität hängt stark von Konfiguration ab

### Ansatz 4: **Probability-Based Simulation**

#### Konzept

Die Probability-Based Simulation arbeitet mit Wahrscheinlichkeiten. Jedes mögliche Ereignis hat eine Basiswahrscheinlichkeit, die durch verschiedene Faktoren modifiziert wird: Charaktereigenschaften, aktuelle Situation, Tageszeit, Beziehungen, kürzliche Ereignisse. Das System "würfelt" dann, welche Ereignisse tatsächlich eintreten.

Der Prozess:

1. **Wahrscheinlichkeitsberechnung**: Für jeden Charakter und jede mögliche Aktion wird eine Wahrscheinlichkeit berechnet
2. **Modifikation**: Umstände erhöhen oder senken Wahrscheinlichkeiten
3. **Würfeln**: Zufallsgenerator entscheidet basierend auf Wahrscheinlichkeiten
4. **Konsequenzen**: Eingetretene Ereignisse verändern Wahrscheinlichkeiten für zukünftige Ereignisse
5. **Anpassung**: System lernt aus Mustern und passt Basiswahrscheinlichkeiten an

#### Wahrscheinlichkeitsfaktoren

- **Persönlichkeit**: Introvertierte haben geringere Wahrscheinlichkeit für soziale Events
- **Tageszeit**: Schlaf ist nachts wahrscheinlicher als mittags
- **Bedürfnisse**: Hunger erhöht Wahrscheinlichkeit für Essen
- **Routine**: Gewohnheiten haben höhere Wahrscheinlichkeit
- **Beziehungen**: Freunde treffen sich wahrscheinlicher als Fremde
- **Kontext**: Regen senkt Wahrscheinlichkeit für Outdoor-Aktivitäten
- **Geschichte**: Kürzliche Ereignisse beeinflussen zukünftige Wahrscheinlichkeiten

#### Vorteile

- **Natürliche Variation**: Realistische Mischung aus Routine und Überraschung
- **Einfach erweiterbar**: Neue Ereignisse sind nur neue Wahrscheinlichkeiten
- **Gut konfigurierbar**: Wahrscheinlichkeiten können fein eingestellt werden
- **Reproduzierbar**: Mit gleichem Seed entstehen gleiche Ergebnisse
- **Intuitiv verständlich**: Wahrscheinlichkeiten sind leicht nachvollziehbar
- **Flexible Zufälligkeit**: Grad der Zufälligkeit einstellbar
- **Effiziente Berechnung**: Nur Wahrscheinlichkeiten, keine komplexe Logik

#### Nachteile

- **Zufallsabhängig**: Kann zu unlogischen Sequenzen führen
- **Schwieriges Tuning**: Richtige Wahrscheinlichkeiten zu finden ist aufwändig
- **Keine Garantien**: Wichtige Events könnten nicht eintreten
- **Statistische Anomalien**: Extrem unwahrscheinliche Ereignisketten möglich
- **Wenig Kausalität**: Zusammenhänge zwischen Events nicht explizit
- **Balancing-Problem**: Zu viele Faktoren beeinflussen sich gegenseitig
- **Schwer zu debuggen**: Warum wurde gerade dieses Event gewürfelt?

## 📅 Zeitsysteme und Granularität

### Zeitgranularität-Ebenen

Das System muss verschiedene Zeitskalen handhaben können:

- **Minuten-Ebene**: Für intensive Szenen, Kämpfe, wichtige Gespräche. Jede Minute wird detailliert simuliert.
- **Stunden-Ebene**: Standard für normale Tagesabläufe. Aktivitäten in Stundenblöcken.
- **Tages-Ebene**: Für Zeitsprünge. Zusammenfassungen der wichtigsten Tagesereignisse.
- **Wochen-Ebene**: Für längere Entwicklungen. Fokus auf bedeutende Veränderungen.
- **Monats-Ebene**: Für Jahreszeiten und längere Projekte.
- **Jahres-Ebene**: Für epochale Veränderungen und Generationswechsel.

Das System wählt automatisch die passende Granularität basierend auf der zu simulierenden Zeitspanne und der Wichtigkeit der Ereignisse.

### Zeitfluss-Modi

- **Echtzeit**: Eine Minute Simulation = eine Minute in der Welt
- **Beschleunigt**: Typisch 60x - eine Minute Simulation = eine Stunde Weltzeit
- **Zeitsprung**: 1440x oder mehr - ganze Tage in Sekunden
- **Fokussiert**: Normale Geschwindigkeit für Hauptcharaktere, beschleunigt für Nebencharaktere
- **Ereignisgesteuert**: Zeit springt zum nächsten wichtigen Ereignis

## 🎭 Character Activity System

### Tagesroutinen

Jeder Charakter hat eine Grundroutine basierend auf:

- **Beruf/Rolle**: Bestimmt Hauptaktivitäten (Schmied -> Schmieden, Wache -> Patrouillieren)
- **Persönlichkeit**: Beeinflusst Timing und Prioritäten (Frühaufsteher vs. Nachteule)
- **Bedürfnisse**: Grundbedürfnisse müssen erfüllt werden (Essen, Schlafen)
- **Verpflichtungen**: Familiäre und soziale Verpflichtungen
- **Ziele**: Langfristige Ziele beeinflussen tägliche Aktivitäten
- **Jahreszeit**: Winter vs. Sommer verändert Aktivitäten
- **Wochentag**: Werktage vs. Feiertage

### Aktivitätsgenerierung

Das System generiert Aktivitäten durch:

1. **Basis-Template**: Grundgerüst basierend auf Rolle
2. **Persönlichkeits-Modifikation**: Anpassung an Charaktereigenschaften
3. **Kontext-Berücksichtigung**: Aktuelle Ereignisse und Umstände
4. **Bedürfnis-Priorisierung**: Dringende Bedürfnisse first
5. **Zufalls-Element**: Kleine Variationen für Realismus
6. **Interaktions-Möglichkeiten**: Wo könnten andere Charaktere getroffen werden?

## 🌊 Ripple Effects & Kausalität

### Ereignis-Kaskaden

Jedes Ereignis kann Folgen haben:

- **Direkte Konsequenzen**: Unmittelbare Auswirkungen
- **Sekundäre Effekte**: Reaktionen anderer Charaktere
- **Emotionale Wellen**: Stimmungsänderungen breiten sich aus
- **Informationsfluss**: Nachrichten und Gerüchte verbreiten sich
- **Wirtschaftliche Auswirkungen**: Märkte reagieren auf Ereignisse
- **Politische Folgen**: Machtverschiebungen
- **Langzeitkonsequenzen**: Verzögerte Auswirkungen

### Der Butterfly-Effekt

Kleine Ereignisse können große Auswirkungen haben:

- Ein zufälliges Treffen führt zu einer Romanze
- Ein verlorenes Objekt löst eine Questkette aus
- Ein Missverständnis eskaliert zum Krieg
- Eine kleine Hilfe wird später großzügig belohnt

Das System trackt diese Verbindungen und kann zeigen, wie aus kleinen Ursachen große Wirkungen entstehen.

## 🎨 User Interface Konzepte

### Time Control Panel

Ein zentrales Kontrollelement für die Zeitsimulation:

- Play/Pause/Stop Kontrollen
- Geschwindigkeitsregler (1x bis 1000x)
- Schnellzugriff für häufige Zeitsprünge (1 Stunde, 1 Tag, 1 Woche)
- Simulations-Einstellungen (Detailgrad, Fokus, Zufälligkeit)
- Vorschau kommender Events

### Timeline Viewer

Chronologische Darstellung aller Ereignisse:

- Farbcodierung nach Event-Typ
- Filteroptionen nach Charakter, Ort, Event-Typ
- Zoom-Funktion für verschiedene Zeitskalen
- Verbindungslinien zeigen Kausalitäten
- Hover für Details, Klick für vollständige Ansicht

### Character Day Summary

Übersicht über den Tag eines Charakters:

- Besuchte Orte mit Verweildauer
- Alle Interaktionen mit anderen Charakteren
- Emotionaler Verlauf als Graph
- Wichtigste Ereignisse hervorgehoben
- Gedanken und Pläne des Charakters
- Option, Details in Story zu übernehmen

### World State Dashboard

Globale Übersicht über Weltveränderungen:

- Große Ereignisse der Simulationsperiode
- Statistiken (Wirtschaft, Politik, Stimmung)
- Beziehungsveränderungen
- Machtverschiebungen
- Unerwartete Wendungen
- Warnungen bei Inkonsistenzen

## 🚀 Implementierungs-Empfehlung

### Hybrid-Ansatz

Die beste Lösung kombiniert mehrere Ansätze:

1. **Event-Driven als Basis**: Für klare Struktur und Nachvollziehbarkeit
2. **Agent-Based für Charaktere**: Für realistische individuelle Entscheidungen
3. **Narrative Graph für Highlights**: Um interessante Story-Momente zu garantieren
4. **Probability für Variation**: Um Überraschungen und Realismus einzubauen

### Phasenweise Einführung

**Phase 1 - Grundlagen (MVP)**:

- Einfache Event-Driven Simulation
- Basis-Tagesroutinen
- Simple Kollisionserkennung
- Grundlegende UI

**Phase 2 - Intelligenz**:

- Agent-Systeme für Hauptcharaktere
- Bedürfnisse und Ziele
- Emotionale Reaktionen
- Verbesserte Interaktionen

**Phase 3 - Narrative Qualität**:

- Story-Beat Erkennung
- Dramaturgische Optimierung
- Thematische Kohärenz
- Genrespezifische Anpassungen

**Phase 4 - Komplexität**:

- Ripple Effects
- Butterfly-Effekt Tracking
- Wirtschaftssimulation
- Politische Dynamiken

## 💡 Innovative Features

### Temporal Anchors

Bestimmte Ereignisse sind "verankert" und müssen zu bestimmten Zeiten eintreten. Das System arbeitet rückwärts und vorwärts, um sicherzustellen, dass diese Ankerpunkte erreicht werden, während der Weg dorthin organisch bleibt.

### Quantum Branching

Das System kann mehrere mögliche Zukünfte parallel simulieren und dem Autor zeigen, welche verschiedenen Entwicklungen möglich sind. Besonders nützlich für "Was wäre wenn"-Szenarien.

### Retroactive Continuity

Änderungen in der Vergangenheit können durchgespielt werden, um zu sehen, wie sie die Gegenwart beeinflussen würden. Das System berechnet neu ab dem Änderungspunkt und zeigt die Unterschiede.

### Memory Persistence

Charaktere erinnern sich an vergangene Ereignisse und diese beeinflussen ihr zukünftiges Verhalten. Ein Charakter, der betrogen wurde, wird misstrauischer. Jemand, der Hilfe erfahren hat, wird dankbar sein.

## 📊 Qualitätsmetriken

### Konsistenz-Metriken

- Charakterkonsistenz: Verhalten sich Charaktere ihrer Persönlichkeit entsprechend?
- Weltkonsistenz: Bleiben physikalische und soziale Regeln erhalten?
- Timeline-Konsistenz: Gibt es zeitliche Widersprüche?

### Interessantheits-Metriken

- Event-Vielfalt: Wie abwechslungsreich sind die Ereignisse?
- Überraschungsindex: Wie oft passiert Unerwartetes?
- Narrative Spannung: Gibt es Höhen und Tiefen?

### Realismus-Metriken

- Plausibilität: Sind die Ereignisse glaubwürdig?
- Bedürfniserfüllung: Werden Grundbedürfnisse realistisch befriedigt?
- Soziale Dynamik: Sind Interaktionen natürlich?

## Fazit

Das Time Simulation System verwandelt statische Welten in lebendige Ökosysteme. Durch die intelligente Kombination verschiedener Simulationsansätze entsteht ein System, das sowohl realistische als auch narrativ interessante Ergebnisse liefert. Autoren erhalten ein mächtiges Werkzeug, um ihre Welten mit Leben zu füllen und neue Geschichten zu entdecken, die organisch aus der Interaktion ihrer Charaktere entstehen.

Die wahre Magie liegt in der Balance: Genug Struktur für Konsistenz, genug Freiheit für Überraschungen, genug Intelligenz für Realismus und genug narrative Führung für packende Geschichten.
