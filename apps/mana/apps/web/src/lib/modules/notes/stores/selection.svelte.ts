/**
 * Notes focus signal — transient, in-memory only.
 *
 * Used by cross-module actions (e.g. "Kontext → Als Notiz speichern")
 * to ask the Notes ListView to open a specific note in its inline
 * editor and scroll it into view. Cleared by the ListView once
 * handled so the signal doesn't survive remounts.
 */

function createNotesSelectionStore() {
	let focusedNoteId = $state<string | null>(null);

	return {
		get focusedNoteId() {
			return focusedNoteId;
		},
		focusNote(id: string) {
			focusedNoteId = id;
		},
		clearFocus() {
			focusedNoteId = null;
		},
	};
}

export const notesSelectionStore = createNotesSelectionStore();
