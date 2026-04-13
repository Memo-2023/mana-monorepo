import { createModuleContext } from '$lib/data/module-context';
import type { MoodEntry, MoodSettings } from './types';

export const moodEntriesCtx = createModuleContext<MoodEntry[]>('moodEntries');
export const moodSettingsCtx = createModuleContext<MoodSettings | null>('moodSettings');
