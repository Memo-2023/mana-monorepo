import { AI_PROPOSABLE_TOOL_NAMES } from '../../policy/proposable-tools';
import type { AgentTemplate } from './types';
import type { AiPolicy } from '../../policy/types';

/**
 * Today agent — daily poem about what happened on this calendar date in
 * history. Researches via the news-research module and saves the result
 * as a note. Designed as a lightweight "delight" agent; shows off the
 * autonomous-creative side of the system.
 */

const TODAY_POLICY: AiPolicy = {
	tools: Object.fromEntries(AI_PROPOSABLE_TOOL_NAMES.map((n) => [n, 'propose'])),
	defaultsByModule: {
		notes: 'propose',
		// The agent does plenty of reads; those are auto anyway under the
		// policy helper, but explicit here to make the intent clear.
		news: 'auto',
		kontext: 'auto',
	},
	defaultForAi: 'propose',
};

export const todayTemplate: AgentTemplate = {
	id: 'today',
	label: 'Today-Agent',
	tagline: 'Jeden Tag ein Gedicht über das was heute besonderes passierte',
	description: `Der Agent recherchiert täglich (morgens um 7 Uhr) was an diesem
Kalendertag in der Geschichte Besonderes passiert ist, und destilliert das zu
einem kleinen Gedicht — als Notiz in deinem Journal.

Ein "Delight-Agent" — hat keinen produktiven Zweck. Gedacht als tägliches Moment
der Reflexion und als Beispiel dafür dass AI nicht nur effizient sein muss.

Was er tut:

1. Ermittelt das heutige Datum
2. Recherchiert 3-5 historische Ereignisse dieses Tages (via Web-Research)
3. Wählt ein Thema das ihn (oder dich) inspiriert
4. Schreibt ein kurzes Gedicht (4-8 Zeilen, deutsch)
5. Schlägt eine Journal-Notiz vor mit Titel "Heute — [Datum]"`,
	category: 'today',
	color: '#F97316',
	agent: {
		name: 'Today-Agent',
		avatar: '🌅',
		role: 'Tägliches Gedicht über historische Ereignisse dieses Tages',
		systemPrompt: `Du bist der Today-Agent. Einziger Job: jeden Morgen ein kurzes Gedicht über etwas das an diesem Tag in der Geschichte passiert ist.

Regeln:
1. **Immer** zuerst per Web-Research "on this day [Datum]" oder "historische Ereignisse [Datum]" recherchieren.
2. Wähle EIN Ereignis — nicht fünf. Lieber ein kleines poetisches Detail als eine Liste.
3. Gedicht: 4-8 Zeilen, deutsch, **kein Reim-Zwang** (Reim nur wenn er natürlich kommt), freier Rhythmus ok.
4. Speichere als Proposal für eine Note — Titel "Heute — [YYYY-MM-DD] — [kurzes Thema]".
5. Kein Content-Warning nötig für historisch bekannte Themen (Kriege, Tode). Aber: behandle sie würdevoll, nicht ironisch.
6. **Kein Meta-Kommentar im Gedicht selbst** — kein "An diesem Tag vor 50 Jahren…". Direkt ins Bild.

Beispiel-Qualität: lieber ein kurzes, klares Bild als eine überladene Reim-Konstruktion.`,
		memory: `# Stilvorlieben

(Hier kannst du dem Agent sagen welchen Ton du magst — z.B. "eher melancholisch"
oder "mit Humor" oder "klassisch und streng".)
`,
		policy: TODAY_POLICY,
		maxConcurrentMissions: 1,
	},
	scene: {
		name: 'Today',
		description: 'Dein tägliches Gedicht',
		openApps: [
			{ appId: 'journal', widthPx: 540 },
			{ appId: 'ai-missions', widthPx: 440 },
			{ appId: 'ai-workbench', widthPx: 440 },
		],
	},
	missions: [
		{
			title: 'Tägliches Gedicht über heute',
			objective:
				'Recherchiere was an diesem Datum in der Geschichte passiert ist, wähle ein Thema, schreibe ein kurzes deutsches Gedicht, schlage eine Journal-Notiz vor.',
			conceptMarkdown: `# Today-Poem

**Cadence:** jeden Morgen um 7 Uhr.

**Ablauf jedes Runs:**
1. Web-Research: "on this day [Datum]" + deutschsprachige Quellen bevorzugt
2. Pick: ein Ereignis, ein Detail, ein Bild
3. Write: 4-8 Zeilen freies Gedicht
4. Propose: neue Journal-Notiz mit Titel "Heute — [Datum] — [Thema]"

Der Agent soll **nicht** jeden Tag eine Zusammenfassung produzieren — sondern einen
kleinen poetischen Moment. Wenn er nichts findet das ihn inspiriert, darf er das
auch sagen ("heute fiel mir nichts ein").`,
			cadence: { kind: 'daily', atHour: 7, atMinute: 0 },
			startPaused: true,
		},
	],
};
