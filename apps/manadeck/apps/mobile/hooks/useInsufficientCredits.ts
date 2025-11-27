import { useState } from 'react';
import { extractCreditError, type InsufficientCreditsError } from '../types/credits';

interface InsufficientCreditsState {
	visible: boolean;
	requiredCredits: number;
	availableCredits: number;
	operation: string;
}

/**
 * Hook to manage insufficient credits modal state
 */
export function useInsufficientCredits() {
	const [state, setState] = useState<InsufficientCreditsState>({
		visible: false,
		requiredCredits: 0,
		availableCredits: 0,
		operation: 'this operation',
	});

	/**
	 * Show insufficient credits modal
	 */
	const showInsufficientCredits = (error: InsufficientCreditsError) => {
		setState({
			visible: true,
			requiredCredits: error.requiredCredits,
			availableCredits: error.availableCredits,
			operation: error.operation || 'this operation',
		});
	};

	/**
	 * Hide insufficient credits modal
	 */
	const hideInsufficientCredits = () => {
		setState((prev) => ({ ...prev, visible: false }));
	};

	/**
	 * Handle API error and show modal if it's a credit error
	 * Returns true if it was a credit error, false otherwise
	 */
	const handleCreditError = (error: any): boolean => {
		const creditError = extractCreditError(error);
		if (creditError) {
			showInsufficientCredits(creditError);
			return true;
		}
		return false;
	};

	return {
		...state,
		showInsufficientCredits,
		hideInsufficientCredits,
		handleCreditError,
	};
}
