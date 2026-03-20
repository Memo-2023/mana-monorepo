/**
 * Drag-to-Create Composable
 * Handles click-and-drag on the calendar grid to create new events
 */

import { SNAP_INTERVAL_MINUTES } from '$lib/utils/calendarConstants';

export interface DragToCreateConfig {
	containerEl: HTMLElement | null;
	days: Date[];
	firstVisibleHour: number;
	lastVisibleHour: number;
	totalVisibleHours: number;
	hourHeight: number;
	minutesToPercent: (minutes: number) => number;
	snapMinutes?: number;
	isOtherOperationActive: () => boolean;
	onCreateEnd?: (startTime: Date, endTime: Date, position: { x: number; y: number }) => void;
}

export function useDragToCreate(getConfig: () => DragToCreateConfig) {
	let isCreating = $state(false);
	let createTargetDay = $state<Date | null>(null);
	let createStartMinutes = $state(0);
	let createEndMinutes = $state(0);
	let createPreviewTop = $state(0);
	let createPreviewHeight = $state(0);
	let hasMoved = $state(false);

	function getSnapMinutes(): number {
		return getConfig().snapMinutes ?? SNAP_INTERVAL_MINUTES;
	}

	function getDayFromX(clientX: number): Date | null {
		const config = getConfig();
		if (!config.containerEl) return null;

		const rect = config.containerEl.getBoundingClientRect();
		const relativeX = clientX - rect.left;
		const dayWidth = rect.width / config.days.length;
		const dayIndex = Math.floor(relativeX / dayWidth);

		if (dayIndex >= 0 && dayIndex < config.days.length) {
			return config.days[dayIndex];
		}
		return null;
	}

	function getMinutesFromY(clientY: number): number {
		const config = getConfig();
		if (!config.containerEl) return 0;

		const rect = config.containerEl.getBoundingClientRect();
		const scrollTop = config.containerEl.parentElement?.scrollTop || 0;
		const relativeY = clientY - rect.top + scrollTop;
		const visibleMinutes =
			(relativeY / (config.totalVisibleHours * config.hourHeight)) * config.totalVisibleHours * 60;
		const totalMinutes = visibleMinutes + config.firstVisibleHour * 60;

		const snap = getSnapMinutes();
		return Math.round(totalMinutes / snap) * snap;
	}

	function updatePreview() {
		const config = getConfig();
		createPreviewTop = config.minutesToPercent(createStartMinutes);
		const duration = createEndMinutes - createStartMinutes;
		createPreviewHeight = (duration / (config.totalVisibleHours * 60)) * 100;
	}

	function startCreate(e: PointerEvent) {
		const config = getConfig();
		if (config.isOtherOperationActive()) return;

		// Don't start creating if clicking on interactive elements
		const target = e.target as HTMLElement;
		if (
			target.closest(
				'.event-card, .task-block, .all-day-event, .all-day-block-event, .overflow-indicator, .resize-handle'
			)
		) {
			return;
		}

		e.preventDefault();

		const day = getDayFromX(e.clientX);
		if (!day) return;

		const minutes = getMinutesFromY(e.clientY);
		const snap = getSnapMinutes();
		const snappedMinutes = Math.round(minutes / snap) * snap;

		isCreating = true;
		hasMoved = false;
		createTargetDay = day;
		createStartMinutes = snappedMinutes;
		createEndMinutes = snappedMinutes + snap;

		updatePreview();

		document.addEventListener('pointermove', handleCreateMove);
		document.addEventListener('pointerup', handleCreateEnd);
	}

	function handleCreateMove(e: PointerEvent) {
		if (!isCreating) return;

		hasMoved = true;
		const config = getConfig();
		const snap = getSnapMinutes();

		const day = getDayFromX(e.clientX);
		if (day) createTargetDay = day;

		const minutes = getMinutesFromY(e.clientY);
		const snappedMinutes = Math.round(minutes / snap) * snap;

		if (snappedMinutes >= createStartMinutes) {
			createEndMinutes = Math.max(snappedMinutes, createStartMinutes + snap);
		} else {
			createEndMinutes = createStartMinutes + snap;
			createStartMinutes = snappedMinutes;
		}

		createStartMinutes = Math.max(config.firstVisibleHour * 60, createStartMinutes);
		createEndMinutes = Math.min(config.lastVisibleHour * 60, createEndMinutes);

		updatePreview();
	}

	function handleCreateEnd(e: PointerEvent) {
		document.removeEventListener('pointermove', handleCreateMove);
		document.removeEventListener('pointerup', handleCreateEnd);

		if (!isCreating || !createTargetDay) {
			isCreating = false;
			return;
		}

		const startTime = new Date(createTargetDay);
		startTime.setHours(Math.floor(createStartMinutes / 60), createStartMinutes % 60, 0, 0);

		const endTime = new Date(createTargetDay);
		endTime.setHours(Math.floor(createEndMinutes / 60), createEndMinutes % 60, 0, 0);

		isCreating = false;
		createTargetDay = null;
		hasMoved = false;

		const config = getConfig();
		config.onCreateEnd?.(startTime, endTime, { x: e.clientX, y: e.clientY });
	}

	function getCreatePreviewTime(): string {
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${pad(Math.floor(createStartMinutes / 60))}:${pad(createStartMinutes % 60)} - ${pad(Math.floor(createEndMinutes / 60))}:${pad(createEndMinutes % 60)}`;
	}

	function cancel() {
		if (isCreating) {
			document.removeEventListener('pointermove', handleCreateMove);
			document.removeEventListener('pointerup', handleCreateEnd);
			isCreating = false;
			createTargetDay = null;
			hasMoved = false;
		}
	}

	return {
		get isCreating() {
			return isCreating;
		},
		get createTargetDay() {
			return createTargetDay;
		},
		get createPreviewTop() {
			return createPreviewTop;
		},
		get createPreviewHeight() {
			return createPreviewHeight;
		},

		startCreate,
		cancel,
		getCreatePreviewTime,
	};
}
