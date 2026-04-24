import { AI_PROPOSABLE_TOOL_NAMES } from '../../policy/proposable-tools';
import type { AgentTemplate } from './types';
import type { AiPolicy } from '../../policy/types';

/**
 * Comic-Autor — turns the user's text artifacts (journal entries,
 * notes, library reviews) into short illustrated comics via the
 * comic module's panel-generation pipeline.
 *
 * Why propose on every write:
 *   Each `comic.generatePanel` call consumes credits (3–25 each, 10
 *   for the medium default). A mis-reading of the source text or an
 *   over-generous panel count would burn spend fast. Propose-on-write
 *   forces the user to approve the Panel[] suggestion list before any
 *   picture.images row lands.
 *
 * Reads (journal/notes/library + comic.listStories) stay auto — the
 * agent may freely peek at existing content to pick which entry to
 * illustrate or which story to append to, without nagging the user.
 *
 * Tools this template uses:
 *   - journal.list* (read)        — browse source entries
 *   - notes.list* (read)          — browse source notes
 *   - library.list* (read)        — browse reviews
 *   - comic.listStories (read)    — find an existing story to extend
 *   - comic.createStory (propose) — start a new comic
 *   - comic.generatePanel (propose) — render a single panel (credits!)
 *   - comic.reorderPanels (propose) — rearrange existing panels
 *
 * The comic.* tools live in mana-tool-registry (MCP) and are NOT
 * part of AI_TOOL_CATALOG — they're reachable from persona-runner
 * and external MCP clients (Claude Desktop). The foreground webapp
 * runner will pick them up when the comic module gains its
 * AI_TOOL_CATALOG entries in a later step; until then this template
 * is primarily useful on the persona-runner side.
 */

// Per-tool propose policy. Start from every proposable tool in the
// AI catalog (same seed as the Recherche-Agent) so cross-module
// writes this template doesn't anticipate (`create_note` for a
// sidecar summary note, etc.) still land as proposals.
const COMIC_AUTHOR_POLICY: AiPolicy = {
	tools: {
		...Object.fromEntries(AI_PROPOSABLE_TOOL_NAMES.map((n) => [n, 'propose' as const])),
		// Web-app catalog names (snake_case). The spread above already
		// covers create_comic_story / generate_comic_panel because both
		// are defaultPolicy='propose' in AI_TOOL_CATALOG, but we pin
		// list_comic_stories explicitly as auto (read-only tools come
		// from the catalog as 'auto' already, so this is defensive
		// rather than strictly required).
		list_comic_stories: 'auto',
		create_comic_story: 'propose',
		generate_comic_panel: 'propose',
		// MCP-registry names (dot-case). The agent uses these when
		// running inside persona-runner / Claude Desktop where the
		// mana-tool-registry surface is what the MCP client sees.
		// Listing them keeps the policy intent consistent across both
		// surfaces (foreground runner + MCP).
		'comic.listStories': 'auto',
		'comic.createStory': 'propose',
		'comic.generatePanel': 'propose',
		'comic.reorderPanels': 'propose',
	},
	defaultsByModule: {
		// Read-only companions the agent uses to find source material.
		journal: 'auto',
		notes: 'auto',
		library: 'auto',
		// Kontext + goals are referenced as standing context the
		// planner already auto-injects; keep them auto so the agent can
		// skim them for tonal cues (is the user in a serious phase, is
		// there a goal the comic should celebrate).
		kontext: 'auto',
		goals: 'auto',
		// Every comic write requires approval.
		comic: 'propose',
	},
	defaultForAi: 'propose',
};

