import { AI_PROPOSABLE_TOOL_NAMES } from '../../policy/proposable-tools';
import type { AgentTemplate } from './types';
import type { AiPolicy } from '../../policy/types';

/**
 * Event-Scout agent — discovers public events in the user's configured
 * regions and suggests the most relevant ones. Runs daily or on-demand.
 *
 * discover_events is auto (read-only, feeds context to the planner).
 * suggest_event is propose (creates a proposal the user must approve).
 */

const EVENT_SCOUT_POLICY: AiPolicy = {
	tools: {
		...Object.fromEntries(AI_PROPOSABLE_TOOL_NAMES.map((n) => [n, 'deny' as const])),
		discover_events: 'auto',
		suggest_event: 'propose',
	},
	defaultsByModule: {
		events: 'propose',
	},
	defaultForAi: 'deny',
};

export const eventScoutTemplate: AgentTemplate = {
	id: 'event-scout',
	version: '1',
	icon: '🎪',
	label: 'Event-Scout',
	tagline: 'Findet Events in deiner Region und schlaegt passende vor',
	description: `Der Event-Scout durchsucht deine konfigurierten Regionen nach oeffentlichen Veranstaltungen und schlaegt dir die relevantesten vor.

Voraussetzung: Richte mindestens eine Region und Interessen im Events-Modul unter "Entdecken" ein.

Der Agent:
1. Liest deine Event-Discovery-Feeds (automatisch, ohne Nachfrage)
2. Waehlt die 3-5 relevantesten Events aus
3. Schlaegt sie dir als Proposals vor — du entscheidest was in deinen Kalender kommt`,
	category: 'ai',
	color: '#8B5CF6',
	agent: {
		name: 'Event-Scout',
		avatar: '🎪',
		role: 'Findet oeffentliche Events in deinen Regionen und schlaegt passende vor',
		systemPrompt: `Du bist ein Event-Scout. Deine Aufgabe ist es, relevante oeffentliche Veranstaltungen in den Regionen des Nutzers zu finden und die besten vorzuschlagen.

Vorgehen:
1. Nutze discover_events um die aktuellen Events in den Regionen des Nutzers abzurufen.
2. Bewerte die Events nach Relevanz: Passen sie zu den Interessen? Sind sie zeitlich nah? Besonders interessant?
3. Waehle die 3-5 besten Events aus.
4. Nutze suggest_event fuer jedes ausgewaehlte Event. Gib eine kurze Begruendung warum es relevant ist.

Qualitaetskriterien:
- Bevorzuge Events die zeitlich nah sind (naechste 7 Tage > naechste 14 Tage)
- Bevorzuge Events die zu den Interessen des Nutzers passen
- Variiere die Kategorien — nicht 5x das gleiche Genre
- Schreib die Begruendung auf Deutsch, kurz und konkret`,
		memory: `# Event-Scout Einstellungen

(Hier kannst du festhalten welche Art von Events dich besonders interessiert,
welche du lieber nicht vorgeschlagen bekommst, bevorzugte Wochentage etc.)
`,
		policy: EVENT_SCOUT_POLICY,
		maxConcurrentMissions: 1,
	},
	scene: {
		name: 'Event-Entdeckung',
		description: 'Events finden und vorschlagen',
		openApps: [
			{ appId: 'events', widthPx: 540 },
			{ appId: 'ai-missions', widthPx: 440 },
			{ appId: 'calendar', widthPx: 440 },
		],
	},
	missions: [
		{
			title: 'Events der Woche',
			objective:
				'Pruefe neue Events in meinen Regionen. Schlage die 3-5 relevantesten vor, die ich noch nicht gesehen habe. Begruende warum jedes Event fuer mich interessant sein koennte.',
			conceptMarkdown: `# Woechentlicher Event-Check

Der Event-Scout prueft die konfigurierten Regionen auf neue Veranstaltungen
und schlaegt die relevantesten vor. Jeder Vorschlag erscheint als Proposal —
du entscheidest was in deinen Kalender kommt.

**Voraussetzung:** Mindestens eine Region und Interessen muessen im Events-Modul
unter dem Tab "Entdecken" eingerichtet sein.`,
			cadence: { kind: 'daily', atHour: 8, atMinute: 0 },
			startPaused: true,
		},
	],
};
