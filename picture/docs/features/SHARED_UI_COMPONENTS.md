# Shared UI Components System

## Overview

Plan für ein geteiltes UI-Komponenten-System über 10+ Apps hinweg. Ziel ist es, UI-Elemente konsistent zu halten und neue Apps schneller zu bauen, ohne einen großen Monorepo zu nutzen (wegen KI-Context-Pollution).

## Strategie: CLI-Tool (shadcn-style) mit optionalem Tailwind-Preset

### Phase 1: CLI-Tool für Component Copy-Paste (Start hier)
**Zeitaufwand:** 1-2 Tage

Wir starten mit einem simplen Ansatz:
- Zentrales Git-Repo mit UI-Components
- CLI-Tool das Components in Apps kopiert
- Components gehören dann der App (volle Kontrolle)
- Keine NPM-Dependencies für Components

**Vorteile dieser Reihenfolge:**
- Schneller Start, kein Over-Engineering
- Wir lernen welche Design-Patterns sich wirklich wiederholen
- Kein zweites System am Anfang
- CLI-Tool validiert ob der Ansatz überhaupt funktioniert

### Phase 2: Tailwind-Preset (optional, später)
**Zeitaufwand:** 2-3 Stunden
**Wann:** Nach 1-3 Monaten, wenn wir sehen was sich wiederholt

Falls wir merken dass bestimmte Design-Tokens (Farben, Spacing, etc.) überall gleich sind:
- Extrahieren in ein kleines Tailwind-Config NPM package
- Components im Library-Repo updaten zu nutzen das Preset
- Bestehende Apps können updaten (optional)

**Migration ist einfach:**
- Preset Package erstellen
- Components refactoren: `bg-[#3B82F6]` → `bg-brand-primary`
- Apps installieren Preset und re-adden Components

---

## Detailed Implementation Plan

### 1. UI-Components Library Repository

**Repository:** `github.com/memoro/ui` (Monorepo)

**Repository Struktur:**
```
memoro-ui/
├── packages/
│   ├── cli/                   # @memoro/ui CLI-Tool
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── add.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── update.ts
│   │   │   │   └── diff.ts
│   │   │   ├── utils/
│   │   │   │   ├── file-operations.ts
│   │   │   │   ├── github-api.ts
│   │   │   │   └── templates.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── components/            # Component source code
│   │   ├── ui/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── README.md
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   └── ...
│   │   └── navigation/
│   │       ├── Header/
│   │       ├── TabBar/
│   │       ├── BackButton/
│   │       └── ...
│   └── preview/               # Lokale Expo App
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── ui.tsx         # UI Components showcase
│       │   │   └── navigation.tsx  # Navigation Components showcase
│       │   └── _layout.tsx
│       ├── package.json
│       └── README.md
├── registry.json              # Component metadata
├── pnpm-workspace.yaml
├── .gitignore
├── package.json
└── README.md
```

**registry.json Beispiel:**
```json
{
  "components": {
    "ui": {
      "button": {
        "name": "Button",
        "files": ["Button.tsx"],
        "category": "ui",
        "dependencies": [],
        "description": "A pressable button component with variants"
      },
      "input": {
        "name": "Input",
        "files": ["Input.tsx"],
        "category": "ui",
        "dependencies": [],
        "description": "Text input with label and error states"
      }
    },
    "navigation": {
      "header": {
        "name": "Header",
        "files": ["Header.tsx"],
        "category": "navigation",
        "dependencies": [],
        "description": "App header with title and optional actions"
      },
      "tab-bar": {
        "name": "TabBar",
        "files": ["TabBar.tsx"],
        "category": "navigation",
        "dependencies": [],
        "description": "Bottom tab bar navigation component"
      }
    }
  }
}
```

### 2. CLI-Tool Features

**Commands:**

**`npx @memoro/ui add <component>`**
- Kopiert Component-Code in `app/components/ui/`
- Prüft ob Component bereits existiert
- Fragt bei Konflikten nach (überschreiben/skip)
- Zeigt Success-Message mit Import-Beispiel

**`npx @memoro/ui list`**
- Zeigt alle verfügbaren Components
- Zeigt welche bereits in der App sind
- Zeigt Beschreibung jedes Components

**`npx @memoro/ui update <component>`**
- Updated einen existierenden Component
- Zeigt Diff der Änderungen
- Fragt nach Bestätigung

**`npx @memoro/ui diff <component>`**
- Zeigt Unterschiede zwischen lokaler und Library-Version
- Hilfreich um zu sehen ob lokale Anpassungen gemacht wurden

**Optional später:**
- `init` - Erstellt `components/ui/` Ordner
- `remove` - Entfernt Component aus App
- `sync` - Updated alle Components auf einmal

### 3. Component Development Workflow