export const comicAuthorTemplate: AgentTemplate = {
	id: 'comic-author',
	version: '1',
	icon: '🎨',
	label: 'Comic-Autor',
	tagline: 'Verwandelt Tagebuch-Einträge und Notizen in kurze Comics',
	description: `Gib dem Agent einen Tagebuch-Eintrag, eine Notiz oder ein Review aus deiner Bibliothek — er schlägt daraus einen kurzen Comic vor:

1. Liest den gewählten Text
2. Schlägt 4 Panels vor (Prompt + Caption + Dialog pro Panel)
3. Du bestätigst die Liste, optional mit Edits
4. Jedes Panel wird via gpt-image-2 gerendert und an die Story angehängt

Jeder Generate-Schritt ist ein Vorschlag — du bestimmst, wann Credits fließen. Für 4 Panels mit Default-Qualität: 4 × 10 = 40 Credits.`,
	category: 'ai',
	color: '#F97316',
	agent: {
		name: 'Comic-Autor',
		avatar: '🎨',
		role: 'Macht aus Text kurze Comics',
		systemPrompt: `Du bist Comic-Autor. Wenn der User dir einen Moment, ein Erlebnis oder eine Idee gibt, verwandelst du das in einen kurzen Comic.

Vorgehen:
1. Lies den Ausgangstext zu Ende, bevor du mit Panels anfängst — Details aus der Mitte oder dem Ende sind oft der Kern.
2. Wähle einen Stil, der zum Ton passt: 'comic' für Humor/Alltag, 'manga' für Drama, 'cartoon' für Kinder/Leichtigkeit, 'graphic-novel' für Reflexion/Melancholie, 'webtoon' für vertikale Long-Reads.
3. Schlage 4 Panels vor (2–6 je nach Textlänge). Jedes Panel hat:
   - prompt: was passiert bildlich (kurze englische Sätze, Komposition + Aktion + Stimmung)
   - caption (optional): kurze Erzählzeile über/unter dem Bild
   - dialogue (optional): was der Protagonist sagt, in Sprechblase
4. Protagonist ist IMMER der User selbst (seine face-ref liegt schon in der Story).
5. Kein Panel-Nummerieren, keine Meta-Kommentare, keine Style-Beschreibungen im Prompt (Stil kommt aus der Story).

Ton:
- Humor wenn der User es leicht nimmt, ernst wenn er es ernst nimmt. Nicht belehrend.
- Niemals urteilen über das was der User erlebt hat.
- Deutsch als Sprache in Captions/Dialogen ist ok; englische Text-Prompts rendern aber stabiler.

Tools:
- journal.listEntries / notes.list / library.listEntries um Quelle zu finden
- comic.listStories um bestehende Stories zu sehen (nicht jede Quelle braucht eine neue)
- comic.createStory um eine Story anzulegen (Titel + Stil + characterMediaIds)
- comic.generatePanel um einen Panel anzuhängen (teurer Call — nur nach Bestätigung)`,
		memory: `# Comic-Richtlinien

(Hier kannst du festhalten wie du Comics magst — z.B. bevorzugter Stil,
Panel-Anzahl, wieviel Dialog vs. Caption, Tabu-Themen die nie vorkommen sollen.)
`,
		policy: COMIC_AUTHOR_POLICY,
		maxConcurrentMissions: 1,
	},
	scene: {
		name: 'Comic-Werkstatt',
		description: 'Texte lesen, Panels vorschlagen, Comic-Stories bauen',
		openApps: [
			{ appId: 'comic', widthPx: 540 },
			{ appId: 'journal', widthPx: 440 },
			{ appId: 'ai-missions', widthPx: 360 },
			{ appId: 'ai-workbench', widthPx: 360 },
		],
	},
	missions: [
		{
			title: 'Comic aus einem Tagebuch-Eintrag',
			objective:
				'Wähle einen Tagebuch-Eintrag, schlage Titel + Stil vor, und generiere eine Panel-Folge (Default 4). Jeder Generate-Schritt ist ein Vorschlag.',
			conceptMarkdown: `# Comic-Auftrag

Ersetze diesen Block mit:

- **Eintrag:** _Link auf den Tagebuch-Eintrag (oder Zitat daraus)_
- **Stil:** _comic / manga / cartoon / graphic-novel / webtoon — oder leer lassen, damit der Agent vorschlägt_
- **Panels:** _2-8, default 4_
- **Ton:** _frei — "leicht und selbstironisch" / "ernst und reflektiert" / "melancholisch"_

Der Agent liest den Eintrag, legt eine neue Comic-Story an (als Vorschlag),
schlägt die Panel-Folge vor, und rendert die Panels einzeln nach deiner
Bestätigung.`,
			cadence: { kind: 'manual' },
			startPaused: true,
		},
	],
};
