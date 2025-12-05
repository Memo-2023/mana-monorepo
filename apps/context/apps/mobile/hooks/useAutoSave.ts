import { useCallback, useEffect, useRef, useState } from 'react';
// Simple debounce implementation to avoid lodash dependency
const debounce = <T extends (...args: any[]) => any>(
	func: T,
	wait: number
): T & { cancel: () => void } => {
	let timeout: NodeJS.Timeout | null = null;

	const debounced = ((...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as T & { cancel: () => void };

	debounced.cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	return debounced;
};
import { EDITOR_CONFIG } from '~/config/editorConfig';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions {
	delay?: number;
	enabled?: boolean;
	minContentLength?: number;
	onSave?: (content: string) => Promise<void>;
	onError?: (error: Error) => void;
}

export interface AutoSaveResult {
	saveState: SaveState;
	forceSave: () => Promise<void>;
	lastSaved: Date | null;
	error: Error | null;
}

/**
 * Custom Hook für optimierte Auto-Save-Funktionalität
 * Ersetzt die komplexe Auto-Save-Logik aus dem DocumentEditor
 */
export const useAutoSave = (content: string, options: AutoSaveOptions = {}): AutoSaveResult => {
	const {
		delay = EDITOR_CONFIG.AUTO_SAVE_DELAY,
		enabled = true,
		minContentLength = EDITOR_CONFIG.MIN_CONTENT_LENGTH,
		onSave,
		onError,
	} = options;

	const [saveState, setSaveState] = useState<SaveState>('idle');
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [error, setError] = useState<Error | null>(null);

	const saveInProgress = useRef(false);
	const lastContent = useRef<string>('');
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Debounced save function
	const debouncedSave = useCallback(
		debounce(async (contentToSave: string) => {
			if (!enabled || !onSave || saveInProgress.current) {
				return;
			}

			// Prüfe ob Content die Mindestlänge erreicht
			if (contentToSave.length < minContentLength) {
				return;
			}

			// Prüfe ob sich der Content geändert hat
			if (contentToSave === lastContent.current) {
				return;
			}

			try {
				saveInProgress.current = true;
				setSaveState('saving');
				setError(null);

				await onSave(contentToSave);

				lastContent.current = contentToSave;
				setLastSaved(new Date());
				setSaveState('saved');

				// Nach 2 Sekunden zurück zu 'idle'
				setTimeout(() => {
					setSaveState('idle');
				}, 2000);
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Save failed');
				setError(error);
				setSaveState('error');
				onError?.(error);
			} finally {
				saveInProgress.current = false;
			}
		}, delay),
		[enabled, onSave, minContentLength, delay, onError]
	);

	// Force save function (immediate save)
	const forceSave = useCallback(async () => {
		if (!enabled || !onSave || saveInProgress.current) {
			return;
		}

		// Cancel any pending debounced save
		debouncedSave.cancel();

		try {
			saveInProgress.current = true;
			setSaveState('saving');
			setError(null);

			await onSave(content);

			lastContent.current = content;
			setLastSaved(new Date());
			setSaveState('saved');

			setTimeout(() => {
				setSaveState('idle');
			}, 2000);
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Save failed');
			setError(error);
			setSaveState('error');
			onError?.(error);
		} finally {
			saveInProgress.current = false;
		}
	}, [content, enabled, onSave, debouncedSave, onError]);

	// Trigger auto-save when content changes
	useEffect(() => {
		if (enabled && content !== lastContent.current) {
			debouncedSave(content);
		}
	}, [content, enabled, debouncedSave]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			debouncedSave.cancel();
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [debouncedSave]);

	// Handle large text paste (immediate save)
	useEffect(() => {
		if (enabled && content.length > EDITOR_CONFIG.LARGE_TEXT_THRESHOLD) {
			const contentDiff = content.length - lastContent.current.length;
			if (contentDiff > EDITOR_CONFIG.LARGE_TEXT_THRESHOLD) {
				// Large paste detected, save immediately
				debouncedSave.cancel();
				forceSave();
			}
		}
	}, [content, enabled, debouncedSave, forceSave]);

	return {
		saveState,
		forceSave,
		lastSaved,
		error,
	};
};
