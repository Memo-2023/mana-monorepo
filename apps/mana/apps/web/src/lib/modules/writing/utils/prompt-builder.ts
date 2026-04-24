/**
 * Prompt builder — turns a briefing (+ optional style) into a system/user
 * prompt pair for mana-llm. Deliberately pure and client-side: everything
 * that goes into the prompt is already decrypted in the store and the
 * API endpoint is a thin passthrough, so building the prompt here keeps
 * all the taste-and-tone decisions visible to the user.
 *
 * References (M5+) will extend `buildDraftPrompt` with resolved input
 * snippets. Selection-refinement prompts (M6) live as their own builders
 * alongside this one.
 */

import { KIND_LABELS } from '../constants';
import type { DraftBriefing, DraftKind, StyleExtractedPrinciples } from '../types';
import type { StylePreset } from '../presets/styles';
import type { ResolvedReference } from './reference-resolver';

export interface PromptPair {
	system: string;
	user: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
	de: 'Deutsch',
	en: 'English',
	fr: 'Français',
	es: 'Español',
	it: 'Italiano',
};

function languageLabel(code: string): string {
	return LANGUAGE_LABELS[code] ?? code;
}

function kindLabel(kind: DraftKind): string {
	const de = KIND_LABELS[kind].de;
	// Drop pluralising 's' / use singular voice for the prompt.
	if (kind === 'blog') return 'Blogpost';
	if (kind === 'essay') return 'Essay';
	if (kind === 'email') return 'E-Mail';
	if (kind === 'social') return 'Social-Media-Post';
	if (kind === 'story') return 'Kurzgeschichte';
	if (kind === 'letter') return 'Brief';
	if (kind === 'speech') return 'Rede';
	if (kind === 'cover-letter') return 'Bewerbungsanschreiben';
	if (kind === 'product-description') return 'Produktbeschreibung';
	if (kind === 'press-release') return 'Pressemitteilung';
	if (kind === 'bio') return 'Bio / Kurzvita';
	return de;
}

function renderStyle(
	preset: StylePreset | undefined,
	principles: StyleExtractedPrinciples | undefined
): string | null {
	if (preset) {
		const lines: string[] = [`Stil: ${preset.name.de}. ${preset.description.de}`];
		if (preset.principles.rawAnalysis) {
			lines.push(`Stil-Richtlinien: ${preset.principles.rawAnalysis}`);
		}
		if (preset.principles.toneTraits.length) {
			lines.push(`Ton: ${preset.principles.toneTraits.join(', ')}.`);
		}
		return lines.join('\n');
	}
	if (principles) {
		const lines: string[] = [];
		if (principles.rawAnalysis) lines.push(`Stil: ${principles.rawAnalysis}`);
		if (principles.toneTraits.length) lines.push(`Ton: ${principles.toneTraits.join(', ')}.`);
		if (principles.vocabulary?.length)
			lines.push(`Bevorzugtes Vokabular: ${principles.vocabulary.join(', ')}.`);
		return lines.length ? lines.join('\n') : null;
	}
	return null;
}

export interface BuildDraftPromptInput {
	kind: DraftKind;
	title: string;
	briefing: DraftBriefing;
	stylePreset?: StylePreset;
	styleExtracted?: StyleExtractedPrinciples;
	/**
	 * Resolved references (M5). Already trimmed to the aggregate budget
	 * by resolveReferences(); the builder only formats them into the
	 * user-message "Quellen" block.
	 */
	resolvedReferences?: ResolvedReference[];
}

/**
 * Format resolved references as a "Quellen" block appended to the user
 * message. Empty content (e.g. plain URLs without a saved article) still
 * gets a line so the model knows the pointer exists; user notes are
 * prefixed with "Kontext:" so they read as guidance, not body text.
 */
function renderReferencesBlock(refs: ResolvedReference[]): string {
	if (refs.length === 0) return '';
	const blocks = refs.map((ref, idx) => {
		const head = `[Quelle ${idx + 1}] ${ref.sourceLabel}`;
		const noteLine = ref.note ? `Kontext: ${ref.note}` : '';
		const body = ref.content ? `\n${ref.content}` : '';
		return [head, noteLine, body].filter(Boolean).join('\n');
	});
	return [
		'',
		'--- Quellen (vom Nutzer verknüpft) ---',
		blocks.join('\n\n'),
		'--- Ende Quellen ---',
	].join('\n');
}

