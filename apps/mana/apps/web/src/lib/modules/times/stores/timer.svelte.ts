/**
 * Timer Store — manages the active time tracking timer.
 *
 * Timer state persists as a TimeBlock (isLive=true) + LocalTimeEntry.
 * When running, the TimeBlock has endDate=null and isLive=true.
 * On stop, endDate is set, isLive=false, and duration is rounded.
 */

import { browser } from '$app/environment';
import { db } from '$lib/data/database';
import { emitDomainEvent } from '$lib/data/events';
import { timeEntryTable, settingsTable } from '$lib/modules/times/collections';
import { roundDuration } from '$lib/modules/times/utils/rounding';
import { createBlock, updateBlock, deleteBlock } from '$lib/data/time-blocks/service';
import type { LocalTimeEntry } from '$lib/modules/times/types';
import type { LocalTimeBlock } from '$lib/data/time-blocks/types';

let runningEntry = $state<LocalTimeEntry | null>(null);
let runningBlock = $state<LocalTimeBlock | null>(null);
let elapsedSeconds = $state(0);
let tickInterval: ReturnType<typeof setInterval> | null = null;
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

function startTicking() {
	stopTicking();
	tickInterval = setInterval(() => {
		if (runningBlock?.startDate) {
			elapsedSeconds = Math.floor((Date.now() - new Date(runningBlock.startDate).getTime()) / 1000);
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
			await timeEntryTable.update(runningEntry.id, {
				duration: elapsedSeconds,
			});
		}
	}, 10000); // Auto-save every 10 seconds
}

export const timerStore = {
	get runningEntry() {
		return runningEntry;
	},
	get runningBlock() {
		return runningBlock;
	},
	get elapsedSeconds() {
		return elapsedSeconds;
	},
	get isRunning() {
		return runningEntry !== null;
	},

	/** Initialize: check for any live timeBlock of type timeEntry */
	async initialize() {
		if (!browser) return;
		const blocks = await db.table<LocalTimeBlock>('timeBlocks').toArray();
		const liveBlock = blocks.find(
			(b) => b.isLive && !b.deletedAt && b.type === 'timeEntry' && b.sourceModule === 'times'
		);
		if (liveBlock) {
			runningBlock = liveBlock;
			const entry = await timeEntryTable.get(liveBlock.sourceId);
			if (entry && !entry.deletedAt) {
				runningEntry = entry;
				elapsedSeconds = Math.floor((Date.now() - new Date(liveBlock.startDate).getTime()) / 1000);
				startTicking();
				startAutoSave();
			}
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
		const entryId = crypto.randomUUID();

		// 1. Create TimeBlock (owns time dimension)
		const timeBlockId = await createBlock({
			startDate: now.toISOString(),
			endDate: null,
			isLive: true,
			kind: 'logged',
			type: 'timeEntry',
			sourceModule: 'times',
			sourceId: entryId,
			title: options?.description || 'Time Entry',
			projectId: options?.projectId ?? null,
		});

		// 2. Create LocalTimeEntry (domain data)
		const entry: LocalTimeEntry = {
			id: entryId,
			timeBlockId,
			projectId: options?.projectId ?? null,
			clientId: options?.clientId ?? null,
			description: options?.description ?? '',
			duration: 0,
			isBillable: options?.isBillable ?? false,
			tags: options?.tags ?? [],
			billingRate: null,
			visibility: 'private',
			guildId: null,
			source: { app: 'timer' },
		};

		await timeEntryTable.add(entry);
		runningEntry = entry;
		runningBlock = (await db.table<LocalTimeBlock>('timeBlocks').get(timeBlockId)) ?? null;
		elapsedSeconds = 0;
		startTicking();
		startAutoSave();
		emitDomainEvent('TimerStarted', 'times', 'timeEntries', entryId, {
			entryId,
			description: options?.description,
			projectId: options?.projectId,
		});
	},

	/** Stop the running timer */
	async stop(): Promise<LocalTimeEntry | null> {
		if (!runningEntry || !runningBlock) return null;

		const now = new Date();
		const finalDuration = Math.floor(
			(now.getTime() - new Date(runningBlock.startDate).getTime()) / 1000
		);

		// Apply rounding from settings
		const settings = await settingsTable.toArray();
		const s = settings.find((s) => !s.deletedAt);
		const roundedDuration = s
			? roundDuration(finalDuration, s.roundingIncrement, s.roundingMethod)
			: finalDuration;

		// Update TimeBlock: set endDate, isLive=false
		await updateBlock(runningBlock.id, {
			endDate: now.toISOString(),
			isLive: false,
		});

		// Update TimeEntry: set final duration
		await timeEntryTable.update(runningEntry.id, {
			duration: roundedDuration,
		});

		const stoppedEntry = {
			...runningEntry,
			duration: roundedDuration,
		};
		emitDomainEvent('TimerStopped', 'times', 'timeEntries', runningEntry.id, {
			entryId: runningEntry.id,
			durationMinutes: Math.round(roundedDuration / 60),
			description: runningEntry.description,
		});
		stopTicking();
		runningEntry = null;
		runningBlock = null;
		elapsedSeconds = 0;
		return stoppedEntry as LocalTimeEntry;
	},

	/** Discard the running timer without saving */
	async discard() {
		if (!runningEntry || !runningBlock) return;
		await deleteBlock(runningBlock.id);
		await timeEntryTable.delete(runningEntry.id);
		stopTicking();
		runningEntry = null;
		runningBlock = null;
		elapsedSeconds = 0;
	},

	/** Update the running entry's metadata (project, description, etc.) */
	async updateRunning(
		updates: Partial<
			Pick<LocalTimeEntry, 'projectId' | 'clientId' | 'description' | 'isBillable' | 'tags'>
		>
	) {
		if (!runningEntry || !runningBlock) return;
		await timeEntryTable.update(runningEntry.id, updates);
		runningEntry = { ...runningEntry, ...updates };

		// Keep TimeBlock title/projectId in sync
		const blockUpdates: Record<string, unknown> = {};
		if (updates.description !== undefined) blockUpdates.title = updates.description;
		if (updates.projectId !== undefined) blockUpdates.projectId = updates.projectId;
		if (Object.keys(blockUpdates).length > 0) {
			await updateBlock(runningBlock.id, blockUpdates);
		}
	},

	/** Cleanup on unmount */
	destroy() {
		stopTicking();
	},
};
