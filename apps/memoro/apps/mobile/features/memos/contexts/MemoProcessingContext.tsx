import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { useMemoStore } from '../store/memoStore';
import { useAllMemoUpdates } from './MemoRealtimeContext';
import { Memo } from '../types/memo.types';

// Define types for memo processing state
export interface MemoProcessingState {
	id: string;
	title: string | null;
	transcriptionStatus: string | null;
	headlineStatus: string | null;
	displayTitle: string;
	// Track if this is a new memo being processed
	isNewUpload: boolean;
}

interface MemoProcessingContextType {
	// The current memo being processed
	currentMemo: Memo | null;
	// The stable processing state that won't cause re-renders
	processingState: MemoProcessingState | null;
	// A function to get the current display title without re-renders
	getDisplayTitle: (memoId: string) => string;
	// A function to register a component for updates
	registerForUpdates: (callback: () => void) => () => void;
	// Force update the title only
	forceUpdateTitle: () => void;
}

// Create the context with a default value
const MemoProcessingContext = createContext<MemoProcessingContextType>({
	currentMemo: null,
	processingState: null,
	getDisplayTitle: () => '',
	registerForUpdates: () => () => {},
	forceUpdateTitle: () => {},
});

// Custom hook to use the context
export const useMemoProcessing = () => useContext(MemoProcessingContext);

