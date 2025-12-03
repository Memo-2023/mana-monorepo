export type PresetType = 'timer' | 'pomodoro';

export interface PresetSettings {
	// For pomodoro presets
	workDuration?: number;
	breakDuration?: number;
	longBreakDuration?: number;
	sessionsBeforeLongBreak?: number;
	// For timer presets
	sound?: string;
}

export interface Preset {
	id: string;
	userId: string;
	type: PresetType;
	name: string;
	durationSeconds: number;
	settings: PresetSettings | null;
	createdAt: string;
}

export interface CreatePresetInput {
	type: PresetType;
	name: string;
	durationSeconds: number;
	settings?: PresetSettings;
}

export interface UpdatePresetInput {
	name?: string;
	durationSeconds?: number;
	settings?: PresetSettings;
}

// Default pomodoro settings
export const DEFAULT_POMODORO_SETTINGS: PresetSettings = {
	workDuration: 25 * 60, // 25 minutes
	breakDuration: 5 * 60, // 5 minutes
	longBreakDuration: 15 * 60, // 15 minutes
	sessionsBeforeLongBreak: 4,
};
