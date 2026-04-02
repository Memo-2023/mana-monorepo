/**
 * Guest seed data for the Guides app.
 *
 * Three demo guides that showcase the app's capabilities:
 *   1. "Entwicklungsumgebung einrichten" — tech SOP (medium, 3 sections)
 *   2. "Perfekte Pasta kochen" — recipe (easy, flat steps)
 *   3. "Git-Grundlagen" — learning path guide (hard, sections)
 *
 * One demo collection: "Dev Setup Pfad" (path type)
 */

import type { LocalGuide, LocalSection, LocalStep, LocalCollection } from './local-store';

// ─── Guides ─────────────────────────────────────────────────

export const guestGuides: LocalGuide[] = [
	{
		id: 'guide-dev-setup',
		title: 'Entwicklungsumgebung einrichten',
		description: 'Node.js, Git und VS Code auf einem neuen Mac konfigurieren.',
		coverEmoji: '💻',
		coverColor: '#0d9488',
		category: 'Technik',
		difficulty: 'medium',
		estimatedMinutes: 45,
		tags: ['setup', 'mac', 'developer'],
		collectionId: 'col-dev',
		orderInCollection: 0,
	},
	{
		id: 'guide-pasta',
		title: 'Perfekte Pasta alla Norma',
		description: 'Klassisches sizilianisches Gericht mit Auberginen und Ricotta.',
		coverEmoji: '🍝',
		coverColor: '#f97316',
		category: 'Kochen',
		difficulty: 'easy',
		estimatedMinutes: 30,
		tags: ['italienisch', 'vegetarisch', 'pasta'],
	},
	{
		id: 'guide-git',
		title: 'Git-Grundlagen verstehen',
		description: 'Commits, Branches, Merges und Pull Requests — von Null auf solide Basis.',
		coverEmoji: '🌿',
		coverColor: '#8b5cf6',
		category: 'Technik',
		difficulty: 'hard',
		estimatedMinutes: 90,
		tags: ['git', 'versionskontrolle', 'developer'],
		collectionId: 'col-dev',
		orderInCollection: 1,
	},
];

// ─── Sections ───────────────────────────────────────────────

export const guestSections: LocalSection[] = [
	// Dev Setup sections
	{ id: 'sec-ds-1', guideId: 'guide-dev-setup', title: 'Homebrew & Basics', order: 0 },
	{ id: 'sec-ds-2', guideId: 'guide-dev-setup', title: 'Node.js & npm', order: 1 },
	{ id: 'sec-ds-3', guideId: 'guide-dev-setup', title: 'Git konfigurieren', order: 2 },

	// Git guide sections
	{ id: 'sec-git-1', guideId: 'guide-git', title: 'Repository & Commits', order: 0 },
	{ id: 'sec-git-2', guideId: 'guide-git', title: 'Branches & Merging', order: 1 },
	{ id: 'sec-git-3', guideId: 'guide-git', title: 'Remote & GitHub', order: 2 },
];

// ─── Steps ──────────────────────────────────────────────────

