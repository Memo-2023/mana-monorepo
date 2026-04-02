/**
 * Drag-to-Create Composable
 * Click-and-drag on the calendar grid to create new events
 */

import { DEFAULT_EVENT_DURATION_MINUTES } from '../utils/constants';
import { formatTime, getSnapMinutes, getDayFromX, getMinutesFromY } from '../utils/drag-helpers';

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

	function dayFromX(clientX: number): Date | null {
		const config = getConfig();
		return getDayFromX(clientX, config.containerEl, config.days);
	}

	function minutesFromY(clientY: number): number {
		const config = getConfig();
		return getMinutesFromY(
			clientY,
			config.containerEl,
			config.totalVisibleHours,
			config.hourHeight,
			config.firstVisibleHour,
			config.snapMinutes
		);
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

		const target = e.target as HTMLElement;
		if (
			target.closest(
				'.event-card, .all-day-event, .all-day-block-event, .overflow-indicator, .resize-handle'
			)
		) {
			return;
		}

		e.preventDefault();

		const day = dayFromX(e.clientX);
		if (!day) return;

		const minutes = minutesFromY(e.clientY);
		const snap = getSnapMinutes(config.snapMinutes);
		const snappedMinutes = Math.round(minutes / snap) * snap;

		isCreating = true;
		hasMoved = false;
		createTargetDay = day;
		createStartMinutes = snappedMinutes;
		createEndMinutes = snappedMinutes + DEFAULT_EVENT_DURATION_MINUTES;

		updatePreview();

		document.addEventListener('pointermove', handleCreateMove);
		document.addEventListener('pointerup', handleCreateEnd);
	}

	function handleCreateMove(e: PointerEvent) {
		if (!isCreating) return;

		hasMoved = true;
		const config = getConfig();
		const snap = getSnapMinutes(config.snapMinutes);

		const day = dayFromX(e.clientX);
		if (day) createTargetDay = day;

		const minutes = minutesFromY(e.clientY);
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
		return `${formatTime(Math.floor(createStartMinutes / 60), createStartMinutes % 60)} - ${formatTime(Math.floor(createEndMinutes / 60), createEndMinutes % 60)}`;
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
