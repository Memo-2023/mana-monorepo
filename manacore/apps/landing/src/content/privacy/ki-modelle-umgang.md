---
title: Umgang mit KI-Modellen bei Mana
description: Transparenz und Sicherheit beim Einsatz von KI-Modellen - Ihre Daten bleiben geschützt
category: ai-ethics
lastUpdated: 2024-01-15
order: 2
featured: true
tags: ["KI-Modelle", "Datenschutz", "Transparenz", "Ethik", "Sicherheit"]
---

## Unser Versprechen: Ihre Daten gehören Ihnen

Bei Mana verstehen wir die Bedenken bezüglich KI und Datenschutz. Deshalb haben wir klare Prinzipien etabliert, die sicherstellen, dass Ihre Daten niemals für das Training von KI-Modellen verwendet werden.

## Grundprinzipien im Umgang mit KI

### 1. Kein Training mit Nutzerdaten

**Unsere eiserne Regel:**
- Ihre Eingaben werden NIEMALS für das Training von KI-Modellen verwendet
- Wir haben vertragliche Vereinbarungen mit allen KI-Anbietern
- Opt-out ist bei uns Standard, nicht die Ausnahme
- Ihre kreativen Arbeiten bleiben Ihr geistiges Eigentum

**Technische Umsetzung:**
- API-Aufrufe mit explizitem "No-Training"-Flag
- Verschlüsselte Übertragung ohne Zwischenspeicherung
- Sofortige Löschung nach Verarbeitung
- Keine Protokollierung von Inhalten

### 2. Transparenz über verwendete Modelle

**Aktuelle KI-Partner (Stand: Januar 2024):**

| Anbieter | Modelle | Verwendungszweck | Datenschutz-Status |
|----------|---------|------------------|-------------------|
| OpenAI | GPT-4, GPT-3.5, DALL-E 3 | Text & Bildgenerierung | Enterprise Agreement ohne Training |
| Anthropic | Claude 3, Claude 2 | Textverarbeitung | Privacy-First Policy |
| Stability AI | Stable Diffusion | Bildgenerierung | Lokale Verarbeitung möglich |
| Midjourney | v6, v5 | Kreative Bildgestaltung | Kommerzielle Lizenz |
| Cohere | Command, Embed | Textanalyse | EU-Server verfügbar |
| Mistral AI | Mistral Large | Mehrsprachige Aufgaben | Französisches Datenschutzrecht |

### 3. Auswahl der KI-Modelle

**Unsere Auswahlkriterien:**
1. **Datenschutz-Garantien**: Nur Partner mit No-Training-Optionen
2. **Ethische Standards**: Verantwortungsvolle KI-Entwicklung
3. **Transparenz**: Offenlegung der Trainingsmethoden
4. **Compliance**: DSGVO-konforme Verarbeitung
5. **Qualität**: Beste Ergebnisse für unsere Nutzer

## Technische Schutzmaßnahmen

### API-Sicherheit

**Verschlüsselte Kommunikation:**
```
Client → [TLS 1.3] → Mana-Server → [TLS 1.3] → KI-Provider
```

**Unsere Sicherheitsarchitektur:**
- Ende-zu-Ende-Verschlüsselung
- Keine Klartext-Speicherung
- Token-basierte Authentifizierung
- Rate-Limiting zum Schutz vor Missbrauch

### Datenminimierung

**Was wir NICHT speichern:**
- Ihre Prompts und Eingaben
- Generierte Inhalte (außer auf Ihren Wunsch)
- Persönliche Präferenzen
- Konversationsverläufe

**Was wir speichern (anonymisiert):**
- Anzahl der API-Aufrufe
- Verwendete Credits
- Fehlerstatistiken
- Performance-Metriken

### Isolierte Verarbeitung

**Jede Anfrage ist unabhängig:**
- Keine Session-übergreifende Datenhaltung
- Keine Nutzerprofile für KI-Anpassungen
- Keine Verknüpfung zwischen Anfragen
- Frische Instanz bei jeder Nutzung

## Kontrolle und Transparenz

### Echtzeit-Monitoring

**Was Sie im Dashboard sehen:**
- Welches Modell verwendet wurde
- Exakte Credit-Kosten
- Zeitstempel der Nutzung
- Status der Verarbeitung

**Export-Funktionen:**
- Download Ihrer Nutzungshistorie
- Detaillierte Abrechnungsdaten
- API-Logs (ohne Inhalte)
- Compliance-Berichte

### Modell-Auswahl

**Sie haben die Wahl:**
- Präferenz für bestimmte Anbieter setzen
- Modelle ausschließen
- Eigene API-Keys verwenden
- Lokale Modelle anbinden (geplant)

## Ethische KI-Nutzung

### Verantwortungsvolle Inhaltsfilterung

**Automatische Sicherheitschecks:**
- Keine illegalen Inhalte
- Schutz vor Missbrauch
- Altersgerechte Filterung
- Respekt vor Urheberrechten

**Transparente Ablehnung:**
- Klare Kommunikation bei Filterung
- Keine heimliche Zensur
- Einspruchsmöglichkeiten
- Alternative Formulierungen

