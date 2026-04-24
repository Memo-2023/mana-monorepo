/**
 * Writing module — barrel exports.
 */

export { draftsStore } from './stores/drafts.svelte';
export type { CreateDraftInput, UpdateDraftPatch } from './stores/drafts.svelte';

export { stylesStore } from './stores/styles.svelte';
export type { CreateStyleInput, UpdateStylePatch } from './stores/styles.svelte';

export { generationsStore } from './stores/generations.svelte';
export type { StartDraftGenerationOptions } from './stores/generations.svelte';

export { callWritingGeneration } from './api';
export type { GenerateDraftRequest, GenerateDraftResponse } from './api';

export { buildDraftPrompt, estimateMaxTokens } from './utils/prompt-builder';
export type { PromptPair, BuildDraftPromptInput } from './utils/prompt-builder';

export {
	useAllDrafts,
	useDraft,
	useVersionsForDraft,
	useVersion,
	useCurrentVersionForDraft,
	useGenerationsForDraft,
	useAllStyles,
	toDraft,
	toDraftVersion,
	toGeneration,
	toWritingStyle,
	filterByKind,
	filterByStatus,
	searchDrafts,
	sortByUpdated,
	groupByKind,
	computeStats,
} from './queries';
export type { WritingStats } from './queries';

export {
	draftTable,
	draftVersionTable,
	generationTable,
	writingStyleTable,
	WRITING_GUEST_SEED,
} from './collections';

export {
	KIND_LABELS,
	STATUS_LABELS,
	STATUS_COLORS,
	GENERATION_STATUS_LABELS,
	STYLE_SOURCE_LABELS,
	LENGTH_PRESETS,
	TONE_PRESETS,
	DEFAULT_LANGUAGE,
	AUTO_OUTLINE_KINDS,
} from './constants';

export { STYLE_PRESETS, getStylePreset } from './presets/styles';
export type { StylePreset } from './presets/styles';

export type {
	// Enums
	DraftKind,
	DraftStatus,
	DraftLengthUnit,
	GenerationStatus,
	GenerationKind,
	GenerationProvider,
	StyleSource,
	DraftReferenceKind,
	DraftPublishModule,
	// Sub-objects
	DraftBriefing,
	DraftStyleOverrides,
	DraftReference,
	DraftPublishTarget,
	DraftGenerationParams,
	DraftSelection,
	DraftTokenUsage,
	StyleSample,
	StyleExtractedPrinciples,
	// Dexie records
	LocalDraft,
	LocalDraftVersion,
	LocalGeneration,
	LocalWritingStyle,
	// Domain types
	Draft,
	DraftVersion,
	Generation,
	WritingStyle,
} from './types';
