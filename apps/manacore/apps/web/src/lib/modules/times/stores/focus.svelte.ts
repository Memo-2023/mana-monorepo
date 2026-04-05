/**
 * Focus Mode Store — Pomodoro-style focus sessions using timeBlocks.
 *
 * Creates type:'focus' and type:'break' timeBlocks.
 * Sessions can optionally link to a task via projectId/sourceId.
 */

import { browser } from '$app/environment';
import { db } from '$lib/data/database';
import { createBlock, updateBlock } from '$lib/data/time-blocks/service';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

export type FocusPhase = 'idle' | 'focus' | 'break';

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const SESSIONS_BEFORE_LONG_BREAK = 4;

let phase = $state<FocusPhase>('idle');
let activeBlockId = $state<string | null>(null);
let startedAt = $state<Date | null>(null);
let elapsedSeconds = $state(0);
let completedSessions = $state(0);

let focusMinutes = $state(DEFAULT_FOCUS_MINUTES);
let breakMinutes = $state(DEFAULT_BREAK_MINUTES);
let longBreakMinutes = $state(DEFAULT_LONG_BREAK_MINUTES);

let tickInterval: ReturnType<typeof setInterval> | null = null;

function startTicking() {
	stopTicking();
	tickInterval = setInterval(() => {
		if (startedAt) {
			elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
		}
	}, 1000);
}

function stopTicking() {
	if (tickInterval) {
		clearInterval(tickInterval);
		tickInterval = null;
	}
}

/** Seconds remaining in current phase. */
function targetSeconds(): number {
	if (phase === 'focus') return focusMinutes * 60;
	if (phase === 'break') {
		const isLongBreak =
			completedSessions > 0 && completedSessions % SESSIONS_BEFORE_LONG_BREAK === 0;
		return (isLongBreak ? longBreakMinutes : breakMinutes) * 60;
	}
	return 0;
}

export const focusStore = {
	get phase() {
		return phase;
	},
	get activeBlockId() {
		return activeBlockId;
	},
	get elapsedSeconds() {
		return elapsedSeconds;
	},
	get completedSessions() {
		return completedSessions;
	},
	get focusMinutes() {
		return focusMinutes;
	},
	get breakMinutes() {
		return breakMinutes;
	},
	get remainingSeconds() {
		return Math.max(0, targetSeconds() - elapsedSeconds);
	},
	get progress() {
		const target = targetSeconds();
		if (target === 0) return 0;
		return Math.min(1, elapsedSeconds / target);
	},
	get isTimerDone() {
		return phase !== 'idle' && elapsedSeconds >= targetSeconds();
	},

	/** Initialize: check for any live focus/break block. */
	async initialize() {
		if (!browser) return;
		const blocks = await db.table<LocalTimeBlock>('timeBlocks').toArray();
		const live = blocks.find(
			(b) =>
				b.isLive &&
				!b.deletedAt &&
				(b.type === 'focus' || b.type === 'break') &&
				b.sourceModule === 'times'
		);
		if (live) {
			activeBlockId = live.id;
			phase = live.type as FocusPhase;
			startedAt = new Date(live.startDate);
			elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
			startTicking();
		}
	},

	/** Start a focus session. */
	async startFocus(options?: { title?: string; projectId?: string }) {
		if (phase !== 'idle') await focusStore.stop();

		const now = new Date();
		const blockId = await createBlock({
			startDate: now.toISOString(),
			endDate: null,
			isLive: true,
			kind: 'logged',
			type: 'focus',
			sourceModule: 'times',
			sourceId: `focus-${crypto.randomUUID()}`,
			title: options?.title || 'Fokus-Session',
			projectId: options?.projectId ?? null,
			color: '#ef4444',
		});

		activeBlockId = blockId;
		phase = 'focus';
		startedAt = now;
		elapsedSeconds = 0;
		startTicking();
	},

	/** Start a break. */
	async startBreak() {
		if (activeBlockId) {
			await updateBlock(activeBlockId, {
				endDate: new Date().toISOString(),
				isLive: false,
			});
		}

		const now = new Date();
		const isLongBreak = (completedSessions + 1) % SESSIONS_BEFORE_LONG_BREAK === 0;

		const blockId = await createBlock({
			startDate: now.toISOString(),
			endDate: null,
			isLive: true,
			kind: 'logged',
			type: 'break',
			sourceModule: 'times',
			sourceId: `break-${crypto.randomUUID()}`,
			title: isLongBreak ? 'Lange Pause' : 'Kurze Pause',
			color: '#22c55e',
		});

		completedSessions++;
		activeBlockId = blockId;
		phase = 'break';
		startedAt = now;
		elapsedSeconds = 0;
		startTicking();
	},

	/** Stop current phase and return to idle. */
	async stop() {
		if (activeBlockId) {
			await updateBlock(activeBlockId, {
				endDate: new Date().toISOString(),
				isLive: false,
			});
		}

		stopTicking();
		phase = 'idle';
		activeBlockId = null;
		startedAt = null;
		elapsedSeconds = 0;
	},

	/** Reset session counter. */
	resetSessions() {
		completedSessions = 0;
	},

	/** Configure durations. */
	setDurations(focus: number, brk: number, longBrk: number) {
		focusMinutes = focus;
		breakMinutes = brk;
		longBreakMinutes = longBrk;
	},

	destroy() {
		stopTicking();
	},
};
