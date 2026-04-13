/**
 * Stretch module typed contexts.
 *
 * Usage:
 *   Layout:  stretchExercisesCtx.provide(useAllStretchExercises());
 *   Page:    const exercises = stretchExercisesCtx.consume();
 *            let list = $derived(exercises.value);
 */

import { createModuleContext } from '$lib/data/module-context';
import type {
	StretchExercise,
	StretchRoutine,
	StretchSession,
	StretchAssessment,
	StretchReminder,
} from './types';

export const stretchExercisesCtx = createModuleContext<StretchExercise[]>('stretchExercises');
export const stretchRoutinesCtx = createModuleContext<StretchRoutine[]>('stretchRoutines');
export const stretchSessionsCtx = createModuleContext<StretchSession[]>('stretchSessions');
export const stretchAssessmentsCtx = createModuleContext<StretchAssessment[]>('stretchAssessments');
export const stretchRemindersCtx = createModuleContext<StretchReminder[]>('stretchReminders');
