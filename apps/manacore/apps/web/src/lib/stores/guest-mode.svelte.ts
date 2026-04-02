/**
 * Guest Mode — local re-export from shared-stores.
 * Avoids linter stripping the import from layout files.
 */
export {
	createGuestMode,
	type GuestMode,
	type GuestModeNotification,
} from '@manacore/shared-stores';
