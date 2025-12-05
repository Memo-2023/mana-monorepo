# BaseText - Dokumentation

## Übersicht

BaseText ist eine React Native App zur Speicherung, Organisation, Analyse und KI-gestützten Verarbeitung von Textdokumenten. Die Plattform ermöglicht es Benutzern, Texte in "Spaces" zu organisieren, Beziehungen zwischen Dokumenten herzustellen und mithilfe von KI-Modellen Analysen und neue Texte zu generieren.

## Technologie-Stack

- **Frontend**: React Native mit Expo Router
- **Styling**: NativeWind (TailwindCSS für React Native)
- **Backend**: Supabase mit PostgreSQL
- **Authentifizierung**: Supabase Auth
- **KI-Integration**: Offen für verschiedene KI-Modelle

## Projektstruktur

Die App ist in folgende Hauptverzeichnisse strukturiert:

- `/app`: Enthält die Hauptseiten der Anwendung (Expo Router)
- `/components`: Wiederverwendbare UI-Komponenten
- `/assets`: Bilder und andere statische Ressourcen
- `/utils`: Hilfsfunktionen und Dienstprogramme

### Komponenten-Kategorien

Die Komponenten sind in verschiedene Kategorien eingeteilt:

1. **UI-Basiskomponenten** (`/components/ui/`)
   - Text, Input, Card, Badge, Avatar, etc.
   - Grundlegende Bausteine für die Benutzeroberfläche

2. **Layout-Komponenten** (`/components/layout/`)
   - Screen, EmptyState
   - Strukturieren den Aufbau der Seiten

3. **Funktionale Komponenten** (`/components/functional/`)
   - SearchBar
   - Bieten spezifische Funktionalitäten

4. **Auth-Komponenten** (`/components/auth/`)
   - LoginForm
   - Zuständig für Authentifizierungsprozesse

5. **Space-Komponenten** (`/components/spaces/`)
   - SpaceCard
   - Darstellung und Verwaltung von Spaces

6. **Document-Komponenten** (`/components/documents/`)
   - DocumentCard
   - Darstellung und Verwaltung von Dokumenten

## Hauptkomponenten

### SpaceCard

Die `SpaceCard`-Komponente zeigt einen Space mit seinen wichtigsten Informationen an:

```tsx
type SpaceCardProps = {
  id: string;
  name: string;
  description?: string;
  documentCount?: number;
  tags?: string[];
  onPress?: () => void;
};
```

- Zeigt den Namen und die Beschreibung des Space an
- Zeigt die Anzahl der enthaltenen Dokumente an
- Zeigt bis zu 3 Tags an, mit einem "+X" Badge für weitere Tags
- Navigiert beim Klick zur detaillierten Space-Ansicht

### DocumentCard

Die `DocumentCard`-Komponente zeigt ein Dokument mit seinen wichtigsten Informationen an:

```tsx
type DocumentCardProps = {
  id: string;
  title: string;
  content?: string;
  type: 'text' | 'context' | 'prompt';
  createdBy?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  createdAt?: string;
  tags?: string[];
  onPress?: () => void;
};
```

- Zeigt den Titel und eine Vorschau des Inhalts an
- Kennzeichnet den Dokumenttyp (Text, Kontext, Prompt) mit einem Badge
- Zeigt Informationen zum Ersteller und Erstellungsdatum an
- Zeigt bis zu 2 Tags an, mit einem "+X" Badge für weitere Tags
- Navigiert beim Klick zur detaillierten Dokument-Ansicht

### UI-Komponenten

#### Text

Die `Text`-Komponente ist eine erweiterte Version der React Native Text-Komponente mit verschiedenen Varianten:

- `h1`, `h2`, `h3`: Überschriften
- `body`: Standardtext
- `caption`: Kleinerer Text für Beschriftungen

#### Card

Die `Card`-Komponente dient als Container für verschiedene Inhalte:

- Bietet ein einheitliches Erscheinungsbild für Inhaltsblöcke
- Unterstützt Touch-Interaktionen

#### Badge

Die `Badge`-Komponente zeigt Kennzeichnungen oder Tags an:

- Verschiedene Varianten: `default`, `primary`, `info`, etc.
- Kompakte Darstellung von Kategorien oder Status

## Navigation

Die App verwendet Expo Router für die Navigation:

