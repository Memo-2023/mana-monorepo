/**
 * Moodlit module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

// Animation types available for moods
export type AnimationType =
	| 'gradient'
	| 'pulse'
	| 'wave'
	| 'flash'
	| 'sos'
	| 'candle'
	| 'police'
	| 'warning'
	| 'disco'
	| 'thunder'
	| 'breath'
	| 'rave'
	| 'scanner'
	| 'matrix'
	| 'sunrise'
	| 'sunset'
	| 'aurora'
	| 'fire'
	| 'ocean'
	| 'forest'
	| 'sparkle';

export interface LocalMood extends BaseRecord {
	name: string;
	colors: string[];
	animation: string;
	isDefault: boolean;
}

export interface LocalSequence extends BaseRecord {
	name: string;
	moodIds: string[];
	duration: number;
}

// Mood interface (UI-facing)
export interface Mood {
	id: string;
	name: string;
	colors: string[];
	animationType: AnimationType;
	isCustom?: boolean;
	order?: number;
	createdAt?: string;
}

// Sequence item (mood with duration)
export interface MoodSequenceItem {
	moodId: string;
	duration: number; // seconds
}

// Mood sequence
export interface MoodSequence {
	id: string;
	name: string;
	items: MoodSequenceItem[];
	transitionDuration: number; // 2, 5, or 10 seconds
	isCustom?: boolean;
}

// Settings
export interface MoodSettings {
	animationSpeed: 'slow' | 'normal' | 'fast';
	brightness: number; // 0-100
	autoTimer: number; // 0 = off, else minutes
	autoMoodSwitch: boolean;
	autoMoodSwitchInterval: number; // minutes
}

// Animation metadata for UI
export interface AnimationInfo {
	id: AnimationType;
	name: string;
	description: string;
}

// Available animations with descriptions
export const ANIMATIONS: AnimationInfo[] = [
	{ id: 'gradient', name: 'Gradient', description: 'Smooth color gradient' },
	{ id: 'pulse', name: 'Pulse', description: 'Breathing opacity effect' },
	{ id: 'wave', name: 'Wave', description: 'Smooth wave oscillation' },
	{ id: 'breath', name: 'Breath', description: '4-second breathing cycle' },
	{ id: 'aurora', name: 'Aurora', description: 'Northern lights effect' },
	{ id: 'fire', name: 'Fire', description: 'Warm flickering flames' },
	{ id: 'candle', name: 'Candle', description: 'Soft candlelight flicker' },
	{ id: 'ocean', name: 'Ocean', description: 'Calm ocean waves' },
	{ id: 'forest', name: 'Forest', description: 'Peaceful forest ambience' },
	{ id: 'thunder', name: 'Thunder', description: 'Random lightning flashes' },
	{ id: 'sparkle', name: 'Sparkle', description: 'Twinkling star effect' },
	{ id: 'sunrise', name: 'Sunrise', description: 'Slow warming colors' },
	{ id: 'sunset', name: 'Sunset', description: 'Evening color transition' },
	{ id: 'disco', name: 'Disco', description: 'Fast color cycling' },
	{ id: 'rave', name: 'Rave', description: 'Very fast chaotic colors' },
	{ id: 'scanner', name: 'Scanner', description: 'Light wave sweep' },
	{ id: 'matrix', name: 'Matrix', description: 'Digital green blinking' },
	{ id: 'flash', name: 'Flash', description: 'Quick white flashes' },
	{ id: 'sos', name: 'SOS', description: 'Morse code pattern' },
	{ id: 'police', name: 'Police', description: 'Red/blue alternating' },
	{ id: 'warning', name: 'Warning', description: 'Blinking orange/yellow' },
];