export const MemoProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Reference to the current memo
	const currentMemoRef = useRef<any>(null);

	// Reference to the processing state (using ref to avoid re-renders)
	const processingStateRef = useRef<MemoProcessingState | null>(null);

	// Force update counter (used only for the title component)
	const [titleUpdateCounter, setTitleUpdateCounter] = useState(0);

	// Store callbacks for components that need updates
	const callbacksRef = useRef<Set<() => void>>(new Set());

	// Register a component for updates
	const registerForUpdates = useCallback((callback: () => void) => {
		callbacksRef.current.add(callback);

		// Return cleanup function
		return () => {
			callbacksRef.current.delete(callback);
		};
	}, []);

	// Force update only the title component
	const forceUpdateTitle = useCallback(() => {
		setTitleUpdateCounter((prev) => prev + 1);
	}, []);

	// Get the current display title without causing re-renders
	const getDisplayTitle = useCallback((memoId: string): string => {
		if (!processingStateRef.current || processingStateRef.current.id !== memoId) {
			return '';
		}

		return processingStateRef.current.displayTitle;
	}, []);

	// Helper function to calculate display title based on processing state
	const calculateDisplayTitle = useCallback(
		(
			title: string | null,
			transcriptionStatus: string | null,
			headlineStatus: string | null
		): string => {
			console.debug('🔍 calculateDisplayTitle inputs:', {
				title,
				transcriptionStatus,
				headlineStatus,
			});

			// HIGHEST PRIORITY: If headline generation is completed AND we have a real title, use it
			if (
				headlineStatus === 'completed' &&
				title &&
				title !== 'Unbenanntes Memo' &&
				title !== 'Neue Aufnahme' &&
				title.trim() !== ''
			) {
				console.debug('🌟 Using final headline title:', title);
				return title;
			}

			// If headline is completed but no valid title, this is an error state
			if (
				headlineStatus === 'completed' &&
				(!title || title === 'Unbenanntes Memo' || title === 'Neue Aufnahme' || title.trim() === '')
			) {
				console.debug(
					'⚠️ Headline completed but no valid title, continuing to show generation status'
				);
				return 'Headline generating...';
			}

			// If we have a real title (not default), use it regardless of status
			if (title && title !== 'Unbenanntes Memo' && title !== 'Neue Aufnahme') {
				console.debug('👍 Using real title:', title);
				return title;
			}

			// Show processing status based on current state
			if (transcriptionStatus === 'processing') {
				console.debug('📝 Showing transcription status');
				return 'Memo transcribing...';
			}

			if (
				transcriptionStatus === 'completed' &&
				(!headlineStatus || headlineStatus === 'processing')
			) {
				console.debug('📝 Showing headline generation status');
				return 'Headline generating...';
			}

			// Default
			console.debug('📝 Using default title');
			return title || 'New Recording';
		},
		[]
	);

	// Update the processing state without causing re-renders
	const updateProcessingState = useCallback(
		(newState: Partial<MemoProcessingState>) => {
			if (!processingStateRef.current && !newState.id) {
				return;
			}

			console.debug('📝 Updating processing state:', {
				id: newState.id || processingStateRef.current?.id,
				title: newState.title !== undefined ? newState.title : processingStateRef.current?.title,
				transcriptionStatus:
					newState.transcriptionStatus !== undefined
						? newState.transcriptionStatus
						: processingStateRef.current?.transcriptionStatus,
				headlineStatus:
					newState.headlineStatus !== undefined
						? newState.headlineStatus
						: processingStateRef.current?.headlineStatus,
			});

			// Calculate the new display title
			const newDisplayTitle = calculateDisplayTitle(
				newState.title !== undefined ? newState.title : processingStateRef.current?.title || null,
				newState.transcriptionStatus !== undefined
					? newState.transcriptionStatus
					: processingStateRef.current?.transcriptionStatus || null,
				newState.headlineStatus !== undefined
					? newState.headlineStatus
					: processingStateRef.current?.headlineStatus || null
			);

			console.debug(`📝 New display title: "${newDisplayTitle}"`);

			// Update the ref
			processingStateRef.current = {
				...(processingStateRef.current || {
					id: newState.id as string,
					title: null,
					transcriptionStatus: null,
					headlineStatus: null,
					displayTitle: '',
					isNewUpload: false,
				}),
				...newState,
				// Always recalculate display title when state changes
				displayTitle: newDisplayTitle,
			} as MemoProcessingState;

			// Force update the title component
			forceUpdateTitle();
			console.debug('📝 Forced title update');

			// Notify all registered components
			callbacksRef.current.forEach((callback) => callback());
			console.debug(`📝 Notified ${callbacksRef.current.size} registered components`);
		},
		[calculateDisplayTitle, forceUpdateTitle]
	);

	// Handle real-time memo updates using centralized service
	useAllMemoUpdates(
		(payload) => {
			if (payload.event === 'UPDATE') {
				console.debug('🔄 REALTIME UPDATE for memo:', payload.new.id);
				console.debug('📝 REALTIME UPDATE memo title:', payload.new.title);
				console.debug(
					'📝 REALTIME UPDATE transcription status:',
					payload.new.metadata?.processing?.transcription?.status
				);
				console.debug(
					'📝 REALTIME UPDATE headline status:',
					payload.new.metadata?.processing?.headline_and_intro?.status
				);

				// Check if this is the current memo
				const isCurrentMemo =
					currentMemoRef.current && currentMemoRef.current.id === payload.new.id;
				console.debug(`📝 Is current memo: ${isCurrentMemo ? 'YES' : 'NO'}`);

				if (isCurrentMemo) {
					// Check if this is a headline completion update
					const isHeadlineCompleted =
						payload.new.metadata?.processing?.headline_and_intro?.status === 'completed' &&
						payload.new.title &&
						payload.new.title !== 'Unbenanntes Memo' &&
						payload.new.title !== 'Neue Aufnahme';

					if (isHeadlineCompleted) {
						console.debug('✨ HEADLINE COMPLETED with title:', payload.new.title);
					}

					// Update the processing state
					updateProcessingState({
						id: payload.new.id,
						title: payload.new.title,
						transcriptionStatus: payload.new.metadata?.processing?.transcription?.status,
						headlineStatus: payload.new.metadata?.processing?.headline_and_intro?.status,
						// Force an immediate title update for headline completion
						displayTitle: isHeadlineCompleted ? payload.new.title : undefined,
					});

					// Update the current memo ref without causing re-renders
					currentMemoRef.current = {
						...currentMemoRef.current,
						title: payload.new.title,
						metadata: payload.new.metadata,
					};

					// For headline completion, force an additional update after a short delay
					// This ensures the title update is applied even if there are race conditions
					if (isHeadlineCompleted) {
						setTimeout(() => {
							console.debug('⏱️ Forcing delayed update for headline completion');
							forceUpdateTitle();
						}, 500);
					}
				}
			} else if (payload.event === 'INSERT') {
				console.debug('🆕 NEW MEMO CREATED:', payload.new.id);

				// Set as current memo if we don't have one yet
				if (!currentMemoRef.current) {
					currentMemoRef.current = {
						id: payload.new.id,
						title: payload.new.title,
						metadata: payload.new.metadata,
						timestamp: new Date(payload.new.created_at || Date.now()),
						source: payload.new.source,
					};

					// Initialize processing state
					updateProcessingState({
						id: payload.new.id,
						title: payload.new.title,
						transcriptionStatus: payload.new.metadata?.processing?.transcription?.status,
						headlineStatus: payload.new.metadata?.processing?.headline_and_intro?.status,
						isNewUpload: true,
					});
				}
			}
		},
		[updateProcessingState]
	);

	// Listen for changes to the latest memo from the store
	useEffect(() => {
		// Define the selector function
		const selector = (state: { latestMemo: Memo | null }) => state.latestMemo;

		// Define the listener function with proper type
		const listener = (latestMemo: Memo | null) => {
			if (latestMemo && (!currentMemoRef.current || currentMemoRef.current.id !== latestMemo.id)) {
				// Update current memo ref
				currentMemoRef.current = latestMemo;

				// Initialize processing state
				updateProcessingState({
					id: latestMemo.id,
					title: latestMemo.title || null,
					transcriptionStatus: latestMemo.metadata?.processing?.transcription?.status || null,
					headlineStatus: latestMemo.metadata?.processing?.headline_and_intro?.status || null,
					isNewUpload: false,
				});
			}
		};

		// Subscribe to store changes
		// Using the store's getState and setState to manually track changes
		// since the subscribe method might have different signatures
		let previousMemo = selector(useMemoStore.getState());

		const unsubscribe = useMemoStore.subscribe((state) => {
			const currentMemo = selector(state);
			if (currentMemo !== previousMemo) {
				previousMemo = currentMemo;
				listener(currentMemo);
			}
		});

		return unsubscribe;
	}, [updateProcessingState]);

	// Context value
	const value = {
		currentMemo: currentMemoRef.current,
		processingState: processingStateRef.current,
		getDisplayTitle,
		registerForUpdates,
		forceUpdateTitle,
	};

	return <MemoProcessingContext.Provider value={value}>{children}</MemoProcessingContext.Provider>;
};
