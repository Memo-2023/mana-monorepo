---
title: DSGVO-Konformität bei Mana
description: Umfassende Informationen zur Einhaltung der Datenschutz-Grundverordnung (DSGVO) bei allen Mana-Services
category: compliance
lastUpdated: 2024-01-15
order: 1
featured: true
tags: ['DSGVO', 'GDPR', 'Compliance', 'Datenschutz', 'EU-Recht']
---

## Unser Bekenntnis zum Datenschutz

Bei Mana ist DSGVO-Konformität kein nachträglicher Gedanke, sondern fundamentaler Bestandteil unserer Plattform-Architektur. Wir haben unser System von Grund auf so konzipiert, dass es die höchsten Datenschutzstandards erfüllt und übertrifft.

## Grundprinzipien der DSGVO-Umsetzung

### 1. Rechtmäßigkeit, Fairness und Transparenz

**Unsere Maßnahmen:**

- Klare und verständliche Datenschutzerklärung
- Explizite Einwilligungen für alle Datenverarbeitungen
- Transparente Information über Datennutzung
- Keine versteckten Datensammlungen

**Konkrete Umsetzung:**

- Pop-up-freie Cookie-Nutzung (nur technisch notwendige Cookies)
- Opt-in für alle optionalen Features
- Detaillierte Protokollierung aller Datenverarbeitungen

### 2. Zweckbindung

**Strikte Zweckbindung bei Mana:**

- Nutzerdaten werden ausschließlich für die Servicebereitstellung verwendet
- Keine Weitergabe an Dritte zu Werbezwecken
- Keine Profilbildung für Marketing
- KI-Eingaben werden NICHT für Modelltraining verwendet

**Dokumentierte Zwecke:**

1. Bereitstellung der Mana-Credit-Funktionalität
2. Abrechnung und Buchhaltung
3. Technischer Support
4. Gesetzliche Aufbewahrungspflichten

### 3. Datenminimierung

**Minimale Datenerfassung:**

- Bei Registrierung: Nur E-Mail-Adresse erforderlich
- Optionale Angaben klar gekennzeichnet
- Keine unnötigen Pflichtfelder
- Automatische Datenlöschung nach Zweckerfüllung

**Praktische Beispiele:**

- Memoro: Audio-Dateien werden nach Transkription automatisch gelöscht (außer auf Nutzerwunsch)
- KI-Anfragen: Keine dauerhafte Speicherung von Prompts
- Analytics: Nur anonymisierte, aggregierte Daten

### 4. Richtigkeit der Daten

**Nutzer-Kontrolle:**

- Selbstverwaltung aller persönlichen Daten im Dashboard
- Sofortige Aktualisierungsmöglichkeiten
- API für Datenexport und -import
- Benachrichtigungen bei Datenänderungen

### 5. Speicherbegrenzung

**Automatische Löschkonzepte:**

- Inaktive Accounts: Erinnerung nach 12 Monaten, Löschung nach 18 Monaten
- Transaktionsdaten: 10 Jahre (gesetzliche Aufbewahrungsfrist)
- Support-Tickets: 2 Jahre nach Abschluss
- KI-Interaktionen: Sofortige Löschung nach Verarbeitung

### 6. Integrität und Vertraulichkeit

**Technische Sicherheitsmaßnahmen:**

- Ende-zu-Ende-Verschlüsselung für sensible Daten
- TLS 1.3 für alle Verbindungen
- Verschlüsselte Datenspeicherung (AES-256)
- Multi-Faktor-Authentifizierung verfügbar
- Regelmäßige Sicherheitsaudits

## Betroffenenrechte - Vollständig umgesetzt

### Auskunftsrecht (Art. 15 DSGVO)

**Self-Service im Dashboard:**

- Download aller persönlichen Daten mit einem Klick
- Maschinenlesbares Format (JSON/CSV)
- Vollständige Transaktionshistorie
- Übersicht aller Datenverarbeitungen

**Prozess:**

1. Login ins Dashboard
2. Datenschutz-Bereich aufrufen
3. "Datenauskunft anfordern" klicken
4. Sofortiger Download oder E-Mail-Versand

### Recht auf Berichtigung (Art. 16 DSGVO)

**Direkte Bearbeitung:**

- Alle Profildaten selbst editierbar
- Änderungshistorie einsehbar
- Sofortige Synchronisation über alle Services
- Validierung zur Vermeidung von Fehlern

### Recht auf Löschung (Art. 17 DSGVO)

**Löschoptionen:**

- Einzelne Daten gezielt löschen
- Komplette Account-Löschung
- Automatische Löschung nach Inaktivität
- Ausnahmen nur bei gesetzlichen Aufbewahrungspflichten

**Was wird gelöscht:**

- Persönliche Daten
- Nutzungsdaten
- Gespeicherte Inhalte
- Backup-Daten (innerhalb von 30 Tagen)

### Recht auf Datenübertragbarkeit (Art. 20 DSGVO)

**Export-Funktionen:**

- Standardformate: JSON, CSV, XML
- Strukturierte Daten mit Dokumentation
- API für automatisierten Export
- Direkte Übertragung zu anderen Diensten möglich

### Widerspruchsrecht (Art. 21 DSGVO)

**Granulare Kontrolle:**

- Widerspruch gegen einzelne Verarbeitungen
- Opt-out für Analytics
- Newsletter-Abmeldung mit einem Klick
- Keine Nachteile bei Widerspruch

## Technische und organisatorische Maßnahmen (TOMs)

### Zutrittskontrolle

- Serverstandorte mit 24/7 Sicherheitspersonal
- Biometrische Zugangskontrollen
- Videoüberwachung der Rechenzentren

### Zugangskontrolle

