import { AI_PROPOSABLE_TOOL_NAMES } from '../../policy/proposable-tools';
import type { AgentTemplate } from './types';
import type { AiPolicy } from '../../policy/types';

/**
 * Research agent — gets a topic + sources, writes a note per source,
 * then summarizes into a report note. Biased toward propose for every
 * note write so the user reviews what gets stored.
 */

const RESEARCH_POLICY: AiPolicy = {
	tools: Object.fromEntries(AI_PROPOSABLE_TOOL_NAMES.map((n) => [n, 'propose'])),
	defaultsByModule: {
		notes: 'propose',
		// Read-only modules default to auto — the agent is allowed to
		// peek into kontext / goals without nagging the user.
		goals: 'auto',
		kontext: 'auto',
	},
	defaultForAi: 'propose',
};

export const researchTemplate: AgentTemplate = {
	id: 'research',
	label: 'Recherche-Agent',
	tagline: 'Liest Quellen, schreibt Notizen, destilliert einen Bericht',
	description: `Gib dem Agent ein Thema und eine Liste von Quellen-URLs. Er:

1. Liest jede Quelle einzeln
2. Schreibt pro Quelle eine strukturierte Notiz mit Kernaussagen + Zitaten
3. Fasst am Ende alle Notizen zu einem Gesamt-Bericht zusammen
4. Verlinkt im Bericht zurück auf die Quellen-Notizen

Jede Notiz wird als Vorschlag angelegt — du bestätigst was wirklich gespeichert wird.`,
	category: 'research',
	color: '#0EA5E9',
	agent: {
		name: 'Recherche-Agent',
		avatar: '🔍',
		role: 'Liest Quellen, schreibt Notizen, erstellt Gesamtberichte',
		systemPrompt: `Du bist ein systematischer Recherche-Agent. Deine Aufgabe ist Quellen in strukturierte Notizen zu verwandeln und diese dann zu einem Gesamtbericht zu destillieren.

Vorgehen:
1. Pro Quelle: schreibe eine Notiz mit Titel "Q: [Quelle]", Kerninhalt als 3-7 Bullet-Points, direkte Zitate in Blockquotes.
2. Verweise auf keine Quelle die du nicht wirklich gelesen hast. Erfinde nichts.
3. Für den Gesamtbericht: fasse die Notizen unter 3-5 Thesen zusammen, mit Cross-Links zurück auf die Quellen-Notizen.

Schreib deutsch, klar, ohne Marketing-Sprache.`,
		memory: `# Recherche-Richtlinien

(Hier kannst du festhalten wie du recherchiert haben willst — z.B. bevorzugte Sprache,
Zitier-Stil, Themengebiete die dich besonders interessieren, Quellen denen du vertraust.)
`,
		policy: RESEARCH_POLICY,
		maxConcurrentMissions: 1,
	},
	scene: {
		name: 'Recherche',
		description: 'Quellen lesen, Notizen schreiben, Berichte erstellen',
		openApps: [
			{ appId: 'notes', widthPx: 540 },
			{ appId: 'ai-missions', widthPx: 440 },
			{ appId: 'ai-workbench', widthPx: 440 },
			{ appId: 'news-research', widthPx: 540 },
		],
	},
	missions: [
		{
			title: 'Quellen-Recherche zu einem Thema',
			objective:
				'Lies die verlinkten Quellen, schreibe pro Quelle eine Notiz, erstelle am Ende einen Gesamt-Bericht.',
			conceptMarkdown: `# Recherche-Auftrag

Ersetze diesen Block mit:

- **Thema:** _worum geht es?_
- **Quellen:** _Liste von URLs oder Input-Notizen_
- **Fragestellung:** _was willst du am Ende wissen?_

Der Agent liest die Quellen sequentiell und schreibt pro Quelle eine Notiz (als
Vorschlag). Am Ende erstellt er einen Gesamtbericht der die Notizen zusammenfasst
und die Fragestellung beantwortet.`,
			cadence: { kind: 'manual' },
			startPaused: true,
		},
	],
};
