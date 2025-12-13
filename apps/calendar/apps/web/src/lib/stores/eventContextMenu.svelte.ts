/**
 * Event Context Menu Store - Manages context menu state for calendar events
 */

import type { CalendarEvent } from '@calendar/shared';

// State
let visible = $state(false);
let x = $state(0);
let y = $state(0);
let targetEvent = $state<CalendarEvent | null>(null);

export const eventContextMenuStore = {
	// Getters
	get visible() {
		return visible;
	},
	get x() {
		return x;
	},
	get y() {
		return y;
	},
	get targetEvent() {
		return targetEvent;
	},

	/**
	 * Show the context menu for an event
	 */
	show(event: CalendarEvent, clientX: number, clientY: number) {
		targetEvent = event;
		x = clientX;
		y = clientY;
		visible = true;
	},

	/**
	 * Hide the context menu
	 */
	hide() {
		visible = false;
		targetEvent = null;
	},
};