### Bias-Minimierung

**Unsere Maßnahmen:**
- Diverse Modellauswahl
- Regelmäßige Qualitätschecks
- Nutzer-Feedback-System
- Kontinuierliche Verbesserung

## Spezielle Anwendungsfälle

### Memoro - Audiotranskription

**Datenschutz bei Sprachaufnahmen:**
- Lokale Vorverarbeitung möglich
- Verschlüsselte Übertragung
- Sofortige Löschung der Audiodaten
- Nur Text wird gespeichert (optional)

**Ihre Kontrolle:**
- Löschung jederzeit möglich
- Export in verschiedenen Formaten
- Keine Stimmprofile
- Keine biometrische Erfassung

### Team-Nutzung

**Datentrennung im Team:**
- Individuelle Verschlüsselung
- Keine gemeinsamen KI-Profile
- Getrennte Abrechnungen
- Rollenbasierte Zugriffe

### Sensible Branchen

**Besondere Schutzmaßnahmen für:**
- **Gesundheitswesen**: HIPAA-konforme Verarbeitung
- **Rechtsberatung**: Anwaltliche Schweigepflicht
- **Finanzsektor**: Verschärfte Sicherheitsprotokolle
- **Bildung**: Jugendschutz-konform

## Zukunftssichere KI-Integration

### Geplante Features

**Q1-Q2 2024:**
- On-Premise Deployment für Unternehmen
- Bring-Your-Own-Model (BYOM)
- Föderiertes Lernen ohne Datenaustausch
- Zero-Knowledge-Architektur

**Langfristige Vision:**
- 100% lokale Verarbeitung optional
- Open-Source-Modelle Integration
- Blockchain-basierte Nutzungsnachweise
- Dezentralisierte KI-Infrastruktur

### Forschung und Entwicklung

**Unsere Investitionen:**
- Privacy-Preserving ML-Techniken
- Homomorphe Verschlüsselung
- Differential Privacy
- Secure Multi-Party Computation

## Häufige Fragen (FAQ)

### Kann OpenAI meine Daten sehen?

**Kurze Antwort: Ja, aber...**
- Nur verschlüsselt während der Verarbeitung
- Keine Speicherung bei OpenAI
- Keine Verwendung für Training
- Vertragliche Absicherung

### Was passiert mit kreativen Werken?

**Ihre Rechte bleiben erhalten:**
- Sie behalten alle Urheberrechte
- Keine Lizenzübertragung an Mana
- Keine Weitergabe an KI-Anbieter
- Kommerzielle Nutzung erlaubt

### Wie sicher sind meine Geschäftsgeheimnisse?

**Maximaler Schutz durch:**
- Enterprise-Agreements
- NDAs mit allen Partnern
- Verschlüsselung
- Optionale On-Premise-Lösung

## Audit und Zertifizierung

### Externe Überprüfungen

**Regelmäßige Audits durch:**
- TÜV Rheinland (Datenschutz)
- BSI (IT-Sicherheit)
- Unabhängige Ethik-Kommission
- Nutzer-Beirat

### Transparenzberichte

**Vierteljährliche Veröffentlichung:**
- Anzahl der KI-Anfragen
- Genutzte Modelle (aggregiert)
- Sicherheitsvorfälle (falls vorhanden)
- Verbesserungsmaßnahmen

## Ihre Rechte und Optionen

### Opt-Out-Möglichkeiten

**Granulare Kontrolle:**
- Einzelne Modelle deaktivieren
- Anbieter ausschließen
- Funktionen einschränken
- Vollständige Deaktivierung

### Datenportabilität

**Export Ihrer KI-Interaktionen:**
- Strukturierte Formate (JSON, CSV)
- Maschinenlesbare Dokumentation
- API für automatisierten Export
- Migration zu anderen Diensten

## Kontakt bei KI-Fragen

### Spezialisiertes KI-Ethik-Team

**Für Ihre Anliegen:**
- ki-ethik@mana.ai
- Monatliche Sprechstunden
- Community-Forum
- Direkter Draht zur Geschäftsführung

### Melden von Bedenken

**Wir nehmen Feedback ernst:**
- Anonyme Meldungen möglich
- Garantierte Bearbeitungszeit: 48h
- Transparente Nachverfolgung
- Öffentliche Stellungnahmen

## Verpflichtung zur kontinuierlichen Verbesserung

Bei Mana ist der verantwortungsvolle Umgang mit KI kein statisches Konzept. Wir verpflichten uns zu:

1. **Ständiger Weiterbildung** unseres Teams
2. **Proaktiver Anpassung** an neue Entwicklungen
3. **Offenem Dialog** mit der Community
4. **Transparenter Kommunikation** bei Änderungen
5. **Ethik vor Profit** in allen Entscheidungen

---

*Dieses Dokument wird monatlich überprüft und aktualisiert. Letzte Revision: Januar 2024*

*Für technische Details und API-Dokumentation besuchen Sie unsere [Entwickler-Dokumentation](/docs)*