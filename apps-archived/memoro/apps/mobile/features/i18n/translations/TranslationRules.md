# Translation Rules for Memoro App

This document outlines the guidelines and rules for translating the Memoro app into different languages.

## General Principles

1. **Consistency**: Maintain consistent terminology throughout the entire translation
2. **Brand Terms**: Keep brand-specific terms unchanged across all languages
3. **Interpolation**: Never translate or modify interpolation variables (e.g., `{{count}}`, `{{name}}`)
4. **JSON Structure**: Maintain the exact same JSON structure as the English reference file
5. **Completeness**: All keys present in the English file must be present in translated files

## Brand Terms (Do NOT Translate)

The following terms are brand names or technical terms that should remain unchanged in all languages:

- **Memoro** - The app name
- **Mana** - The credit/currency system
- **Memory/Memories** - The feature name (not the general word)
- **Blueprint** - The template/mode feature
- **Tag/Tags** - Commonly used in original form across languages

## Language-Specific Guidelines

### Important: Informal Address

**All languages should use informal address forms** to maintain a friendly, modern app experience:

- German: "du/dein" (not "Sie")
- French: "tu/ton" (not "vous")
- Italian: "tu/tuo" (not "Lei")
- Spanish: "tú/tu" (not "usted")
- Dutch: "je/jij" (already informal)

### German (de)

- Use informal "du" for user-facing text
- Technical terms: Keep English terms that are commonly used in German IT contexts
- Date format: DD.MM.YYYY
- Time format: 24-hour (HH:mm)

### French (fr)

- Use informal "tu" for user-facing text
- Keep articles with brand terms where natural (e.g., "une Memory")
- Date format: DD/MM/YYYY
- Time format: 24-hour (HH:mm)

### Italian (it)

- Use informal "tu" forms (second person singular)
- Keep articles with brand terms where natural (e.g., "una Memory")
- Date format: DD/MM/YYYY
- Time format: 24-hour (HH:mm)

### Spanish (es)

- Use informal "tú" forms for instructions and UI text
- Date format: DD/MM/YYYY
- Time format: 24-hour (HH:mm)

### Dutch (nl)

- Use informal "je/jij" forms (modern app convention)
- Date format: DD-MM-YYYY
- Time format: 24-hour (HH:mm)

## Common Translations

### Core Features

| English      | German           | French         | Italian       | Spanish          | Dutch          |
| ------------ | ---------------- | -------------- | ------------- | ---------------- | -------------- |
| Memo/Memos   | Memo/Memos       | Mémo/Mémos     | Memo/Memo     | Memo/Memos       | Memo/Memo's    |
| Recording    | Aufnahme         | Enregistrement | Registrazione | Grabación        | Opname         |
| Transcript   | Transkript       | Transcription  | Trascrizione  | Transcripción    | Transcriptie   |
| Speaker      | Sprecher         | Intervenant    | Relatore      | Orador           | Spreker        |
| Space/Spaces | Bereich/Bereiche | Espace/Espaces | Spazio/Spazi  | Espacio/Espacios | Ruimte/Ruimtes |

### Actions

| English   | German            | French               | Italian       | Spanish        | Dutch               |
| --------- | ----------------- | -------------------- | ------------- | -------------- | ------------------- |
| Share     | Teilen            | Partager             | Condividi     | Compartir      | Delen               |
| Copy      | Kopieren          | Copier               | Copia         | Copiar         | Kopiëren            |
| Delete    | Löschen           | Supprimer            | Elimina       | Eliminar       | Verwijderen         |
| Pin/Unpin | Anpinnen/Loslösen | Épingler/Désépingler | Fissa/Sblocca | Fijar/Desfijar | Vastpinnen/Losmaken |

## Technical Terms

### Audio & Processing

- **Diarization**:
  - DE: Sprechererkennung
  - FR: Diarisation
  - IT: Diarizzazione
  - ES: Diarización
  - NL: Sprekerherkenning

### Features to Keep in English

- API
- Webhook
- Token
- Provider
- Analytics

## Context Menu Actions

When implementing context menus, ensure these standard actions are consistently translated:

1. Share functionality
2. Copy functionality
3. Pin/Unpin toggle
4. Delete with confirmation

## Validation Checklist

Before finalizing translations:

1. ✓ All keys from English file are present
2. ✓ No interpolation variables were modified
3. ✓ Brand terms remain unchanged
4. ✓ Consistent terminology throughout
5. ✓ Appropriate formality level maintained
6. ✓ No hardcoded language strings in action handlers
7. ✓ Menu actions use IDs, not translated strings

## Adding New Languages

When adding a new language:

1. Copy the English (en.json) file as template
2. Maintain all keys and structure
3. Translate values following these guidelines
4. Keep brand terms unchanged
5. Test all interactive elements (menus, buttons, etc.)
6. Verify character encoding (UTF-8)
7. Check text direction (RTL languages need special handling)

## Common Issues to Avoid

1. **Never translate**:
   - Variable names in curly braces: `{{variable}}`
   - Brand names: Memoro, Mana, Memory, Blueprint
   - Technical terms when commonly used in English
2. **Always translate**:
   - UI action words (Save, Cancel, Delete, etc.)
   - Descriptive text and messages
   - Error messages and confirmations
3. **Header Menu Issue**: The app uses action IDs for navigation, not translated strings. Ensure menu items have proper `id` fields.

## Notes for Developers

- The header menu (`HeaderMenu.tsx`) was updated to use action IDs instead of translated strings
- Context menus must follow the same pattern - use IDs for action handling
- Always test menu functionality after adding new translations