/**
 * Build a system + user prompt for a fresh draft. M3 shape — referenced
 * inputs (articles / notes / library) are NOT injected yet; that's M5.
 * The system prompt forbids preamble / sign-off / meta commentary so
 * the returned text is ready to paste into a version.
 */
export function buildDraftPrompt(input: BuildDraftPromptInput): PromptPair {
	const { kind, title, briefing, stylePreset, styleExtracted, resolvedReferences } = input;
	const lang = languageLabel(briefing.language);
	const kindLbl = kindLabel(kind);
	const refs = resolvedReferences ?? [];

	const systemLines: string[] = [
		`Du bist ein professioneller Ghostwriter. Deine Aufgabe: Schreibe einen fertigen ${kindLbl} auf ${lang} basierend auf dem Briefing des Nutzers.`,
		`Gib ausschließlich den fertigen Text zurück. Keine Einleitung, keine Metakommentare, kein "Hier ist dein Text", keine Abschlussphrase nach dem Text. Markdown ist erlaubt, aber nicht erzwungen.`,
	];
	if (refs.length > 0) {
		systemLines.push(
			`Der Nutzer hat ${refs.length} Quelle${refs.length === 1 ? '' : 'n'} verknüpft. Ziehe Aussagen, Zahlen, Beispiele und Haltungen aus diesen Quellen heran, wenn sie zum Briefing passen. Erfinde keine Fakten; wenn eine Quelle nichts Passendes hergibt, lass sie weg. Paraphrasiere — kein wörtliches Zitieren ohne Anführungszeichen.`
		);
	}
	const styleBlock = renderStyle(stylePreset, styleExtracted);
	if (styleBlock) systemLines.push(styleBlock);

	const userLines: string[] = [];
	userLines.push(`Titel: ${title}`);
	userLines.push(`Thema: ${briefing.topic}`);
	if (briefing.audience) userLines.push(`Zielgruppe: ${briefing.audience}`);
	if (briefing.tone) userLines.push(`Ton: ${briefing.tone}`);
	if (briefing.targetLength) {
		const { type, value } = briefing.targetLength;
		const unitLabel = type === 'words' ? 'Wörter' : type === 'chars' ? 'Zeichen' : 'Minuten';
		userLines.push(`Ziel-Länge: ca. ${value} ${unitLabel}`);
	}
	if (briefing.extraInstructions) {
		userLines.push(`Zusätzliche Hinweise: ${briefing.extraInstructions}`);
	}
	const referencesBlock = renderReferencesBlock(refs);
	if (referencesBlock) userLines.push(referencesBlock);
	userLines.push('');
	userLines.push(`Schreibe den ${kindLbl} jetzt.`);

	return {
		system: systemLines.join('\n\n'),
		user: userLines.join('\n'),
	};
}

/**
 * Rough max-tokens heuristic — 2x target words + buffer, clamped to 8000.
 * Words-to-tokens ratio of ~1.5 for German and English; 2x leaves room.
 */
export function estimateMaxTokens(briefing: DraftBriefing): number {
	const target = briefing.targetLength?.value ?? 500;
	const unit = briefing.targetLength?.type ?? 'words';
	const words = unit === 'words' ? target : unit === 'chars' ? target / 5 : target * 150;
	return Math.min(8000, Math.max(256, Math.round(words * 2 + 200)));
}

// ─── Selection-refinement prompts (M6) ───────────────────

/**
 * Optional style hint appended to selection-refinement prompts so the
 * replacement doesn't drift away from the draft's overall voice. We pass
 * the raw principles description rather than re-instantiating the whole
 * system prompt because the selection prompt has different guardrails
 * (never add preamble, never explain, just return the replacement).
 */
