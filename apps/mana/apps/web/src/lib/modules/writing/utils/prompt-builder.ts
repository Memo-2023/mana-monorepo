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
}

/**
 * Build a system + user prompt for a fresh draft. M3 shape — referenced
 * inputs (articles / notes / library) are NOT injected yet; that's M5.
 * The system prompt forbids preamble / sign-off / meta commentary so
 * the returned text is ready to paste into a version.
 */
export function buildDraftPrompt(input: BuildDraftPromptInput): PromptPair {
	const { kind, title, briefing, stylePreset, styleExtracted } = input;
	const lang = languageLabel(briefing.language);
	const kindLbl = kindLabel(kind);

	const systemLines: string[] = [
		`Du bist ein professioneller Ghostwriter. Deine Aufgabe: Schreibe einen fertigen ${kindLbl} auf ${lang} basierend auf dem Briefing des Nutzers.`,
		`Gib ausschließlich den fertigen Text zurück. Keine Einleitung, keine Metakommentare, kein "Hier ist dein Text", keine Abschlussphrase nach dem Text. Markdown ist erlaubt, aber nicht erzwungen.`,
	];
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
