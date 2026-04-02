/**
 * Birthday Popover Composable
 * Manages birthday popover state and handlers for calendar views
 */

import type { BirthdayEvent } from '$lib/api/birthdays';

export function useBirthdayPopover() {
	let selectedBirthday = $state<BirthdayEvent | null>(null);
	let popoverPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });

	/**
	 * Handle click on a birthday indicator to show the popover
	 */
	function handleBirthdayClick(birthday: BirthdayEvent, e: MouseEvent) {
		e.stopPropagation();
		selectedBirthday = birthday;
		popoverPosition = { x: e.clientX, y: e.clientY };
	}

	/**
	 * Close the birthday popover
	 */
	function closePopover() {
		selectedBirthday = null;
	}

	/**
	 * Check if popover is currently open
	 */
	function isOpen(): boolean {
		return selectedBirthday !== null;
	}

	return {
		// State (reactive getters)
		get selectedBirthday() {
			return selectedBirthday;
		},
		get popoverPosition() {
			return popoverPosition;
		},

		// Methods
		handleBirthdayClick,
		closePopover,
		isOpen,
	};
}