**Neuer Component:**
1. Entwickle Component in `ui-components/components/`
2. Teste in Preview-App
3. Schreibe README mit Usage-Beispielen
4. Update `registry.json`
5. Commit & Push

**Component nutzen:**
1. In App: `npx @memoro/ui add button`
2. Component liegt jetzt in `app/components/ui/Button.tsx`
3. Importieren: `import { Button } from '@/components/ui/Button'`
4. Bei Bedarf app-spezifisch anpassen

**Component updaten:**
1. Änderungen in Library-Repo
2. Apps können entscheiden ob sie updaten wollen
3. `npx @memoro/ui update button` in jeweiliger App
4. Review des Diffs, dann accept/reject

### 4. Component Standards

**Jeder Component sollte haben:**

**Consistent API:**
- Props sind konsistent benannt über alle Components
- `variant`, `size`, `disabled` patterns
- `className` für custom Tailwind classes
- `children` wo sinnvoll

**TypeScript:**
- Vollständige Type definitions
- Exported Types für Props
- Generic Support wo nötig

**Accessibility:**
- ARIA labels wo nötig
- Keyboard navigation
- Screen reader support

**Styling:**
- NativeWind/Tailwind classes
- Responsive by default
- Dark mode ready (später)

**Documentation:**
- README.md mit:
  - Beschreibung
  - Props table
  - Usage examples
  - Variants showcase

### 5. Preview/Development App

**Expo App in ui-components/preview:**
- Live preview aller Components
- Test auf echten Devices
- QR-Code für schnelles Testen
- Optional: Storybook integration

**Zweck:**
- Entwickle Components in Isolation
- Visual testing
- Dokumentation als Live-Demo
- Teilen mit Designern für Feedback

### 6. Initial Component Set

**Start mit diesen Core Components:**

**UI Components (`packages/components/ui/`):**

**Layout:**
- Container
- Stack (VStack/HStack)
- Spacer
- Divider

**Input:**
- Button
- Input (TextInput)
- Checkbox
- Switch
- Slider

**Display:**
- Text (mit Typography variants)
- Card
- Badge
- Avatar
- Image (mit Loading states)

**Feedback:**
- Alert
- Toast
- Spinner/Loading
- Progress

**Overlay:**
- Modal
- Sheet (Bottom sheet)
- Dropdown

**Navigation Components (`packages/components/navigation/`):**
- Header (mit Title, Back Button, Actions)
- TabBar (Bottom Tab Navigation)
- BackButton
- TabBarItem
- HeaderAction (z.B. Settings Icon)

### 7. Naming Conventions

**Component Files:**
- PascalCase: `Button.tsx`, `TextInput.tsx`
- Co-located files: `Button.stories.tsx`, `Button.test.tsx`

**Registry IDs:**
- kebab-case: `button`, `text-input`
- Matches CLI usage: `npx ui add text-input`

**Variants:**
- lowercase: `primary`, `secondary`, `outline`
- Sizes: `sm`, `md`, `lg`, `xl`

### 8. Version Strategy (später relevant)

**Phase 1 (jetzt):**
- Keine Versionierung nötig
- Components werden kopiert = keine Breaking changes
- Apps besitzen den Code

**Phase 2 (wenn nötig):**
- Semantic versioning für CLI-Tool
- Component changelog in README
- Breaking changes werden dokumentiert
- Apps updaten optional

### 9. Testing Strategy

**CLI-Tool:**
- Unit tests für file operations
- Integration tests für add/update commands
- Test mit dummy Expo app

**Components:**
- Visual testing in Preview app
- Optional: Jest + React Native Testing Library
- Manual testing auf iOS/Android

### 10. Migration Path für bestehende Apps

**Für "picture" App (erste Migration):**

1. **Setup:**
   - Setup `.npmrc` für GitHub Packages auth
   - `npm login --registry=https://npm.pkg.github.com`
   - Oder lokal ohne Installation: `npx @memoro/ui`

2. **Identify Components:**
   - Analysiere welche Components bereits in der App sind
   - Vergleiche mit Library - was kann ersetzt werden?

3. **Migrate Component by Component:**
   - Start mit einem simplen (z.B. Button)
   - `npx @memoro/ui add button`
   - Ersetze alte Implementierung
   - Teste gründlich
   - Repeat für weitere Components

4. **Custom Components:**
   - Wenn app-spezifisch: behalten in `app/components/`
   - Wenn wiederverwendbar: zu Library hinzufügen

**Für neue Apps:**
- Start projekt
- Setup `.npmrc` mit `@memoro:registry=https://npm.pkg.github.com`
- `npx @memoro/ui init` (erstellt structure)
- Add benötigte Components
- Build feature

### 11. Documentation

**README in Library Repo:**
- Was ist das System
- Wie installiert man CLI
- Quick start guide
- Component overview mit Links

