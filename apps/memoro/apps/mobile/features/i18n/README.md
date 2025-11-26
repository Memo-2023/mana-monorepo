# Mehrsprachigkeitsunterstützung (i18n) für Memoro

Diese Komponente implementiert die Mehrsprachigkeitsunterstützung (Internationalisierung/i18n) für die Memoro-App mit Hilfe von `expo-localization`, `i18next` und `react-i18next`.

## Funktionen

- Automatische Erkennung der Gerätesprache
- Unterstützung für 45 Sprachen
- Persistente Speicherung der Spracheinstellung
- Benutzerfreundliche Sprachauswahl-Komponente
- Vollständige Integration in die App-Einstellungen
- Kulturspezifische Zeit- und Datumsformatierung

## Struktur

```
features/i18n/
├── index.ts                # Hauptkonfiguration für i18next
├── LanguageContext.tsx     # React Context für die Sprachverwaltung
├── LanguageSelector.tsx    # UI-Komponente für die Sprachauswahl
├── translations/           # Übersetzungsdateien
│   ├── de.json             # Deutsche Übersetzungen
│   └── en.json             # Englische Übersetzungen
└── README.md               # Diese Dokumentation
```

## Verwendung

### Übersetzungen verwenden

Um Texte in der App zu übersetzen, verwende den `useTranslation`-Hook:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.save')}</Text>
  );
}
```

### Sprache ändern

Um die Sprache programmatisch zu ändern, verwende den `useLanguage`-Hook:

```tsx
import { useLanguage } from '~/features/i18n/LanguageContext';

function MyComponent() {
  const { changeLanguage } = useLanguage();
  
  const handleChangeLanguage = async (language: string) => {
    await changeLanguage(language);
  };
  
  return (
    <Button onPress={() => handleChangeLanguage('de')}>
      Deutsch
    </Button>
  );
}
```

### Sprachauswahl-Komponente einbinden

Die Sprachauswahl-Komponente kann wie folgt eingebunden werden:

```tsx
import { useState } from 'react';
import LanguageSelector from '~/features/i18n/LanguageSelector';

function MyComponent() {
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] = useState(false);
  
  return (
    <>
      <Button onPress={() => setIsLanguageSelectorVisible(true)}>
        Sprache wählen
      </Button>
      
      <LanguageSelector
        isVisible={isLanguageSelectorVisible}
        onClose={() => setIsLanguageSelectorVisible(false)}
      />
    </>
  );
}
```

## Neue Sprachen hinzufügen

Um eine neue Sprache hinzuzufügen:

1. Erstelle eine neue Übersetzungsdatei in `translations/` (z.B. `fr.json`)
2. Füge die Sprache zur `LANGUAGES`-Konstante in `index.ts` hinzu:

```typescript
export const LANGUAGES = {
  de: { nativeName: 'Deutsch', emoji: '🇩🇪' },
  en: { nativeName: 'English', emoji: '🇬🇧' },
  fr: { nativeName: 'Français', emoji: '🇫🇷' }, // Neue Sprache
};
```

3. Importiere die neue Übersetzungsdatei in `index.ts` und füge sie zu den Ressourcen hinzu:

```typescript
import fr from './translations/fr.json';

// ...

resources: {
  de: { translation: de },
  en: { translation: en },
  fr: { translation: fr }, // Neue Sprache
},
```

## Übersetzungsschlüssel

Die Übersetzungsschlüssel sind hierarchisch organisiert:

- `common`: Allgemeine Begriffe (Speichern, Abbrechen, etc.)
- `auth`: Authentifizierungsbezogene Texte
- `home`: Texte für die Home-Seite
- `memo`: Texte für Memo-bezogene Funktionen
- `settings`: Texte für die Einstellungsseite

## Zeit- und Datumsformatierung

Die App unterstützt kulturspezifische Zeit- und Datumsformatierung für alle 45 Sprachen.

### Zeitformatierung

Die Zeitanzeige wird automatisch an die jeweilige Sprache angepasst:

#### Sprachen mit speziellen Suffixen/Präfixen:
- 🇩🇪 **Deutsch**: "19:30 Uhr"
- 🇳🇱 **Niederländisch**: "19:30 uur"
- 🇩🇰 **Dänisch**: "kl. 19.30" (mit Punkt-Trenner)
- 🇸🇪 **Schwedisch**: "kl. 19:30"
- 🇫🇷 **Französisch**: "19h30"
- 🇧🇬 **Bulgarisch**: "19:30 ч."
- 🇱🇹 **Litauisch**: "19:30 val."
- 🇫🇮 **Finnisch**: "klo 19.30" (mit Punkt-Trenner)
- 🇹🇭 **Thailändisch**: "19:30 น."
- 🇮🇩 **Indonesisch**: "19.30" (Punkt statt Doppelpunkt)

#### 12-Stunden-Format Sprachen:
- 🇬🇧 **Englisch**: "7:30 PM"
- 🇮🇳 **Hindi**: "7:30 PM"
- 🇵🇰 **Urdu**: "7:30 PM"
- 🇵🇭 **Tagalog**: "7:30 PM"
- 🇲🇾 **Malaiisch**: "7:30 PM"

#### Einfaches 24-Stunden-Format:
Alle anderen Sprachen verwenden "19:30" ohne Suffix.

### Datumsformatierung

Die Datumsanzeige nutzt die native `toLocaleDateString()` Funktion mit der aktuellen App-Sprache:

```typescript
// Beispiele:
// Deutsch: "Montag, 7. Januar 2025"
// Englisch: "Monday, January 7, 2025"
// Französisch: "lundi 7 janvier 2025"
```

### Implementierung

Die Zeit- und Datumsformatierung ist in folgenden Dateien implementiert:

- `/utils/formatters.ts` - Zentrale Formatierungsfunktionen
- `/features/memos/utils/dateFormatters.ts` - React Hooks für locale-aware Formatierung
- Komponenten nutzen `useFormatTime()` und `useFormatDate()` Hooks für konsistente Formatierung

### Verwendung in Komponenten

```typescript
import { useFormatTime, useFormatDate } from '~/features/memos/utils/dateFormatters';

function MyComponent() {
  const formatTime = useFormatTime();
  const formatDate = useFormatDate();
  
  const now = new Date();
  
  return (
    <>
      <Text>{formatDate(now)}</Text>
      <Text>{formatTime(now)}</Text>
    </>
  );
}
```

## Abhängigkeiten

- `expo-localization`: Für die Erkennung der Gerätesprache
- `i18next`: Hauptbibliothek für Internationalisierung
- `react-i18next`: React-Bindings für i18next
- `@react-native-async-storage/async-storage`: Für die persistente Speicherung der Spracheinstellung
