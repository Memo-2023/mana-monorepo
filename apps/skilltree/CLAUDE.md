# SkillTree

Gamified personal skill tracking app - like an RPG skill tree for real life.

## Overview

Track your skills, earn XP through activities, and level up your abilities across different life domains.

## Tech Stack

- **Web**: SvelteKit + Svelte 5 + Tailwind CSS
- **Storage**: IndexedDB (offline-first, no backend needed)
- **State**: Svelte 5 runes (`$state`, `$derived`)

## Development

```bash
# Start development server (port 5195)
pnpm dev:web

# Or from monorepo root
pnpm --filter @skilltree/web dev
```

## Project Structure

```
apps/skilltree/
├── apps/
│   └── web/                 # SvelteKit web app
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/  # UI components
│       │   │   ├── services/    # IndexedDB storage
│       │   │   ├── stores/      # Svelte 5 reactive stores
│       │   │   └── types/       # TypeScript types
│       │   └── routes/          # SvelteKit routes
│       └── static/              # Static assets
└── package.json
```

## Features

### MVP (Current)

- [x] Skill creation with name, description, and branch
- [x] Six skill branches: Intellect, Body, Creativity, Social, Practical, Mindset
- [x] XP system with 6 levels (0-5)
- [x] Activity logging with XP rewards
- [x] Stats overview (total XP, skills, highest level, streak)
- [x] Offline-first with IndexedDB
- [x] Branch filtering
- [x] Recent activities feed

### Planned

- [ ] Skill editing
- [ ] Skill tree visualization (graph view)
- [ ] Skill dependencies/prerequisites
- [ ] Achievements/badges
- [ ] Data export/import
- [ ] Cloud sync (optional)

## Data Model

### Skill
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  branch: SkillBranch;
  parentId: string | null;
  icon: string;
  color: string | null;
  currentXp: number;
  totalXp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}
```

### Levels

| Level | Name          | XP Required |
|-------|---------------|-------------|
| 0     | Unbekannt     | 0           |
| 1     | Anfänger      | 100         |
| 2     | Fortgeschritten | 500       |
| 3     | Kompetent     | 1,500       |
| 4     | Experte       | 4,000       |
| 5     | Meister       | 10,000      |

## Branches

| Branch     | Icon      | Color   | Description                    |
|------------|-----------|---------|--------------------------------|
| Intellect  | brain     | blue    | Knowledge, languages, science  |
| Body       | dumbbell  | red     | Fitness, sports, health        |
| Creativity | palette   | pink    | Art, music, writing            |
| Social     | users     | purple  | Communication, leadership      |
| Practical  | wrench    | orange  | Crafts, cooking, tech          |
| Mindset    | heart     | emerald | Meditation, focus, resilience  |