- Tab-Navigation für die Hauptbereiche (Home, Spaces, Dokumente, Profil)
- Stack-Navigation für detaillierte Ansichten

## Datenmodell

Die App arbeitet mit folgenden Hauptentitäten:

### Benutzer

Benutzer der Anwendung:

- `id`: Eindeutige ID (referenziert auth.users.id)
- `email`: E-Mail-Adresse des Benutzers
- `name`: Name des Benutzers
- `created_at`: Erstellungszeitpunkt

### Spaces

Organisatorische Einheiten zur Gruppierung von Dokumenten:

- `id`: Eindeutige ID
- `name`: Name des Space
- `description`: Beschreibung
- `user_id`: Besitzer des Space
- `created_at`: Erstellungszeitpunkt
- `settings`: Konfigurationen (JSONB)

### Dokumente

Zentrale Entität für alle Arten von Textinhalten:

- `id`: Eindeutige ID
- `title`: Titel des Dokuments
- `content`: Textinhalt
- `type`: Dokumenttyp (original, analysis, generated)
- `space_id`: Space, zu dem das Dokument gehört
- `user_id`: Ersteller des Dokuments
- `created_at`: Erstellungszeitpunkt
- `updated_at`: Zeitpunkt der letzten Aktualisierung
- `metadata`: Flexible Metadaten (JSONB)

### Dokumenttypen

Die App unterscheidet zwischen verschiedenen Dokumenttypen:

1. **Text (`type = 'text'`)**: Importierte oder manuell erstellte Texte, die als Ausgangspunkt für KI-Generierungen dienen
2. **Kontext (`type = 'context'`)**: Textinhalte, die als Kontext für KI-Anfragen dienen und Referenzmaterial oder Hintergrundinformationen enthalten
3. **Prompt (`type = 'prompt'`)**: Spezielle Prompts für KI-Modelle, die als Vorlagen für wiederkehrende KI-Anfragen verwendet werden können

## Dokumentspeicherung

TextContext verwendet ein hybrides Speichersystem, das automatisches Speichern mit manuellen Speicheroptionen kombiniert:

### Automatisches Speichern

1. **Inaktivitäts-Speicherung**:
   - Dokumente werden automatisch nach 3 Sekunden Inaktivität gespeichert
   - Funktioniert sowohl für neue als auch für bestehende Dokumente
   - Verhindert Datenverlust bei unerwarteten Unterbrechungen

2. **Periodisches Backup**:
   - Lokale Backups werden alle 10 Sekunden erstellt
   - Ermöglicht die Wiederherstellung bei Verbindungsproblemen

3. **Speichern beim Verlassen**:
   - Dokumente werden automatisch gespeichert, wenn die Seite verlassen wird
   - Ein Bestätigungsdialog warnt vor dem Verlassen bei ungespeicherten Änderungen

4. **Direktes Auto-Save für neue Dokumente**:
   - Neue Dokumente werden nach 2 Sekunden Tippaktivität automatisch gespeichert
   - Sorgt für besonders schnelle Sicherung neuer Inhalte

### Sichtbare Indikatoren

- **Ungespeichert-Status**: Ein "Ungespeichert"-Indikator wird angezeigt, wenn Änderungen noch nicht gespeichert wurden
- **Toolbar-Buttons**: Alle Bearbeitungsoptionen sind durchgängig sichtbar, auch bei neuen Dokumenten
- **Konsole-Logs**: Detaillierte Logs zur Nachverfolgung des Speicherprozesses (nur für Entwickler)

### Leere Dokumente

- Leere Dokumente werden nicht automatisch gespeichert
- Erst wenn Inhalt eingegeben wurde, wird die Auto-Save-Funktionalität aktiviert

## Typische Workflows

### 1. Spaces verwalten

- Spaces erstellen, bearbeiten und löschen
- Dokumente in Spaces organisieren

### 2. Dokumente verwalten

- Dokumente erstellen, importieren und organisieren
- Dokumente in Spaces organisieren
- Metadaten hinzufügen (Autor, Tags, etc.)

### 3. Textanalyse

- Dokumente zur Analyse auswählen
- Analyse konfigurieren und durchführen
- Analyseergebnisse als neue Dokumente speichern

### 4. Textgenerierung

- Dokumente als Kontext auswählen
- Prompt für die Textgenerierung eingeben
- Generierte Texte als neue Dokumente speichern