function styleHintBlock(
	stylePreset: StylePreset | undefined,
	styleExtracted: StyleExtractedPrinciples | undefined
): string | null {
	if (stylePreset) {
		return `Stil-Kontext: ${stylePreset.name.de}. ${stylePreset.principles.rawAnalysis ?? ''}`.trim();
	}
	if (styleExtracted?.rawAnalysis) {
		return `Stil-Kontext: ${styleExtracted.rawAnalysis}`;
	}
	return null;
}

export interface SelectionContext {
	selectionText: string;
	language: string;
	stylePreset?: StylePreset;
	styleExtracted?: StyleExtractedPrinciples;
}

const SELECTION_SYSTEM_TAIL =
	'Gib ausschließlich die neue Version des Ausschnitts zurück — kein Präfix wie "Hier ist…", keine Anführungszeichen, keine Erklärung davor oder danach. Nur der Ersatztext.';

function fenceSelection(selection: string): string {
	return `---\n${selection}\n---`;
}

function selectionPrompt(
	ctx: SelectionContext,
	systemHead: string,
	userInstruction: string
): PromptPair {
	const systemLines = [systemHead, SELECTION_SYSTEM_TAIL];
	const styleBlock = styleHintBlock(ctx.stylePreset, ctx.styleExtracted);
	if (styleBlock) systemLines.push(styleBlock);
	const userLines = [
		userInstruction,
		`Sprache: ${languageLabel(ctx.language)}.`,
		'',
		fenceSelection(ctx.selectionText),
	];
	return {
		system: systemLines.join('\n\n'),
		user: userLines.join('\n'),
	};
}

export function buildShortenPrompt(ctx: SelectionContext): PromptPair {
	return selectionPrompt(
		ctx,
		'Du kürzt Textpassagen. Behalte den Kerngedanken und den Ton bei, entferne nur Redundanzen, Füllwörter und Nebensätze.',
		'Kürze den folgenden Ausschnitt deutlich (ziel: ~50–60% der ursprünglichen Länge).'
	);
}

export function buildExpandPrompt(ctx: SelectionContext): PromptPair {
	return selectionPrompt(
		ctx,
		'Du erweiterst Textpassagen mit zusätzlichem Detail, Beispielen oder Nuancen, ohne den Ton zu verlieren.',
		'Erweitere den folgenden Ausschnitt deutlich (ziel: ~150–180% der ursprünglichen Länge). Füge Details, Beispiele oder weiterführende Gedanken hinzu, bleib aber beim Thema.'
	);
}

export interface ChangeToneParams {
	targetTone: string;
}

export function buildChangeTonePrompt(ctx: SelectionContext, params: ChangeToneParams): PromptPair {
	return selectionPrompt(
		ctx,
		'Du schreibst Textpassagen im angegebenen Ton um, ohne den Inhalt zu verändern.',
		`Schreibe den folgenden Ausschnitt im Ton "${params.targetTone}" um. Behalte den Sinn und die Länge grob bei, passe nur Wortwahl, Satzbau und Haltung an den neuen Ton an.`
	);
}

export interface RewriteParams {
	instruction: string;
}

export function buildRewritePrompt(ctx: SelectionContext, params: RewriteParams): PromptPair {
	return selectionPrompt(
		ctx,
		'Du schreibst Textpassagen nach der Anweisung des Nutzers um.',
		`Schreibe den folgenden Ausschnitt gemäß dieser Anweisung um: ${params.instruction}`
	);
}

export interface TranslateParams {
	targetLanguage: string;
}

export function buildTranslatePrompt(ctx: SelectionContext, params: TranslateParams): PromptPair {
	const targetLabel = languageLabel(params.targetLanguage);
	// Translate overrides the usual "keep source language" rule; build a
	// lean pair that doesn't contradict itself.
	return {
		system: [
			'Du übersetzt Textpassagen. Behalte Ton und Struktur des Originals bei. Behalte Eigennamen und technische Begriffe unverändert, außer sie haben eine etablierte Entsprechung.',
			SELECTION_SYSTEM_TAIL,
		].join('\n\n'),
		user: [
			`Übersetze den folgenden Ausschnitt nach ${targetLabel}.`,
			'',
			fenceSelection(ctx.selectionText),
		].join('\n'),
	};
}
