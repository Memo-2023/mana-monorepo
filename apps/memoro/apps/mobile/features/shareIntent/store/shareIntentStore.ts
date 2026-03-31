import { create } from 'zustand';

export interface ShareIntentFile {
	uri: string;
	name: string;
	mimeType?: string;
	durationMs?: number;
}

export interface PendingIntent {
	type: 'file' | 'text' | 'url';
	files?: ShareIntentFile[];
	text?: string;
	webUrl?: string;
	receivedAt: number;
}

interface ShareIntentState {
	pendingIntent: PendingIntent | null;
	isProcessing: boolean;
	setPendingIntent: (intent: PendingIntent | null) => void;
	setIsProcessing: (processing: boolean) => void;
	clear: () => void;
}

export const useShareIntentStore = create<ShareIntentState>((set) => ({
	pendingIntent: null,
	isProcessing: false,
	setPendingIntent: (intent) => set({ pendingIntent: intent }),
	setIsProcessing: (processing) => set({ isProcessing: processing }),
	clear: () => set({ pendingIntent: null, isProcessing: false }),
}));
