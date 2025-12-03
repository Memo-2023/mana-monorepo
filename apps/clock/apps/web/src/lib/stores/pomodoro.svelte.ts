/**
 * Pomodoro Store - Local pomodoro timer state using Svelte 5 runes
 */

import { browser } from '$app/environment';
import { DEFAULT_POMODORO_SETTINGS } from '@clock/shared';

export type PomodoroPhase = 'work' | 'break' | 'longBreak';

// Settings
let workDuration = $state(DEFAULT_POMODORO_SETTINGS.workDuration!);
let breakDuration = $state(DEFAULT_POMODORO_SETTINGS.breakDuration!);
let longBreakDuration = $state(DEFAULT_POMODORO_SETTINGS.longBreakDuration!);
let sessionsBeforeLongBreak = $state(DEFAULT_POMODORO_SETTINGS.sessionsBeforeLongBreak!);

// State
let phase = $state<PomodoroPhase>('work');
let isRunning = $state(false);
let remainingTime = $state(workDuration);
let completedSessions = $state(0);
let startTime = $state<number | null>(null);
let pausedTimeRemaining = $state(workDuration);

// Animation frame for updating time
let animationFrameId: number | null = null;

function updateTime() {
	if (startTime !== null && isRunning) {
		const elapsed = Math.floor((Date.now() - startTime) / 1000);
		remainingTime = Math.max(0, pausedTimeRemaining - elapsed);

		if (remainingTime <= 0) {
			handlePhaseComplete();
		} else {
			animationFrameId = requestAnimationFrame(updateTime);
		}
	}
}

function handlePhaseComplete() {
	isRunning = false;
	startTime = null;
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	// Play notification sound
	if (browser && 'Notification' in window && Notification.permission === 'granted') {
		new Notification('Pomodoro', {
			body:
				phase === 'work'
					? 'Arbeitszeit beendet! Zeit für eine Pause.'
					: 'Pause beendet! Bereit für die nächste Sitzung?',
		});
	}

	// Advance to next phase
	if (phase === 'work') {
		completedSessions++;
		if (completedSessions % sessionsBeforeLongBreak === 0) {
			phase = 'longBreak';
			remainingTime = longBreakDuration;
			pausedTimeRemaining = longBreakDuration;
		} else {
			phase = 'break';
			remainingTime = breakDuration;
			pausedTimeRemaining = breakDuration;
		}
	} else {
		phase = 'work';
		remainingTime = workDuration;
		pausedTimeRemaining = workDuration;
	}
}

export const pomodoroStore = {
	// Getters
	get phase() {
		return phase;
	},
	get isRunning() {
		return isRunning;
	},
	get remainingTime() {
		return remainingTime;
	},
	get completedSessions() {
		return completedSessions;
	},
	get sessionsBeforeLongBreak() {
		return sessionsBeforeLongBreak;
	},
	get currentPhaseDuration() {
		switch (phase) {
			case 'work':
				return workDuration;
			case 'break':
				return breakDuration;
			case 'longBreak':
				return longBreakDuration;
		}
	},
	get progress() {
		const total = this.currentPhaseDuration;
		return ((total - remainingTime) / total) * 100;
	},
	get formattedTime() {
		const minutes = Math.floor(remainingTime / 60);
		const seconds = remainingTime % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	},

	// Settings getters
	get settings() {
		return {
			workDuration,
			breakDuration,
			longBreakDuration,
			sessionsBeforeLongBreak,
		};
	},

	/**
	 * Start the timer
	 */
	start() {
		if (!isRunning) {
			isRunning = true;
			startTime = Date.now();
			updateTime();
		}
	},

	/**
	 * Pause the timer
	 */
	pause() {
		if (isRunning) {
			isRunning = false;
			pausedTimeRemaining = remainingTime;
			startTime = null;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	},

	/**
	 * Toggle start/pause
	 */
	toggle() {
		if (isRunning) {
			this.pause();
		} else {
			this.start();
		}
	},

	/**
	 * Skip to next phase
	 */
	skip() {
		this.pause();
		handlePhaseComplete();
	},

	/**
	 * Reset the pomodoro timer
	 */
	reset() {
		isRunning = false;
		phase = 'work';
		remainingTime = workDuration;
		pausedTimeRemaining = workDuration;
		completedSessions = 0;
		startTime = null;
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	},

	/**
	 * Update settings
	 */
	updateSettings(settings: {
		workDuration?: number;
		breakDuration?: number;
		longBreakDuration?: number;
		sessionsBeforeLongBreak?: number;
	}) {
		if (settings.workDuration !== undefined) {
			workDuration = settings.workDuration;
		}
		if (settings.breakDuration !== undefined) {
			breakDuration = settings.breakDuration;
		}
		if (settings.longBreakDuration !== undefined) {
			longBreakDuration = settings.longBreakDuration;
		}
		if (settings.sessionsBeforeLongBreak !== undefined) {
			sessionsBeforeLongBreak = settings.sessionsBeforeLongBreak;
		}

		// Reset to work phase with new duration if not running
		if (!isRunning && phase === 'work') {
			remainingTime = workDuration;
			pausedTimeRemaining = workDuration;
		}
	},

	/**
	 * Load preset
	 */
	loadPreset(preset: {
		workDuration: number;
		breakDuration: number;
		longBreakDuration: number;
		sessionsBeforeLongBreak: number;
	}) {
		this.pause();
		this.updateSettings(preset);
		this.reset();
	},

	/**
	 * Request notification permission
	 */
	async requestNotificationPermission() {
		if (browser && 'Notification' in window) {
			const permission = await Notification.requestPermission();
			return permission === 'granted';
		}
		return false;
	},
};
