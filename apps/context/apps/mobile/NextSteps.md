# BaseText - Nächste Schritte

## ⚠️ WICHTIG: RevenueCat-Integration für Produktion vorbereiten

Für die Produktion müssen folgende Änderungen an der RevenueCat-Integration vorgenommen werden:

1. **API-Key aus Umgebungsvariablen laden**
   - Aktuell ist der API-Key direkt im Code gesetzt, was für die Entwicklung funktioniert
   - Für die Produktion muss der Code in `services/revenueCatService.ts` geändert werden:

   ```typescript
   // Ändern von:
   const REVENUECAT_API_KEY_IOS = 'appl_kRiosNzSxUFTkqPhQEFMVyFWtPM';

   // Zurück zu:
   const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
   ```

2. **Log-Level reduzieren**
   - Debug-Logging für die Produktion deaktivieren:

   ```typescript
   // Ändern von:
   Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

   // Zu:
   Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
   ```

3. **Testkäufe durchführen**
   - Vor dem Release alle In-App-Käufe (Abonnements und Einmalkäufe) in der Sandbox-Umgebung testen
   - Überprüfen, ob Credits korrekt gutgeschrieben werden
   - Sicherstellen, dass Transaktionen in der Datenbank protokolliert werden

---

Nachdem wir erfolgreich die Authentifizierung mit Supabase implementiert haben, können wir mit der Entwicklung der Kernfunktionalitäten der BaseText-App fortfahren. Dieser Fahrplan beschreibt die empfohlenen nächsten Schritte in der Reihenfolge ihrer Priorität.

## 1. Datenbank-Setup vervollständigen

### 1.1 Tabellen erstellen

- Erstellen der fehlenden Tabellen in Supabase gemäß dem Datenbankschema:
  - `users` (teilweise durch Auth bereits vorhanden)
  - `spaces`
  - `space_members`
  - `documents`
  - `document_space`

### 1.2 Row Level Security (RLS) implementieren

- Sicherheitsrichtlinien für jede Tabelle definieren
- Berechtigungskonzept umsetzen (Besitzer, Editoren, Betrachter)
- Sicherstellen, dass Benutzer nur auf ihre eigenen Daten und die für sie freigegebenen Spaces zugreifen können

### 1.3 Indizes und Constraints

- Primärschlüssel und Fremdschlüsselbeziehungen definieren
- Indizes für häufig abgefragte Felder erstellen
- Unique-Constraints für E-Mail-Adressen und andere eindeutige Werte

## 2. Space-Verwaltung implementieren

### 2.1 Space-Service erstellen

- Funktionen zum Abrufen, Erstellen, Aktualisieren und Löschen von Spaces
- Integration mit Supabase-Client

### 2.2 Space-Übersichtsseite

- Liste aller Spaces, auf die der Benutzer Zugriff hat
- Filterfunktionen (nach Name, Erstellungsdatum, etc.)
- Sortieroptionen

### 2.3 Space-Detailseite

- Anzeige aller Informationen zu einem Space
- Liste der enthaltenen Dokumente
- Verwaltung von Space-Mitgliedern

### 2.4 Space-Erstellungs- und Bearbeitungsformular

- Formular zum Erstellen neuer Spaces
- Formular zum Bearbeiten bestehender Spaces
- Validierung der Eingaben

### 2.5 Mitgliederverwaltung

- Einladen neuer Mitglieder per E-Mail
- Rollenverwaltung (Besitzer, Editor, Betrachter)
- Entfernen von Mitgliedern

## 3. Dokumentenverwaltung implementieren

### 3.1 Dokument-Service erstellen

- Funktionen zum Abrufen, Erstellen, Aktualisieren und Löschen von Dokumenten
- Integration mit Supabase-Client

### 3.2 Dokument-Übersichtsseite

- Liste aller Dokumente, auf die der Benutzer Zugriff hat
- Filterfunktionen (nach Typ, Erstellungsdatum, etc.)
- Sortieroptionen

### 3.3 Dokument-Detailseite

- Anzeige aller Informationen zu einem Dokument
- Texteditor für den Inhalt
- Metadaten-Verwaltung

### 3.4 Dokument-Erstellungs- und Bearbeitungsformular

- Formular zum Erstellen neuer Dokumente
- Formular zum Bearbeiten bestehender Dokumente
- Validierung der Eingaben

### 3.5 Dokumentimport

- Import von Dokumenten aus verschiedenen Quellen (Dateien, URLs, etc.)
- Unterstützung verschiedener Formate (Text, Markdown, etc.)

## 4. KI-Integration

### 4.1 KI-Service erstellen

- Integration mit KI-APIs (OpenAI, etc.)
- Funktionen für Textanalyse und -generierung

### 4.2 Analyse-Funktionalität

- Benutzeroberfläche für die Konfiguration von Analysen
- Durchführung von Analysen auf ausgewählten Dokumenten
- Speicherung der Analyseergebnisse als neue Dokumente

### 4.3 Generierungs-Funktionalität

- Benutzeroberfläche für die Konfiguration von Textgenerierungen
- Durchführung von Textgenerierungen basierend auf ausgewählten Dokumenten
- Speicherung der generierten Texte als neue Dokumente

## 5. Benutzeroberfläche und Benutzererfahrung verbessern

### 5.1 Responsive Design

