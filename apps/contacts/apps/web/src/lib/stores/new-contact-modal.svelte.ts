/**
 * Store for controlling the New Contact Modal
 */

interface NewContactData {
	firstName?: string;
	lastName?: string;
	displayName?: string;
	email?: string;
	phone?: string;
	company?: string;
}

let isOpen = $state(false);
let prefillData = $state<NewContactData | null>(null);

export const newContactModalStore = {
	get isOpen() {
		return isOpen;
	},

	get prefillData() {
		return prefillData;
	},

	/**
	 * Open the modal, optionally with pre-filled data
	 */
	open(data?: NewContactData) {
		prefillData = data || null;
		isOpen = true;
	},

	/**
	 * Close the modal and reset data
	 */
	close() {
		isOpen = false;
		prefillData = null;
	},
};