## Erweiterungsmöglichkeiten

1. **Verbesserte Textanalyse**:
   - Integration weiterer KI-Modelle
   - Spezifische Analyse-Templates

2. **Visualisierungen**:
   - Beziehungen zwischen Dokumenten
   - Analyseergebnisse

3. **Export/Import**:
   - Verschiedene Formate
   - Bulk-Import

## Supabase-Integration

Die App verwendet einen zentralen Supabase-Service (`services/supabaseService.ts`), der alle Interaktionen mit der Datenbank verwaltet:

```typescript
// Beispiel für die Verwendung des Supabase-Service
import { getSpaces, createSpace, getDocuments } from '~/services/supabaseService';

// Spaces abrufen
const spaces = await getSpaces();

// Neuen Space erstellen
const { data, error } = await createSpace('Mein Space', 'Beschreibung', { tags: ['Wichtig'] });

// Dokumente in einem Space abrufen
const documents = await getDocuments(spaceId);
```

Dieser Service bietet eine einfache und einheitliche Schnittstelle zur Datenbank und abstrahiert die Komplexität der Supabase-API. Alle CRUD-Operationen für Benutzer, Spaces und Dokumente sind in diesem Service implementiert.

## KI-Integration

TextContext bietet umfangreiche KI-Funktionen zur Textgenerierung und -verarbeitung. Die Integration erfolgt über den zentralen AI-Service (`services/aiService.ts`), der verschiedene KI-Modelle unterstützt.

### Unterstützte KI-Modelle

- **Azure OpenAI**: GPT-4.1 und andere OpenAI-Modelle über Azure
- **Google Gemini**: Gemini Pro und andere Google-Modelle

### KI-Komponenten

#### AIAssistant

Die `AIAssistant`-Komponente bietet eine benutzerfreundliche Oberfläche für die Interaktion mit KI-Modellen:

```tsx
<AIAssistant
  visible={showAIAssistant}
  onClose={() => setShowAIAssistant(false)}
  onInsertText={handleInsertGeneratedText}
  documentContent={content}
  documentTitle={title}
  documentId={documentId}
  onVersionCreated={handleVersionCreated}
/>
```

- Vordefinierte Prompts für häufige Aufgaben (Fortsetzen, Zusammenfassen, Umformulieren, Ideen generieren)
- Anpassbare Prompts für spezifische Anforderungen
- Auswahl zwischen verschiedenen KI-Modellen

#### PromptEditor

Der `PromptEditor` ermöglicht die detaillierte Anpassung von Prompts und bietet verschiedene Optionen für die Verwendung des generierten Textes:

- **An Cursor einfügen**: Fügt den Text an der aktuellen Cursor-Position ein
- **Am Anfang einfügen**: Fügt den Text am Anfang des Dokuments ein
- **Am Ende einfügen**: Fügt den Text am Ende des Dokuments ein
- **Dokument ersetzen**: Ersetzt den gesamten Dokumentinhalt mit dem generierten Text
- **Neue Version erstellen**: Erstellt ein neues Dokument mit dem generierten Text

### Dokumentenversionierung

Eine zentrale Funktion der KI-Integration ist die Dokumentenversionierung. Wenn ein Benutzer die Option "Neue Version erstellen" wählt, wird ein neues Dokument erstellt, das den generierten Text enthält, während das Originaldokument unverändert bleibt.

## Deployment

### Web-Deployment mit Netlify

TextContext kann als Web-Anwendung über Netlify bereitgestellt werden. Hier ist der Prozess für ein erfolgreiches Deployment:

#### Voraussetzungen

- Netlify CLI installiert: `npm install -g netlify-cli`
- Bei Netlify angemeldet: `netlify login`

#### Konfiguration

Die Konfiguration erfolgt über die `netlify.toml`-Datei im Projektverzeichnis:

```toml
[build]
  command = "npx expo export"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Diese Konfiguration:
- Verwendet den Befehl `npx expo export` zum Erstellen der Web-Version
- Veröffentlicht das `dist`-Verzeichnis
- Stellt sicher, dass Node.js 18 für den Build verwendet wird
- Konfiguriert Redirects für Client-seitiges Routing

#### Umgebungsvariablen

Für die Produktion sollten Umgebungsvariablen in einer `.env.production`-Datei konfiguriert werden:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
EXPO_PUBLIC_GOOGLE_API_KEY=your-google-key
```