**Per-Component README:**
- Props documentation
- Usage examples
- Variants showcase
- Do's and Don'ts

**Changelog:**
- Tracked in Library repo
- Breaking changes highlighted
- Migration guides wenn nötig

### 12. Future Enhancements (Phase 2+)

**Wenn Tailwind-Preset hinzukommt:**
- Mini NPM package: `@memoro/tailwind-preset`
- Ebenfalls via GitHub Packages publiziert
- Components nutzen Design tokens
- Zentrale Design updates möglich
- Migration guide für bestehende Components

**Weitere Features:**
- Theming system (Light/Dark mode)
- Animation presets
- Icon set integration
- Form validation helpers
- Data fetching patterns (optional)

**Tooling:**
- VSCode snippets für Components
- GitHub Actions für automated testing
- Automated screenshot testing
- Figma plugin für Design → Code

---

## Success Metrics

**Phase 1 (CLI-Tool):**
- ✅ 10+ wiederverwendbare Components
- ✅ CLI-Tool funktioniert in allen Apps
- ✅ Mindestens 2 Apps nutzen das System
- ✅ Zeit für neue App-Features: -30%

**Phase 2 (Tailwind-Preset):**
- ✅ Design tokens extrahiert
- ✅ Konsistente Farben/Spacing über alle Apps
- ✅ Design updates in <1 Tag für alle Apps

**Overall:**
- ✅ Neue App in <1 Tag bootstrap-bar
- ✅ UI consistency über alle Apps
- ✅ Component reuse rate >60%
- ✅ Weniger duplicate code

---

## Timeline

**Week 1-2: Setup**
- UI-Components Repo erstellen
- CLI-Tool Grundstruktur
- Registry system
- Preview app setup

**Week 3-4: Core Components**
- 5 wichtigste Components entwickeln
- Testing in Preview app
- Documentation schreiben

**Week 5: First Migration**
- "picture" App als Test
- 2-3 Components migrieren
- Learnings dokumentieren

**Week 6+: Iteration**
- Mehr Components hinzufügen
- Weitere Apps migrieren
- CLI verbessern basierend auf Feedback

**Month 2-3: Optional Tailwind-Preset**
- Nur wenn es sich als nötig erweist
- Design tokens extrahieren
- Components refactoren
- Apps updaten

---

## Decisions Made

### 1. Package Naming ✅
**Entscheidung:** `@memoro/ui`

**Reasoning:**
- Klarer, einprägsamer Name
- Namespace `@memoro` für alle zukünftigen Packages
- Konsistent für späteres `@memoro/tailwind-preset`

### 2. Registry ✅
**Entscheidung:** GitHub Packages

**Reasoning:**
- ✅ Kostenlos für private Repos
- ✅ Bereits in GitHub - keine extra Infrastruktur
- ✅ Einfache CI/CD Integration mit GitHub Actions
- ✅ Ausreichend für 10+ Apps
- ✅ Kann später zu Private NPM migriert werden wenn nötig

**Setup Details:**
```json
// package.json im CLI-Tool
{
  "name": "@memoro/ui",
  "repository": "https://github.com/[username]/memoro-ui",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

**Usage in Apps:**
```bash
# .npmrc in jeder App
@memoro:registry=https://npm.pkg.github.com

# Einmalig pro Developer:
npm login --registry=https://npm.pkg.github.com

# Dann normal:
npm install @memoro/ui
npx @memoro/ui add button
```

**GitHub Personal Access Token (PAT) benötigt mit:**
- `read:packages` - Um Packages zu installieren
- `write:packages` - Um zu publizieren (nur für Maintainer)

**CI/CD Setup (GitHub Actions):**
```yaml
- name: Setup NPM for GitHub Packages
  run: |
    echo "@memoro:registry=https://npm.pkg.github.com" >> .npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc
```

---

### 3. Component Scope ✅
**Entscheidung:** UI-Components + Navigation Components

**Included:**
- ✅ UI-Components (Button, Input, Card, Badge, Avatar, etc.)
- ✅ Navigation Components (Header, TabBar, BackButton, etc.)

**Excluded (für jetzt):**
- ❌ Form validation helpers
- ❌ Data display (Lists, Tables, Pagination)
- ❌ Complex business logic components

**Reasoning:**
- Navigation components sind essentiell für jede App
- Wiederholen sich über alle Apps hinweg
- Bleiben UI-fokussiert ohne Business-Logik
- Können später erweitert werden wenn Bedarf entsteht

### 4. Testing Strategy ✅
**Entscheidung:** Manual Testing in Phase 1

**Phase 1:**
- Manual testing in Preview App
- Visual verification auf iOS/Android
- Component usage testing in real apps

**Phase 2 (später):**
- Automated tests wenn Library >5 Components hat
- Jest + React Native Testing Library
- Visual regression testing (optional)

**Reasoning:**
- Schneller Start ohne Testing-Overhead
- Preview App bietet gute visuelle Kontrolle
- Automated tests später wenn Library stabiler ist

### 5. Preview App ✅
**Entscheidung:** Lokale Expo App

**Setup:**
- Expo App im Monorepo unter `packages/preview/`
- Dev Client für native Features
- Hot reload während Component-Development

**Reasoning:**
- ✅ Mehr Kontrolle als Expo Snack
- ✅ Native Features testbar (z.B. Haptics, Gestures)
- ✅ Läuft im gleichen Repo - einfaches Development
- ✅ Kann mit Components in `packages/components/` direkt arbeiten

### 6. Repository Structure ✅
**Entscheidung:** Monorepo mit pnpm workspaces

**Structure:**
```
memoro-ui/
├── packages/
│   ├── cli/              # @memoro/ui CLI-Tool
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── components/       # Component source code
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   └── preview/          # Expo preview app
│       ├── app/
│       ├── package.json
│       └── README.md
├── registry.json         # Component metadata
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
```

**Reasoning:**
- ✅ Alles in einem Repo - einfacher zu entwickeln
- ✅ Shared dependencies zwischen Packages
- ✅ pnpm = schneller & effizienter als npm/yarn
- ✅ Preview App kann Components direkt importieren
- ✅ CLI kann direkt auf Components zugreifen

### 7. GitHub Organization ✅
**Entscheidung:** GitHub Organization `@memoro`

**Setup:**
- Neue GitHub Org: `memoro` (oder `memoro-ui`)
- Repo: `github.com/memoro/ui` (oder ähnlich)
- Package: `@memoro/ui`

**Package Configuration:**
```json
{
  "name": "@memoro/ui",
  "repository": "https://github.com/memoro/ui",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

**Reasoning:**
- ✅ Professioneller Auftritt
- ✅ Namespace für zukünftige Packages (`@memoro/tailwind-preset`)
- ✅ Einfacher Team-Management später
- ✅ Klare Trennung von Personal Projects

**GitHub Org Setup:**
1. Erstelle neue Org: https://github.com/organizations/plan
2. Invite Members (wenn Team)
3. Setup Package Permissions
4. Create `ui` repository

---

## Open Questions / Decisions Needed

**Alle Haupt-Entscheidungen getroffen! ✅**

Optionale Entscheidungen für später:
- **Icon System:** Eigenes Icon-Set oder bestehende Library? (@expo/vector-icons, react-native-heroicons)
- **Animation Library:** Reanimated, Moti, oder custom?
- **TypeScript Strictness:** Wie streng? (strict mode, exactOptionalPropertyTypes, etc.)

---

## Next Steps

### Phase 1: Repository Setup
1. ✅ Plan dokumentiert
2. ✅ Alle Entscheidungen getroffen
3. ⏳ GitHub Organization `memoro` erstellen
4. ⏳ Repository `memoro/ui` erstellen
5. ⏳ Monorepo Struktur aufsetzen
   - pnpm workspace initialisieren
   - packages/cli, packages/components, packages/preview
   - registry.json erstellen

### Phase 2: Preview App Setup
6. ⏳ Expo App in `packages/preview/` aufsetzen
   - Expo Router konfigurieren
   - NativeWind/Tailwind einrichten
   - Tabs für UI & Navigation Components

### Phase 3: CLI-Tool Prototyp
7. ⏳ CLI-Tool Grundstruktur bauen
   - TypeScript setup
   - Commands: add, list, diff, update
   - GitHub Packages publish konfigurieren

### Phase 4: Erste Components
8. ⏳ Ersten UI Component entwickeln (Button)
   - Component code in `packages/components/ui/Button/`
   - README schreiben
   - In Preview App testen
   - registry.json eintragen
9. ⏳ Ersten Navigation Component entwickeln (Header)
   - Component code in `packages/components/navigation/Header/`
   - README schreiben
   - In Preview App testen
   - registry.json eintragen

### Phase 5: Testing in Real App
10. ⏳ CLI publishen zu GitHub Packages
11. ⏳ In "picture" App testen
    - `.npmrc` setup
    - `npx @memoro/ui add button`
    - `npx @memoro/ui add header`
    - Integration testen
12. ⏳ Learnings dokumentieren & iterieren

---

## Notes

- **Flexibilität first:** CLI-Ansatz gibt Apps maximale Kontrolle
- **Organic growth:** System wächst mit echten Anforderungen
- **No lock-in:** Apps können jederzeit eigene Wege gehen
- **Progressive enhancement:** Tailwind-Preset nur wenn es Sinn macht
- **Developer experience:** CLI muss super einfach sein, sonst wird es nicht genutzt
