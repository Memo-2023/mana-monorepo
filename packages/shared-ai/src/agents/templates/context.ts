import { AI_PROPOSABLE_TOOL_NAMES } from '../../policy/proposable-tools';
import type { AgentTemplate } from './types';
import type { AiPolicy } from '../../policy/types';

/**
 * Context agent — tries to learn as much as possible about the user by
 * asking questions + reading available context, then consolidates into
 * the Kontext-document. Everything is propose so the user curates their
 * own profile.
 */

const CONTEXT_POLICY: AiPolicy = {
	tools: Object.fromEntries(AI_PROPOSABLE_TOOL_NAMES.map((n) => [n, 'propose'])),
	defaultsByModule: {
		kontext: 'propose',
		notes: 'propose',
		goals: 'auto',
	},
	defaultForAi: 'propose',
};

export const contextTemplate: AgentTemplate = {
	id: 'context',
	label: 'Kontext-Agent',
	tagline: 'Lernt dich kennen, damit andere Agents besser arbeiten',
	description: `Der Agent fragt dich gezielt Fragen und destilliert die Antworten
in dein Kontext-Dokument. Andere Agents (Recherche, Today, …) lesen dieses
Dokument als Prompt-Zusatz — je besser es gepflegt ist, desto relevanter werden
ihre Vorschläge.

Was er tut:

1. Liest was schon in deinem Kontext + Notizen + Goals steht
2. Stellt gezielt Fragen zu Lücken ("Was treibt dich aktuell um?", "Welche Projekte liegen an?")
3. Verdichtet deine Antworten zu einem strukturierten Kontext-Update (als Vorschlag)

Alles läuft als Vorschlag — du bestätigst welche Version deines Profils gespeichert wird.`,
	category: 'context',
	color: '#D946EF',
	agent: {
		name: 'Kontext-Agent',
		avatar: '🧭',
		role: 'Lernt dich kennen und pflegt dein Kontext-Dokument',
		systemPrompt: `Du bist ein neugieriger aber respektvoller Kontext-Agent. Ziel: verdichte was der User von sich selbst preisgibt zu einem gut strukturierten Kontext-Dokument, das andere AI-Agents als Prompt-Input nutzen können.

Vorgehen:
1. Lies immer zuerst das existierende kontextDoc + die letzten 5 Notizen + Goals, bevor du Fragen stellst.
2. Frage pro Iteration höchstens 2-3 konkrete Fragen. Keine Massenbefragung.
3. Schlage beim Update des Kontext-Dokuments immer eine Diff-Ansicht vor — nie Full-Replace.
4. Respektiere Lücken: wenn der User etwas nicht teilen will, nimm das auf ("Thema nicht relevant für den Agent").
5. Schreibe das Kontext-Dokument auf Deutsch, in Ich-Form ("Ich bin…", "Mir ist wichtig…").

Struktur im Kontext-Dokument:
- # Wer ich bin (Rolle, Hintergrund)
- # Was mich umtreibt (aktuelle Projekte, Themen)
- # Wie ich arbeite (Arbeitsstil, Präferenzen)
- # Was ich lieber nicht teile (Opt-outs)`,
		memory: `# Kontext-Ziele

(Hier kannst du festhalten welche Aspekte von dir der Agent priorisieren soll —
z.B. "fokus auf berufliche Projekte, privat ist mir egal" oder "frag mich zu
meinen Hobbys" etc.)
`,
		policy: CONTEXT_POLICY,
		maxConcurrentMissions: 1,
	},
	scene: {
		name: 'Kontext',
		description: 'Dein Profil für alle anderen Agents',
		openApps: [
			{ appId: 'kontext', widthPx: 720 },
			{ appId: 'ai-missions', widthPx: 440 },
			{ appId: 'ai-workbench', widthPx: 440 },
		],
	},
	missions: [
		{
			title: 'Kontext verdichten',
			objective:
				'Lies was schon da ist, identifiziere Lücken, stelle 2-3 Fragen und schlage ein Kontext-Update vor.',
			conceptMarkdown: `# Kontext-Erkundung

Der Agent tickt wöchentlich und macht einen "Kontext-Check":

1. Was hat sich seit dem letzten Update geändert?
2. Welche Lücken sind noch im Profil?
3. 2-3 neue Fragen die der User beantworten kann (via Proposal-Inbox)

**Tipp:** Beantworte die Fragen einfach als Note-Antwort — der Agent liest sie
beim nächsten Tick.`,
			cadence: { kind: 'weekly', dayOfWeek: 0, atHour: 10 },
			startPaused: true,
		},
	],
};
