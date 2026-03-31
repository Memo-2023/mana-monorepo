import { useEffect, RefObject } from 'react';

interface UseAutoFocusOptions {
	delay?: number;
	condition?: boolean;
}

/**
 * Custom hook to auto-focus an input element with proper cleanup
 *
 * @param ref - Reference to the input element
 * @param options - Options for auto-focus behavior
 * @param options.delay - Delay in milliseconds before focusing (default: 100)
 * @param options.condition - Additional condition that must be true to focus (default: true)
 *
 * @example
 * const inputRef = useRef<TextInput>(null);
 * useAutoFocus(inputRef, { delay: 300 });
 */
export function useAutoFocus<T extends { focus: () => void }>(
	ref: RefObject<T>,
	options: UseAutoFocusOptions = {}
) {
	const { delay = 100, condition = true } = options;

	useEffect(() => {
		if (condition && ref.current) {
			const timer = setTimeout(() => {
				ref.current?.focus();
			}, delay);

			return () => clearTimeout(timer);
		}
	}, [ref, delay, condition]);
}
