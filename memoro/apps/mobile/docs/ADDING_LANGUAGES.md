# Anleitung zum Hinzufügen neuer Sprachen in Memoro

Diese Dokumentation beschreibt den Prozess zum Hinzufügen neuer Sprachen zur Memoro-App.

## Übersicht

Die Memoro-App verwendet i18next für die Internationalisierung. Die Sprachkonfiguration befindet sich im Verzeichnis `features/i18n`. Um eine neue Sprache hinzuzufügen, müssen folgende Schritte durchgeführt werden:

1. Erstellen einer neuen Übersetzungsdatei
2. Aktualisieren der i18n-Konfiguration
3. Testen der neuen Sprache

## 1. Erstellen einer neuen Übersetzungsdatei

### Schritt 1.1: Erstellen der JSON-Datei

Erstelle eine neue JSON-Datei im Verzeichnis `features/i18n/translations/` mit dem entsprechenden Sprachcode als Dateinamen (z.B. `es.json` für Spanisch).

Verwende eine bestehende Übersetzungsdatei (z.B. `en.json`) als Vorlage und übersetze alle Werte in die neue Sprache. Die Schlüssel müssen identisch bleiben.

Beispiel für eine Übersetzungsdatei:

```json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    // weitere Übersetzungen...
  },
  // weitere Kategorien...
}
```

### Schritt 1.2: Struktur der Übersetzungsdatei

Stelle sicher, dass die Struktur der neuen Übersetzungsdatei exakt der Struktur der vorhandenen Dateien entspricht. Alle Schlüssel müssen vorhanden sein, um Fehler zu vermeiden.

Die Hauptkategorien sind:
- `common`: Allgemeine Begriffe
- `auth`: Authentifizierungsbezogene Texte
- `home`: Texte für die Startseite
- `tabs`: Bezeichnungen für die Tabs
- `menu`: Menüeinträge
- `blueprints`: Texte für Blueprints
- `app`: App-spezifische Texte
- `tags`: Tag-bezogene Texte
- `memo`: Memo-bezogene Texte
- `settings`: Einstellungstexte
- `recording`: Aufnahme-bezogene Texte
- `layout`: Layout-bezogene Texte
- `audio_archive`: Texte für das Audio-Archiv

## 2. Aktualisieren der i18n-Konfiguration

### Schritt 2.1: Import der neuen Übersetzungsdatei

Öffne die Datei `features/i18n/index.ts` und füge einen Import für die neue Übersetzungsdatei hinzu:

```typescript
import xx from './translations/xx.json'; // xx ist der Sprachcode der neuen Sprache
```

### Schritt 2.2: Aktualisieren der LANGUAGES-Konstante

Füge die neue Sprache zur `LANGUAGES`-Konstante hinzu:

```typescript
export const LANGUAGES = {
  // bestehende Sprachen...
  xx: { nativeName: 'Sprachname', emoji: '🇽🇽' }, // Sprachname in der Originalsprache und entsprechendes Flaggen-Emoji
};
```

Verwende für das Emoji die entsprechende Länderflagge im Unicode-Format (z.B. 🇪🇸 für Spanien).

### Schritt 2.3: Aktualisieren der i18n-Ressourcen

Füge die neue Sprache zu den Ressourcen in der i18n-Initialisierung hinzu:

```typescript
i18n
  .use(initReactI18next)
  .init({
    resources: {
      // bestehende Sprachen...
      xx: { translation: xx },
    },
    // weitere Konfigurationen...
  });
```

## 3. Testen der neuen Sprache

### Schritt 3.1: Überprüfen der Sprachauswahl

Starte die App und navigiere zu den Einstellungen. Die neue Sprache sollte in der Sprachauswahl erscheinen.

### Schritt 3.2: Testen der Übersetzungen

Wähle die neue Sprache aus und überprüfe, ob alle Texte korrekt übersetzt werden. Achte besonders auf:
- Formatierungen (z.B. bei Datumsangaben)
- Pluralformen
- Spezielle Zeichen
- Textlängen (einige Übersetzungen können länger sein als die Originaltexte)

### Schritt 3.3: Überprüfen der RTL-Unterstützung (falls erforderlich)

Wenn die neue Sprache von rechts nach links geschrieben wird (z.B. Arabisch, Hebräisch), überprüfe, ob die RTL-Unterstützung korrekt funktioniert. In der Datei `features/i18n/LanguageContext.tsx` wird die RTL-Unterstützung für bestimmte Sprachen aktiviert:

```typescript
setIsRTL(['ar', 'he'].includes(language)); // Füge hier den neuen Sprachcode hinzu, falls nötig
```

## 4. Erweitern der Blueprint-Funktionalität