- Sicherstellen, dass die App auf verschiedenen Geräten gut funktioniert
- Optimierung für verschiedene Bildschirmgrößen

### 5.2 Dunkelmodus

- Implementierung eines Dunkelmodus
- Anpassung aller UI-Komponenten

### 5.3 Mention-Funktionalität verbessern

- **MENTION VERBESSERN: VORSCHAU ENTFERNEN, direkt nach @ Zeichen etwas anzeigen**
  - Sofortige Anzeige von Vorschlägen direkt nach der Eingabe des @-Zeichens oder [[-Sequenz
  - Entfernung der separaten Vorschau-Komponente zugunsten einer direkten Inline-Anzeige
- Behebung des Fokus-Problems im MentionTextInput
  - Aktuell verliert das Eingabefeld nach dem Einfügen einer Mention den Fokus und der Cursor wird ans Ende des Textes gesetzt
  - Eine verbesserte Implementierung könnte eine spezialisierte Web-Textarea oder eine Drittanbieter-Bibliothek für Rich-Text-Editing verwenden, die bessere Cursor-Kontrolle bietet
- Optimierung der Dropdown-Positionierung

### 5.3 Benachrichtigungen

- Benachrichtigungen für wichtige Ereignisse (neue Einladungen, Änderungen an Dokumenten, etc.)
- Push-Benachrichtigungen für mobile Geräte

### 5.4 Offline-Unterstützung

- Lokale Speicherung von Daten für Offline-Zugriff
- Synchronisierung bei Wiederherstellung der Verbindung

## 6. Erweiterte Funktionen

### 6.1 Versionierung

- Implementierung der Dokumentversionierung
- Anzeige der Versionshistorie
- Wiederherstellung früherer Versionen

### 6.2 Suche

- Volltext-Suche über alle Dokumente
- Filteroptionen für die Suche
- Hervorhebung von Suchergebnissen

### 6.3 Tagging

- System zum Hinzufügen von Tags zu Dokumenten
- Filterung und Suche nach Tags

### 6.4 Kollaboration

- Echtzeit-Kollaboration an Dokumenten
- Kommentarfunktion
- Änderungsverfolgung

### 6.5 Export/Import

- Export von Dokumenten in verschiedene Formate
- Bulk-Import von Dokumenten

## 7. Tests und Qualitätssicherung

### 7.1 Unit-Tests

- Tests für alle wichtigen Funktionen und Komponenten
- Automatisierte Testläufe

### 7.2 Integration-Tests

- Tests für die Integration verschiedener Komponenten
- Tests für die Integration mit Supabase

### 7.3 End-to-End-Tests

- Tests für vollständige Benutzerworkflows
- Automatisierte UI-Tests

### 7.4 Performance-Optimierung

- Identifizierung und Behebung von Performance-Problemen
- Optimierung der Ladezeiten

## 6. Erweiterte Funktionen implementieren

### 6.1 Verschiedene Eingabequellen integrieren

- YouTube-Video-Transkriptionen importieren
- PDF-Dokumente importieren und analysieren
- Integration mit externen Diensten (Google Drive, Notion, etc.)

### 6.2 Verschiedene Exportformate anbieten

- Export als PDF mit anpassbarem Layout
- Export als DOCX (Microsoft Word)
- Export als Rich-Text-Format für die Weiterverarbeitung

### 6.3 Erweiterte Suchfunktionen

- Implementierung einer Vektordatenbank für semantische Suche
- Ähnlichkeitssuche für Dokumente und Textabschnitte
- Filterung nach verschiedenen Kriterien (Datum, Autor, Tags, etc.)

### 6.4 Veröffentlichung von Dokumenten

- Öffentliche Freigabe von Dokumenten über einen Link
- Einbetten von Dokumenten in externe Websites
- Berechtigungssystem für öffentliche Dokumente

## 7. Deployment und Veröffentlichung

### 8.1 Vorbereitung für Produktion

- Konfiguration für Produktionsumgebung
- Optimierung von Assets

### 8.2 App Store-Veröffentlichung

- Vorbereitung für iOS App Store
- Vorbereitung für Google Play Store

### 8.3 Monitoring und Logging

- Implementierung von Fehlerüberwachung
- Sammlung von Nutzungsstatistiken

### 8.4 Kontinuierliche Integration und Deployment

- Automatisierung des Build- und Deployment-Prozesses
- Automatisierte Tests vor dem Deployment

## Empfohlene unmittelbare nächste Schritte

1. **Datenbank-Setup**: Erstellen Sie die SQL-Skripte für die Tabellen und RLS-Richtlinien und führen Sie sie in Supabase aus.
2. **Space-Service**: Implementieren Sie den grundlegenden Service zum Verwalten von Spaces.
3. **Space-Übersichtsseite**: Aktualisieren Sie die bestehende Space-Seite, um echte Daten aus Supabase anzuzeigen.
4. **Space-Erstellungsformular**: Implementieren Sie ein Formular zum Erstellen neuer Spaces.
5. **Dokument-Service**: Implementieren Sie den grundlegenden Service zum Verwalten von Dokumenten.

Diese ersten Schritte werden eine solide Grundlage für die weitere Entwicklung der BaseText-App schaffen und es ermöglichen, schnell einen funktionalen Prototyp zu erstellen, der die Kernfunktionalitäten demonstriert.
