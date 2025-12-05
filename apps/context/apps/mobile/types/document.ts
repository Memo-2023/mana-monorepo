export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface DocumentSaveState {
	saveState: SaveState;
	lastSavedAt: Date | null;
	hasUnsavedChanges: boolean;
	error: string | null;
}

export interface UseDocumentSaveOptions {
	documentId: string | null;
	content: string;
	title: string;
	tags: string[];
	metadata?: any;
	isNewDocument: boolean;
	spaceId: string;
	minContentLength?: number;
	debounceDelay?: number;
	onDocumentCreated?: (documentId: string) => void;
	onSaveSuccess?: () => void;
	onSaveError?: (error: string) => void;
}