#### Deployment-Prozess

1. **Web-Version erstellen**:
   ```bash
   cd /pfad/zum/projekt
   npx expo export
   ```
   Dies erstellt die Web-Version im `dist`-Verzeichnis.

2. **Direkt über Netlify CLI deployen**:
   ```bash
   netlify deploy --prod --dir=dist
   ```
   Dieser Befehl lädt die Dateien direkt zu Netlify hoch und stellt sie in der Produktion bereit.

3. **Deployment-Status überprüfen**:
   ```bash
   netlify status
   ```
   Zeigt Informationen zur aktuellen Site an, einschließlich der URL.

#### Kontinuierliche Deployments

Für kontinuierliche Deployments kann das GitHub-Repository mit Netlify verbunden werden:

1. In der Netlify-Benutzeroberfläche: Site settings > Build & deploy > Continuous Deployment
2. GitHub-Repository verbinden
3. Build-Einstellungen konfigurieren (werden automatisch aus netlify.toml übernommen)

Dadurch wird bei jedem Push zum Hauptzweig automatisch ein neues Deployment ausgelöst.

### Mobile-Deployment mit EAS

Für mobile Apps wird Expo Application Services (EAS) verwendet:

#### Voraussetzungen

- EAS CLI installiert: `npm install -g eas-cli`
- Bei Expo angemeldet: `eas login`
- Apple Developer-Konto (für iOS) und/oder Google Play Developer-Konto (für Android)

#### Konfiguration

Die Konfiguration erfolgt über zwei Hauptdateien:

1. **app.json**:
```json
{
  "expo": {
    "name": "TextContext",
    "slug": "textcontext",
    "version": "1.0.0",
    "owner": "tilljs",
    "scheme": "textcontext",
    "ios": {
      "bundleIdentifier": "com.tilljs.textcontext",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.tilljs.textcontext",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "416fc302-4a18-4fc4-b966-c974db622969"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

2. **eas.json**:
```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### Build-Prozess

1. **Projekt initialisieren** (falls noch nicht geschehen):
   ```bash
   eas init
   ```

2. **Build für iOS erstellen**:
   ```bash
   eas build --platform ios --profile preview
   ```
   Für einen Simulator-Build: `--profile development`
   Für einen App Store-Build: `--profile production`

3. **Build für Android erstellen**:
   ```bash
   eas build --platform android --profile preview
   ```

4. **Status überprüfen**:
   Der Build-Status kann in der Expo-Benutzeroberfläche oder mit dem Befehl `eas build:list` überprüft werden.

#### Updates verteilen

Mit EAS Update können JavaScript-Updates ohne neue App Store-Veröffentlichungen verteilt werden:

```bash
eas update --branch production --message "Update mit Token-Accounting-Funktionen"
```

#### App Store-Veröffentlichung

Für die Veröffentlichung im App Store oder Google Play Store:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Für Android:
```bash
eas build --platform android --profile production
eas submit --platform android
```

#### Vorteile der EAS-Builds

- Automatisierte Builds in der Cloud ohne lokale Entwicklungsumgebung
- Einfache Verteilung von Testversionen über QR-Codes
- Nahtlose Integration mit Expo-Projekten
- Over-the-Air-Updates für schnelle Fehlerbehebungen
- Automatische Versionierung mit `autoIncrement`

## Tag-Funktionalität

TextContext bietet eine umfassende Tag-Funktionalität, die es Benutzern ermöglicht, Dokumente zu kategorisieren und schnell zu filtern:

### Tag-Verwaltung

1. **Hinzufügen und Entfernen von Tags**:
   - Benutzer können Tags direkt im Dokumenteditor hinzufügen und entfernen
   - Die Tags werden in Echtzeit in der Datenbank gespeichert
   - Tags werden als Teil der Dokument-Metadaten gespeichert

2. **Tag-Anzeige**:
   - Tags werden in der Dokumentvorschau angezeigt (oben rechts, neben dem Datum)
   - Bei mehr als 2 Tags wird ein "+X"-Indikator angezeigt
   - Tags haben ein konsistentes Design in der gesamten Anwendung

### Tag-Filterung

