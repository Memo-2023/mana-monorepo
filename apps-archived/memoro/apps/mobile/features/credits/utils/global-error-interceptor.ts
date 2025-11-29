import { isInsufficientCreditsError } from './insufficient-credits-handler';

type ErrorHandler = (error: any) => void;

class GlobalErrorInterceptor {
	private insufficientCreditsHandler?: ErrorHandler;
	private originalFetch?: typeof fetch;

	/**
	 * Set handler for insufficient credits errors
	 */
	setInsufficientCreditsHandler(handler: ErrorHandler) {
		this.insufficientCreditsHandler = handler;
	}

	/**
	 * Initialize the interceptor
	 */
	initialize() {
		if (this.originalFetch) {
			return; // Already initialized
		}

		this.originalFetch = global.fetch;

		// Override global fetch
		global.fetch = async (...args) => {
			try {
				const response = await this.originalFetch!(...args);

				// If it's a 402 error, try to parse the body
				if (response.status === 402) {
					const clonedResponse = response.clone();
					try {
						const errorData = await clonedResponse.json();
						if (this.insufficientCreditsHandler && isInsufficientCreditsError(errorData)) {
							this.insufficientCreditsHandler(errorData);
						}
					} catch (e) {
						// Failed to parse JSON, ignore
					}
				}

				return response;
			} catch (error) {
				// Network errors, etc.
				throw error;
			}
		};
	}

	/**
	 * Clean up the interceptor
	 */
	cleanup() {
		if (this.originalFetch) {
			global.fetch = this.originalFetch;
			this.originalFetch = undefined;
		}
	}
}

export const globalErrorInterceptor = new GlobalErrorInterceptor();
