import type { DraftKind, DraftStatus, GenerationStatus, StyleSource } from './types';

export const KIND_LABELS: Record<DraftKind, { de: string; en: string; emoji: string }> = {
	blog: { de: 'Blog', en: 'Blog', emoji: '📝' },
	essay: { de: 'Essay', en: 'Essay', emoji: '📄' },
	email: { de: 'E-Mail', en: 'Email', emoji: '✉️' },
	social: { de: 'Social', en: 'Social', emoji: '💬' },
	story: { de: 'Story', en: 'Story', emoji: '📖' },
	letter: { de: 'Brief', en: 'Letter', emoji: '💌' },
	speech: { de: 'Rede', en: 'Speech', emoji: '🎤' },
	'cover-letter': { de: 'Bewerbung', en: 'Cover letter', emoji: '💼' },
	'product-description': { de: 'Produkttext', en: 'Product', emoji: '🛍️' },
	'press-release': { de: 'Pressetext', en: 'Press', emoji: '📰' },
	bio: { de: 'Bio', en: 'Bio', emoji: '👤' },
	other: { de: 'Sonstiges', en: 'Other', emoji: '✏️' },
};

export const STATUS_LABELS: Record<DraftStatus, { de: string; en: string }> = {
	draft: { de: 'Entwurf', en: 'Draft' },
	refining: { de: 'In Überarbeitung', en: 'Refining' },
	complete: { de: 'Fertig', en: 'Complete' },
	published: { de: 'Veröffentlicht', en: 'Published' },
};

export const STATUS_COLORS: Record<DraftStatus, string> = {
	draft: '#64748b',
	refining: '#3b82f6',
	complete: '#22c55e',
	published: '#a855f7',
};

export const GENERATION_STATUS_LABELS: Record<GenerationStatus, { de: string; en: string }> = {
	queued: { de: 'In Warteschlange', en: 'Queued' },
	running: { de: 'Läuft', en: 'Running' },
	succeeded: { de: 'Fertig', en: 'Succeeded' },
	failed: { de: 'Fehlgeschlagen', en: 'Failed' },
	cancelled: { de: 'Abgebrochen', en: 'Cancelled' },
};

export const STYLE_SOURCE_LABELS: Record<StyleSource, { de: string; en: string }> = {
	preset: { de: 'Vorlage', en: 'Preset' },
	'custom-description': { de: 'Eigene Beschreibung', en: 'Custom description' },
	'sample-trained': { de: 'Aus Textproben trainiert', en: 'Trained from samples' },
	'self-trained': { de: 'Schreibe wie ich', en: 'Write like me' },
};

/** Default word-count targets per kind — used in briefing defaults. */
export const LENGTH_PRESETS: Record<DraftKind, { type: 'words'; value: number }> = {
	blog: { type: 'words', value: 800 },
	essay: { type: 'words', value: 1500 },
	email: { type: 'words', value: 180 },
	social: { type: 'words', value: 80 },
	story: { type: 'words', value: 1200 },
	letter: { type: 'words', value: 350 },
	speech: { type: 'words', value: 600 },
	'cover-letter': { type: 'words', value: 400 },
	'product-description': { type: 'words', value: 220 },
	'press-release': { type: 'words', value: 450 },
	bio: { type: 'words', value: 120 },
	other: { type: 'words', value: 500 },
};

export const TONE_PRESETS: ReadonlyArray<{ id: string; de: string; en: string }> = [
	{ id: 'neutral', de: 'Neutral', en: 'Neutral' },
	{ id: 'warm', de: 'Warm', en: 'Warm' },
	{ id: 'formal', de: 'Formell', en: 'Formal' },
	{ id: 'casual', de: 'Locker', en: 'Casual' },
	{ id: 'professional', de: 'Professionell', en: 'Professional' },
	{ id: 'playful', de: 'Verspielt', en: 'Playful' },
	{ id: 'urgent', de: 'Dringlich', en: 'Urgent' },
	{ id: 'empathetic', de: 'Einfühlsam', en: 'Empathetic' },
	{ id: 'assertive', de: 'Selbstbewusst', en: 'Assertive' },
	{ id: 'humorous', de: 'Humorvoll', en: 'Humorous' },
];

export const DEFAULT_LANGUAGE = 'de';

/** Kinds for which the runner should produce an outline before the full draft. */
export const AUTO_OUTLINE_KINDS: ReadonlyArray<DraftKind> = [
	'blog',
	'essay',
	'speech',
	'cover-letter',
	'story',
];