Wenn die App Blueprints mit mehrsprachigen Inhalten unterstützt, müssen möglicherweise auch die Blueprint-Formulare und -Komponenten aktualisiert werden, um die neue Sprache zu unterstützen.

### Schritt 4.1: Aktualisieren der Blueprint-Formulare

Füge neue Felder für die neue Sprache in den Blueprint-Erstellungs- und -Bearbeitungsformularen hinzu.

### Schritt 4.2: Aktualisieren der Blueprint-Anzeige

Stelle sicher, dass die Blueprint-Anzeige die Inhalte in der neuen Sprache korrekt darstellt.

## 5. Bekannte Einschränkungen

- Die Memoro-App unterstützt derzeit keine dynamische Nachladen von Übersetzungen. Alle Übersetzungen müssen zum Build-Zeitpunkt vorhanden sein.
- Einige Teile der App könnten hardcodierte Texte enthalten, die nicht über das i18n-System übersetzt werden.

## 6. Tipps für Übersetzer

- Verwende konsistente Terminologie innerhalb der Übersetzung.
- Achte auf den Kontext der Texte, um eine angemessene Übersetzung zu gewährleisten.
- Teste die Übersetzungen in der App, um sicherzustellen, dass sie im UI-Kontext gut funktionieren.
- Berücksichtige Platzbeschränkungen in der UI, besonders bei längeren Übersetzungen.

## 7. Beispiel: Hinzufügen neuer Sprachen

### 7.1 Beispiel: Hinzufügen von Spanisch

```typescript
// 1. Erstelle die Datei features/i18n/translations/es.json mit allen Übersetzungen

// 2. Aktualisiere features/i18n/index.ts
import es from './translations/es.json';

export const LANGUAGES = {
  de: { nativeName: 'Deutsch', emoji: '🇩🇪' },
  en: { nativeName: 'English', emoji: '🇬🇧' },
  it: { nativeName: 'Italiano', emoji: '🇮🇹' },
  fr: { nativeName: 'Français', emoji: '🇫🇷' },
  es: { nativeName: 'Español', emoji: '🇪🇸' },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
    },
    // weitere Konfigurationen...
  });
```

### 7.2 Beispiel: Hinzufügen von Griechisch

```typescript
// 1. Erstelle die Datei features/i18n/translations/el.json mit allen Übersetzungen

// 2. Aktualisiere features/i18n/index.ts
import el from './translations/el.json';

export const LANGUAGES = {
  // bestehende Sprachen...
  el: { nativeName: 'Ελληνικά', emoji: '🇬🇷' },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      // bestehende Sprachen...
      el: { translation: el },
    },
    // weitere Konfigurationen...
  });
```

### 7.3 Beispiel: Hinzufügen von Lettisch

```typescript
// 1. Erstelle die Datei features/i18n/translations/lv.json mit allen Übersetzungen

// 2. Aktualisiere features/i18n/index.ts
import lv from './translations/lv.json';

export const LANGUAGES = {
  // bestehende Sprachen...
  lv: { nativeName: 'Latviešu', emoji: '🇱🇻' },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      // bestehende Sprachen...
      lv: { translation: lv },
    },
    // weitere Konfigurationen...
  });
```

### 7.4 Beispiel: Hinzufügen von Litauisch

```typescript
// 1. Erstelle die Datei features/i18n/translations/lt.json mit allen Übersetzungen

// 2. Aktualisiere features/i18n/index.ts
import lt from './translations/lt.json';

export const LANGUAGES = {
  // bestehende Sprachen...
  lt: { nativeName: 'Lietuvių', emoji: '🇱🇹' },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      // bestehende Sprachen...
      lt: { translation: lt },
    },
    // weitere Konfigurationen...
  });
```

### 7.5 Beispiel: Hinzufügen von Slowakisch

```typescript
// 1. Erstelle die Datei features/i18n/translations/sk.json mit allen Übersetzungen

// 2. Aktualisiere features/i18n/index.ts
import sk from './translations/sk.json';

export const LANGUAGES = {
  // bestehende Sprachen...
  sk: { nativeName: 'Slovenčina', emoji: '🇸🇰' },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      // bestehende Sprachen...
      sk: { translation: sk },
    },
    // weitere Konfigurationen...
  });
```

### 7.6 Beispiel: Hinzufügen von Slowenisch

```typescript
// 1. Erstelle die Datei features/i18n/translations/sl.json mit allen Übersetzungen

// 2. Aktualisiere features/i18n/index.ts
import sl from './translations/sl.json';

export const LANGUAGES = {
  // bestehende Sprachen...
  sl: { nativeName: 'Slovenščina', emoji: '🇸🇮' },
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      // bestehende Sprachen...
      sl: { translation: sl },
    },
    // weitere Konfigurationen...
  });
```
