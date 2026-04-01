/**
 * Store for controlling the New Contact Modal.
 */

interface NewContactData {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	company?: string;
}

let isOpen = $state(false);
let prefillData = $state<NewContactData | null>(null);
let editContactId = $state<string | null>(null);

export const contactModalStore = {
	get isOpen() {
		return isOpen;
	},
	get prefillData() {
		return prefillData;
	},
	get editContactId() {
		return editContactId;
	},

	open(data?: NewContactData) {
		prefillData = data || null;
		editContactId = null;
		isOpen = true;
	},

	openEdit(contactId: string) {
		editContactId = contactId;
		prefillData = null;
		isOpen = true;
	},

	close() {
		isOpen = false;
		prefillData = null;
		editContactId = null;
	},
};
