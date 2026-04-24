/**
 * Preset style definitions — the "ready-made" styles a user can pick from
 * in the briefing without having to train anything. Each preset ships with
 * a German + English description plus extracted principles so the prompt
 * builder can treat presets and custom-trained styles identically.
 *
 * Keeping presets in code (not in Dexie) means they're versioned with the
 * app, never need syncing, and can be edited in a PR. A user's "custom"
 * style is a row in `writingStyles`; a preset is referenced by its `id`
 * via `LocalDraft.styleId`. When a user "favourites" a preset we still
 * write a row (source='preset', presetId=<id>) so the picker can show it.
 */

import type { StyleExtractedPrinciples } from '../types';

export interface StylePreset {
	id: string;
	name: { de: string; en: string };
	description: { de: string; en: string };
	principles: StyleExtractedPrinciples;
}

const now = '2026-04-24T00:00:00.000Z';

export const STYLE_PRESETS: ReadonlyArray<StylePreset> = [
	{
		id: 'academic',
		name: { de: 'Akademisch', en: 'Academic' },
		description: {
			de: 'Dicht, passive Voice erlaubt, Zitate, Konjunktiv — für wissenschaftliche Texte.',
			en: 'Dense, passive voice allowed, citations, subjunctive — for scholarly prose.',
		},
		principles: {
			toneTraits: ['formal', 'precise', 'hedged'],
			sentenceLengthAvg: 28,
			vocabulary: ['furthermore', 'notwithstanding', 'consequently'],
			examples: [],
			rawAnalysis:
				'Passive constructions allowed. Qualifier-heavy ("it may be argued that…"). References by author + year. No contractions. No rhetorical questions.',
			extractedAt: now,
		},
	},
	{
		id: 'casual-blog',
		name: { de: 'Casual Blog', en: 'Casual blog' },
		description: {
			de: 'Du-Ansprache, kurze Absätze, rhetorische Fragen — persönlicher Blog-Ton.',
			en: 'Second-person, short paragraphs, rhetorical questions — personal blog voice.',
		},
		principles: {
			toneTraits: ['conversational', 'direct', 'warm'],
			sentenceLengthAvg: 16,
			examples: [],
			rawAnalysis:
				'Address the reader as "du" / "you". Contractions fine. 2–3-sentence paragraphs. Occasional rhetorical question to punctuate sections.',
			extractedAt: now,
		},
	},
	{
		id: 'linkedin',
		name: { de: 'LinkedIn-Post', en: 'LinkedIn post' },
		description: {
			de: 'Hook in Zeile 1, 1-Satz-Absätze, sparsamer Emoji-Einsatz, Call-to-Action am Ende.',
			en: 'Hook on line 1, one-sentence paragraphs, sparing emoji, CTA at the end.',
		},
		principles: {
			toneTraits: ['hook-first', 'confident', 'accessible'],
			sentenceLengthAvg: 12,
			examples: [],
			rawAnalysis:
				'Line 1 must hook. Short paragraphs (often one sentence each). Bullet-style mid-post lists are OK. End with a question or explicit CTA. Emoji only to structure, not decorate.',
			extractedAt: now,
		},
	},
	{
		id: 'twitter-thread',
		name: { de: 'Twitter/X-Thread', en: 'Twitter/X thread' },
		description: {
			de: 'Nummerierte Tweets ≤280 Zeichen, Cliffhanger zwischen den Posts.',
			en: 'Numbered tweets ≤280 chars, cliffhanger between posts.',
		},
		principles: {
			toneTraits: ['punchy', 'cliffhanger-driven'],
			sentenceLengthAvg: 10,
			examples: [],
			rawAnalysis:
				'Split into numbered tweets (1/, 2/, …). Every tweet ≤280 chars. Each tweet should reward a stop, and incentivise a continue. Open with a strong claim.',
			extractedAt: now,
		},
	},
	{
		id: 'hemingway',
		name: { de: 'Hemingway', en: 'Hemingway' },
		description: {
			de: 'Deklarativ, kurze Sätze, minimale Adjektive — nüchtern und klar.',
			en: 'Declarative, short sentences, minimal adjectives — lean and clear.',
		},
		principles: {
			toneTraits: ['declarative', 'lean', 'concrete'],
			sentenceLengthAvg: 9,
			examples: [],
			rawAnalysis:
				'Mostly simple declarative sentences. Adverbs used sparingly. Concrete nouns over abstract. No meta-commentary. Show, do not tell.',
			extractedAt: now,
		},
	},
	{
		id: 'news',
		name: { de: 'Nachrichtlich', en: 'Newswire' },
		description: {
			de: 'Inverted Pyramid, nüchtern, keine Meinung — wie eine Nachrichtenagentur.',
			en: 'Inverted pyramid, neutral, opinion-free — newswire style.',
		},
		principles: {
			toneTraits: ['neutral', 'factual', 'inverted-pyramid'],
			sentenceLengthAvg: 18,
			examples: [],
			rawAnalysis:
				'Lead with the 5 Ws. Most important fact first, background last. Attribute every claim. No first-person. No opinion.',
			extractedAt: now,
		},
	},
	{
		id: 'listicle',
		name: { de: 'Listicle', en: 'Listicle' },
		description: {
			de: 'Nummerierte Liste mit überspitzten Einleitungen — Buzzfeed-Format.',
			en: 'Numbered list with punchy intros — Buzzfeed-style.',
		},
		principles: {
			toneTraits: ['punchy', 'listicle-structured', 'irreverent'],
			sentenceLengthAvg: 14,
			examples: [],
			rawAnalysis:
				'Numbered headings (e.g. "1. The thing that changed everything"). 2–4 sentences per item. Short opener, strong closing sentence per item. OK to use surprise and hyperbole.',
			extractedAt: now,
		},
	},
	{
		id: 'pitch',
		name: { de: 'Pitch / Sales', en: 'Pitch / sales' },
		description: {
			de: 'Problem → Agitation → Solution — Verkaufstext mit klarer Struktur.',
			en: 'Problem → Agitation → Solution — sales writing with a clear arc.',
		},
		principles: {
			toneTraits: ['persuasive', 'outcome-focused'],
			sentenceLengthAvg: 15,
			examples: [],
			rawAnalysis:
				"Open with the reader's problem. Agitate (cost of inaction). Introduce solution. Close with specific next step. Short paragraphs, concrete benefits, social proof when available.",
			extractedAt: now,
		},
	},
	{
		id: 'memoir',
		name: { de: 'Memoir', en: 'Memoir' },
		description: {
			de: '1. Person, sensorisch, Szenen statt Zusammenfassungen — persönlicher Erinnerungsstil.',
			en: 'First-person, sensory, scenes over summary — personal memoir voice.',
		},
		principles: {
			toneTraits: ['introspective', 'sensory', 'scene-driven'],
			sentenceLengthAvg: 17,
			examples: [],
			rawAnalysis:
				'First-person throughout. Anchor in time + place + body. Prefer scenes ("It was the Tuesday after…") to summaries. Interior thought marked by rhythm change rather than italics.',
			extractedAt: now,
		},
	},
];

export function getStylePreset(id: string): StylePreset | undefined {
	return STYLE_PRESETS.find((p) => p.id === id);
}