- Starke Passwort-Richtlinien
- Multi-Faktor-Authentifizierung
- Automatische Session-Timeouts
- IP-Whitelisting für Admin-Zugriffe

### Zugriffskontrolle

- Role-Based Access Control (RBAC)
- Principle of Least Privilege
- Regelmäßige Berechtigungsreviews
- Audit-Logs aller Zugriffe

### Weitergabekontrolle

- Verschlüsselte Datenübertragung
- VPN für Mitarbeiterzugriffe
- Data Loss Prevention (DLP) Systeme
- Vertraulichkeitsvereinbarungen

### Eingabekontrolle

- Vollständige Audit-Trails
- Unveränderbare Logs
- Vier-Augen-Prinzip bei kritischen Änderungen
- Versionskontrolle

### Auftragskontrolle

- Sorgfältige Auswahl von Subunternehmern
- Auftragsverarbeitungsverträge (AVV)
- Regelmäßige Audits der Partner
- Keine Datenweitergabe ohne Ihre Zustimmung

### Verfügbarkeitskontrolle

- Redundante Systeme
- Tägliche Backups
- Disaster Recovery Plan
- 99.9% Uptime-Garantie

### Trennungskontrolle

- Mandantenfähige Architektur
- Logische Datentrennung
- Separate Verschlüsselungsschlüssel
- Isolierte Verarbeitungsumgebungen

## Datenschutz-Folgenabschätzung (DSFA)

Für alle neuen Features führen wir DSFAs durch:

### Bewertete Risikobereiche:

1. **Memoro Audio-Verarbeitung**: Minimales Risiko durch sofortige Löschung
2. **KI-Tool-Integration**: Vertragsgestaltung ohne Trainingsrechte
3. **Team-Features**: Strikte Rechteverwaltung
4. **Payment-Integration**: PCI-DSS-konforme Partner

### Risikominimierung:

- Privacy by Design in der Entwicklung
- Datenschutz-Schulungen für alle Mitarbeiter
- Regelmäßige Sicherheitsreviews
- Penetrationstests

## Internationale Datenübermittlung

### EU-US Datentransfers

- Nutzung von Standardvertragsklauseln (SCCs)
- Zusätzliche technische Schutzmaßnahmen
- Verschlüsselung vor Übertragung
- Rechtliche Absicherungen

### Drittländer

- Angemessenheitsbeschlüsse beachten
- Binding Corporate Rules (BCRs) wo möglich
- Individuelle Risikoanalysen
- Transparente Information der Nutzer

## Auftragsverarbeiter und Subunternehmer

### Aktuelle Partner (Stand: Januar 2024):

1. **Hosting**: AWS Frankfurt (EU)
2. **Payment**: Stripe (EU-Entity)
3. **E-Mail**: Eigenentwicklung (keine Drittanbieter)
4. **KI-Anbieter**: Siehe separate Dokumentation

### Auswahlkriterien:

- DSGVO-Zertifizierung
- EU-Standorte bevorzugt
- Technische Sicherheitsstandards
- Vertragliche Absicherungen

## Zertifizierungen und Audits

### Aktuelle Zertifizierungen:

- ISO 27001 (in Vorbereitung)
- SOC 2 Type II (geplant Q2 2024)
- Trusted Cloud Datenschutzprofil (TCDP)

### Regelmäßige Überprüfungen:

- Jährliche externe Datenschutz-Audits
- Quartalsweise interne Reviews
- Monatliche Sicherheitsscans
- Kontinuierliche Compliance-Überwachung

## Datenschutzbeauftragter

**Interner Datenschutzbeauftragter:**
[Name]
datenschutz@mana.ai
+49 [Telefonnummer]

**Erreichbarkeit:**

- Direkter Kontakt über Dashboard
- Monatliche Sprechstunden
- Datenschutz-Hotline für dringende Fälle

## Incident Response

### 72-Stunden-Meldepflicht

- Automatisierte Erkennung von Datenschutzverletzungen
- Sofortige interne Eskalation
- Meldung an Aufsichtsbehörde innerhalb von 72 Stunden
- Information betroffener Nutzer ohne Verzögerung

### Incident Response Team:

- 24/7 Bereitschaft
- Definierte Eskalationswege
- Regelmäßige Übungen
- Dokumentierte Prozesse

## Transparenzbericht

### Jährliche Veröffentlichung:

- Anzahl der Auskunftsersuchen
- Behördliche Anfragen
- Datenschutzverletzungen (anonymisiert)
- Verbesserungsmaßnahmen

### Aktuelle Statistiken (2023):

- Auskunftsersuchen bearbeitet: 127
- Durchschnittliche Bearbeitungszeit: 48 Stunden
- Löschanfragen: 89
- Datenschutzverletzungen: 0

## Kontinuierliche Verbesserung

### Unser Datenschutz-Versprechen:

1. Regelmäßige Überprüfung aller Prozesse
2. Proaktive Anpassung an neue Rechtsprechung
3. Investition in Datenschutz-Technologien
4. Offene Kommunikation mit Nutzern

### Geplante Verbesserungen 2024:

- Erweiterte Verschlüsselungsoptionen
- Noch granularere Datenkontrolle
- KI-basierte Datenschutz-Assistenz
- Blockchain-Audit-Trail

## Kontakt und Beschwerden

### Bei Datenschutz-Anliegen:

**Primärer Kontakt:**
datenschutz@mana.ai

**Eskalation:**
Geschäftsführung Mana Systems GmbH

**Aufsichtsbehörde:**
[Zuständige Landesdatenschutzbehörde]
[Adresse]
[Kontaktdaten]

---

_Dieses Dokument wird regelmäßig aktualisiert. Letzte Überprüfung: Januar 2024_
