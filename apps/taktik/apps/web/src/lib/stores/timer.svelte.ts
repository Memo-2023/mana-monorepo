/**
 * Timer Store — manages the active time tracking timer.
 *
 * The timer state persists in IndexedDB via the timeEntries collection.
 * When a timer is running, there's a timeEntry with isRunning=true.
 * This store provides reactive access to the running entry and elapsed time.
 */

import { browser } from '$app/environment';
import {
	timeEntryCollection,
	settingsCollection,
	type LocalTimeEntry,
} from '$lib/data/local-store';
import { roundDuration } from '$lib/utils/rounding';

let runningEntry = $state<LocalTimeEntry | null>(null);
let elapsedSeconds = $state(0);
let tickInterval: ReturnType<typeof setInterval> | null = null;
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

function startTicking() {
	stopTicking();
	tickInterval = setInterval(() => {
		if (runningEntry?.startTime) {
			elapsedSeconds = Math.floor((Date.now() - new Date(runningEntry.startTime).getTime()) / 1000);
		}
	}, 1000);
}

function stopTicking() {
	if (tickInterval) {
		clearInterval(tickInterval);
		tickInterval = null;
	}
	if (autoSaveInterval) {
		clearInterval(autoSaveInterval);
		autoSaveInterval = null;
	}
}

function startAutoSave() {
	if (autoSaveInterval) clearInterval(autoSaveInterval);
	autoSaveInterval = setInterval(async () => {
		if (runningEntry) {
			await timeEntryCollection.update(runningEntry.id, {
				duration: elapsedSeconds,
			});
		}
	}, 10000); // Auto-save every 10 seconds
}

export const timerStore = {
	get runningEntry() {
		return runningEntry;
	},
	get elapsedSeconds() {
		return elapsedSeconds;
	},
	get isRunning() {
		return runningEntry !== null;
	},

	/** Initialize: check for any running entry in IndexedDB */
	async initialize() {
		if (!browser) return;
		const entries = await timeEntryCollection.getAll();
		const running = entries.find((e) => e.isRunning);
		if (running) {
			runningEntry = running;
			if (running.startTime) {
				elapsedSeconds = Math.floor((Date.now() - new Date(running.startTime).getTime()) / 1000);
			}
			startTicking();
			startAutoSave();
		}
	},

	/** Start a new timer */
	async start(options?: {
		projectId?: string;
		clientId?: string;
		description?: string;
		isBillable?: boolean;
		tags?: string[];
	}) {
		// Stop any existing timer first
		if (runningEntry) {
			await timerStore.stop();
		}

		const now = new Date();
		const entry: LocalTimeEntry = {
			id: crypto.randomUUID(),
			projectId: options?.projectId ?? null,
			clientId: options?.clientId ?? null,
			description: options?.description ?? '',
			date: now.toISOString().split('T')[0],
			startTime: now.toISOString(),
			endTime: null,
			duration: 0,
			isBillable: options?.isBillable ?? false,
			isRunning: true,
			tags: options?.tags ?? [],
			billingRate: null,
			visibility: 'private',
			guildId: null,
			source: { app: 'timer' },
		};

		await timeEntryCollection.insert(entry);
		runningEntry = entry;
		elapsedSeconds = 0;
		startTicking();
		startAutoSave();
	},

	/** Stop the running timer */
	async stop(): Promise<LocalTimeEntry | null> {
		if (!runningEntry) return null;

		const now = new Date();
		const finalDuration = runningEntry.startTime
			? Math.floor((now.getTime() - new Date(runningEntry.startTime).getTime()) / 1000)
			: elapsedSeconds;

		// Apply rounding from settings
		const settings = await settingsCollection.getAll();
		const s = settings[0];
		const roundedDuration = s
			? roundDuration(finalDuration, s.roundingIncrement, s.roundingMethod)
			: finalDuration;

		await timeEntryCollection.update(runningEntry.id, {
			isRunning: false,
			endTime: now.toISOString(),
			duration: roundedDuration,
		});

		const stoppedEntry = {
			...runningEntry,
			isRunning: false,
			endTime: now.toISOString(),
			duration: roundedDuration,
		};
		stopTicking();
		runningEntry = null;
		elapsedSeconds = 0;
		return stoppedEntry as LocalTimeEntry;
	},

	/** Discard the running timer without saving */
	async discard() {
		if (!runningEntry) return;
		await timeEntryCollection.delete(runningEntry.id);
		stopTicking();
		runningEntry = null;
		elapsedSeconds = 0;
	},

	/** Update the running entry's metadata (project, description, etc.) */
	async updateRunning(
		updates: Partial<
			Pick<LocalTimeEntry, 'projectId' | 'clientId' | 'description' | 'isBillable' | 'tags'>
		>
	) {
		if (!runningEntry) return;
		await timeEntryCollection.update(runningEntry.id, updates);
		runningEntry = { ...runningEntry, ...updates };
	},

	/** Cleanup on unmount */
	destroy() {
		stopTicking();
	},
};