1. **Horizontale Tag-Pills**:
   - Tags werden als horizontale, scrollbare Pills angezeigt
   - Das Design ist konsistent mit den Space-Filtern auf der Startseite
   - Ausgewählte Tags werden farblich hervorgehoben
   - Ein "Alle Tags"-Button ermöglicht das schnelle Zurücksetzen der Filter

2. **Filterlogik**:
   - Dokumente werden angezeigt, wenn sie alle ausgewählten Tags enthalten (UND-Verknüpfung)
   - Die Tag-Filterung funktioniert nahtlos mit der bestehenden Dokumenttyp-Filterung
   - Die Filterung erfolgt in Echtzeit

### Technische Implementierung

1. **Datenspeicherung**:
   - Tags werden als Array in der `metadata`-Spalte der Dokumente gespeichert
   - Die Struktur ermöglicht flexible Erweiterungen ohne Schemaänderungen

2. **Komponenten**:
   - `DocumentTagsEditor`: Zum Hinzufügen und Entfernen von Tags im Dokumenteditor
   - `DocumentTagsPills`: Zur Anzeige und Filterung von Tags auf der Space-Seite
   - Wiederverwendung der `FilterPill`-Komponente für konsistentes Design

```typescript
// Beispiel für die Erstellung einer neuen Dokumentversion
const { data, error } = await createDocumentVersion(
  originalDocumentId,
  generatedText,
  'summary', // Typ: summary, continuation, rewrite, ideas
  'gpt-4.1', // Verwendetes Modell
  promptText
);
```

Die neue Version enthält Metadaten über das Originaldokument, den verwendeten Prompt und das KI-Modell:

- **Metadaten**: Informationen über das Originaldokument, den Generierungstyp und das verwendete Modell
- **Versionshistorie**: Referenz zum Originaldokument und früheren Versionen
- **Titel**: Automatisch generierter Titel basierend auf dem Generierungstyp (z.B. "Zusammenfassung: Originaltitel")

### Typische KI-Workflows

1. **Textfortsetzung**:
   - Dokument öffnen und Cursor an der gewünschten Position platzieren
   - KI-Assistenten öffnen und "Text fortsetzen" wählen
   - Generierten Text in das aktuelle Dokument einfügen oder als neue Version speichern

2. **Textzusammenfassung**:
   - Dokument öffnen
   - KI-Assistenten öffnen und "Zusammenfassen" wählen
   - Zusammenfassung als neue Version speichern oder in das aktuelle Dokument einfügen

3. **Ideengenerierung**:
   - Dokument öffnen
   - KI-Assistenten öffnen und "Ideen generieren" wählen
   - Generierte Ideen als neue Version speichern oder in das aktuelle Dokument einfügen

4. **Automatisierte Workflows**:
   - Zeitgesteuerte Analysen
   - Automatisierte Verarbeitung

5. **Erweiterte Suche**:
   - Volltext-Suche
   - Semantische Suche

## Entwicklungsrichtlinien

### Komponenten

- Neue UI-Komponenten sollten im entsprechenden Unterverzeichnis von `/components` erstellt werden
- Komponenten sollten typisiert sein (TypeScript)
- Styling mit NativeWind (TailwindCSS-Klassen)

### Styling

- Verwenden Sie TailwindCSS-Klassen für das Styling
- Dunkel-/Hellmodus wird unterstützt

### Routing

- Neue Seiten als Dateien im `/app`-Verzeichnis erstellen (Expo Router)
- Für verschachtelte Routen Unterverzeichnisse verwenden

### State Management

- Für einfache Zustände: React useState und useContext
- Für komplexere Zustände: Zustand nach Bedarf evaluieren

### API-Zugriff

- Supabase-Client für Datenbankzugriffe verwenden
- API-Aufrufe in separaten Funktionen kapseln

## Installationsanleitung

1. Repository klonen
2. Abhängigkeiten installieren: `npm install`
3. Entwicklungsserver starten: `npm start`
4. Expo Go App auf dem Mobilgerät öffnen und QR-Code scannen

## Beitragen

1. Fork des Repositories erstellen
2. Feature-Branch erstellen: `git checkout -b feature/neue-funktion`
3. Änderungen committen: `git commit -m 'Neue Funktion hinzugefügt'`
4. Branch pushen: `git push origin feature/neue-funktion`
5. Pull Request erstellen
