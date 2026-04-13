/**
 * Sleep module typed contexts.
 */

import { createModuleContext } from '$lib/data/module-context';
import type { SleepEntry, SleepHygieneLog, SleepHygieneCheck, SleepSettings } from './types';

export const sleepEntriesCtx = createModuleContext<SleepEntry[]>('sleepEntries');
export const sleepHygieneLogsCtx = createModuleContext<SleepHygieneLog[]>('sleepHygieneLogs');
export const sleepHygieneChecksCtx = createModuleContext<SleepHygieneCheck[]>('sleepHygieneChecks');
export const sleepSettingsCtx = createModuleContext<SleepSettings | null>('sleepSettings');
