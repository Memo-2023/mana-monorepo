/**
 * Guides module — barrel exports.
 *
 * Interactive step-by-step guides with sections, steps, and run tracking.
 * Types, queries, and stores are the canonical imports; this file just
 * re-exports for convenience.
 */

export type {
	Guide,
	Section,
	Step,
	Run,
	GuideCategory,
	GuideDifficulty,
	LocalGuide,
	LocalSection,
	LocalStep,
	LocalRun,
} from './types';

export { GUIDE_CATEGORIES, DIFFICULTY_LABELS } from './types';
export { guideTable, sectionTable, stepTable, runTable, GUIDES_GUEST_SEED } from './collections';

// TODO: GUIDES should be populated from a content source (static JSON, CMS, or DB).
// For now export an empty array so the /guides route renders without crashing the build.
export const GUIDES: Guide[] = [];