export const guestSteps: LocalStep[] = [
	// ── Dev Setup: Homebrew ──────────────────────────────────
	{
		id: 'step-ds-1',
		guideId: 'guide-dev-setup',
		sectionId: 'sec-ds-1',
		order: 0,
		title: 'Homebrew installieren',
		content:
			'Öffne das Terminal und führe folgenden Befehl aus:\n\n```bash\n/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"\n```',
		type: 'code',
		checkable: true,
	},
	{
		id: 'step-ds-2',
		guideId: 'guide-dev-setup',
		sectionId: 'sec-ds-1',
		order: 1,
		title: 'Installation prüfen',
		content: 'Führe `brew --version` aus. Du solltest eine Versionsnummer sehen.',
		type: 'checkpoint',
		checkable: true,
	},
	{
		id: 'step-ds-3',
		guideId: 'guide-dev-setup',
		sectionId: 'sec-ds-2',
		order: 0,
		title: 'Node.js via nvm installieren',
		content: '```bash\nbrew install nvm\nnvm install --lts\nnvm use --lts\n```',
		type: 'code',
		checkable: true,
	},
	{
		id: 'step-ds-4',
		guideId: 'guide-dev-setup',
		sectionId: 'sec-ds-2',
		order: 1,
		title: 'pnpm global installieren',
		content: '```bash\nnpm install -g pnpm\n```',
		type: 'instruction',
		checkable: true,
	},
	{
		id: 'step-ds-5',
		guideId: 'guide-dev-setup',
		sectionId: 'sec-ds-3',
		order: 0,
		title: 'Git-Identität setzen',
		content:
			'```bash\ngit config --global user.name "Dein Name"\ngit config --global user.email "dein@email.de"\n```',
		type: 'code',
		checkable: true,
	},
	{
		id: 'step-ds-6',
		guideId: 'guide-dev-setup',
		sectionId: 'sec-ds-3',
		order: 1,
		title: 'SSH-Key für GitHub erstellen',
		content:
			'```bash\nssh-keygen -t ed25519 -C "dein@email.de"\ncat ~/.ssh/id_ed25519.pub\n```\n\nKopiere den Output und füge ihn in GitHub unter Settings → SSH Keys ein.',
		type: 'tip',
		checkable: true,
	},

	// ── Pasta steps (no sections) ────────────────────────────
	{
		id: 'step-pasta-1',
		guideId: 'guide-pasta',
		order: 0,
		title: 'Auberginen salzen',
		content:
			'Auberginen in 1 cm Würfel schneiden, mit Salz bestreuen, 20 Minuten ziehen lassen. Dann abwaschen und trockentupfen.',
		type: 'instruction',
		checkable: true,
	},
	{
		id: 'step-pasta-2',
		guideId: 'guide-pasta',
		order: 1,
		title: 'Tomatensauce kochen',
		content:
			'Knoblauch in Olivenöl anschwitzen, Dosentomaten dazu, 15 Minuten köcheln lassen. Mit Salz, Pfeffer und Basilikum abschmecken.',
		type: 'instruction',
		checkable: true,
	},
	{
		id: 'step-pasta-3',
		guideId: 'guide-pasta',
		order: 2,
		title: 'Auberginen frittieren',
		content: 'Reichlich Olivenöl erhitzen (180°C), Auberginen goldbraun frittieren, auf Küchenpapier abtropfen lassen.',
		type: 'warning',
		checkable: true,
	},
	{
		id: 'step-pasta-4',
		guideId: 'guide-pasta',
		order: 3,
		title: 'Pasta al dente kochen',
		content: 'Rigatoni oder Penne in gut gesalzenem Wasser 1 Minute kürzer als Packungsanweisung kochen.',
		type: 'tip',
		checkable: true,
	},
	{
		id: 'step-pasta-5',
		guideId: 'guide-pasta',
		order: 4,
		title: 'Alles vereinen & servieren',
		content:
			'Pasta mit der Sauce vermengen, Auberginen darüber geben. Mit gesalzenem Ricotta und frischem Basilikum toppen.',
		type: 'checkpoint',
		checkable: false,
	},

	// ── Git sections ─────────────────────────────────────────
	{
		id: 'step-git-1',
		guideId: 'guide-git',
		sectionId: 'sec-git-1',
		order: 0,
		title: 'Repository initialisieren',
		content: '```bash\nmkdir mein-projekt && cd mein-projekt\ngit init\n```',
		type: 'code',
		checkable: true,
	},
	{
		id: 'step-git-2',
		guideId: 'guide-git',
		sectionId: 'sec-git-1',
		order: 1,
		title: 'Ersten Commit erstellen',
		content:
			'```bash\necho "# Mein Projekt" > README.md\ngit add README.md\ngit commit -m "feat: initial commit"\n```',
		type: 'code',
		checkable: true,
	},
	{
		id: 'step-git-3',
		guideId: 'guide-git',
		sectionId: 'sec-git-2',
		order: 0,
		title: 'Feature-Branch erstellen',
		content: '```bash\ngit checkout -b feature/mein-feature\n```',
		type: 'instruction',
		checkable: true,
	},
	{
		id: 'step-git-4',
		guideId: 'guide-git',
		sectionId: 'sec-git-3',
		order: 0,
		title: 'Remote hinzufügen & pushen',
		content:
			'```bash\ngit remote add origin git@github.com:user/repo.git\ngit push -u origin main\n```',
		type: 'code',
		checkable: true,
	},
];

// ─── Collections ────────────────────────────────────────────

export const guestCollections: LocalCollection[] = [
	{
		id: 'col-dev',
		title: 'Developer Starter Kit',
		description: 'Alles was du als neuer Entwickler einrichten und lernen musst.',
		coverEmoji: '🚀',
		coverColor: '#0d9488',
		type: 'path',
		guideOrder: ['guide-dev-setup', 'guide-git'],
	},
];
