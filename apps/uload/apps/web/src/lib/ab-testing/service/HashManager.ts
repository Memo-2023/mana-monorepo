/**
 * Hash-based A/B Testing Manager
 * Manages variant assignment and persistence via URL hash
 */
export class HashManager {
	// Valid variants with versions
	private readonly validVariants = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];

	// Current traffic distribution (percentages must sum to 100)
	private readonly distribution: Record<string, number> = {
		control: 40, // Baseline
		a1: 20, // Value-focused variant
		b1: 20, // Social proof variant
		c1: 20, // Feature-focused variant
	};

	// Storage key for backup
	private readonly storageKey = 'uload_ab_variant';

	// Debug mode flag
	private debugMode = false;

	constructor() {
		// Check for debug mode
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			this.debugMode = params.get('debug') === 'true';
		}
	}

	/**
	 * Get the current variant for the user
	 * Priority: URL hash > localStorage > new assignment
	 */
	getVariant(): string {
		if (typeof window === 'undefined') {
			return 'control';
		}

		// Check for forced variant (testing)
		const forced = this.getForcedVariant();
		if (forced !== null) {
			this.log(`Forced variant: ${forced}`);
			return forced;
		}

		// Check existing hash
		const hash = window.location.hash.slice(1);
		if (hash && this.isValidVariant(hash)) {
			this.log(`Using hash variant: ${hash}`);
			this.storeVariant(hash);
			return hash;
		}

		// Check localStorage backup
		const stored = this.getStoredVariant();
		if (stored && this.isValidVariant(stored)) {
			this.log(`Using stored variant: ${stored}`);
			this.setHash(stored);
			return stored;
		}

		// Assign new variant
		const newVariant = this.assignRandomVariant();
		this.log(`Assigned new variant: ${newVariant}`);
		this.setHash(newVariant);
		this.storeVariant(newVariant);
		return newVariant;
	}

	/**
	 * Check if a variant is valid
	 */
	private isValidVariant(variant: string): boolean {
		return variant === 'control' || this.validVariants.includes(variant);
	}

	/**
	 * Assign a random variant based on distribution weights
	 */
	private assignRandomVariant(): string {
		const random = Math.random() * 100;
		let cumulative = 0;

		for (const [variant, weight] of Object.entries(this.distribution)) {
			cumulative += weight;
			if (random <= cumulative) {
				return variant;
			}
		}

		// Fallback to control
		return 'control';
	}

	/**
	 * Set the URL hash
	 */
	private setHash(variant: string): void {
		if (typeof window !== 'undefined') {
			// Don't set hash for control to keep URL clean
			if (variant === 'control') {
				// Remove hash if it exists
				if (window.location.hash) {
					history.replaceState(null, '', window.location.pathname + window.location.search);
				}
			} else {
				window.location.hash = variant;
			}
		}
	}

	/**
	 * Store variant in localStorage
	 */
	private storeVariant(variant: string): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				localStorage.setItem(this.storageKey, variant);
				// Also store timestamp for analytics
				localStorage.setItem(`${this.storageKey}_timestamp`, new Date().toISOString());
			} catch (e) {
				console.warn('Could not store variant in localStorage:', e);
			}
		}
	}

	/**
	 * Get stored variant from localStorage
	 */
	private getStoredVariant(): string | null {
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				return localStorage.getItem(this.storageKey);
			} catch (e) {
				console.warn('Could not read variant from localStorage:', e);
			}
		}
		return null;
	}

	/**
	 * Get forced variant from URL params (for testing)
	 */
	private getForcedVariant(): string | null {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const forced = params.get('force') || params.get('variant');

			if (forced && this.isValidVariant(forced)) {
				return forced;
			}
		}
		return null;
	}

	/**
	 * Reset variant assignment (for testing)
	 */
	reset(): void {
		if (typeof window !== 'undefined') {
			// Clear hash
			if (window.location.hash) {
				history.replaceState(null, '', window.location.pathname + window.location.search);
			}

			// Clear storage
			if (window.localStorage) {
				localStorage.removeItem(this.storageKey);
				localStorage.removeItem(`${this.storageKey}_timestamp`);
			}

			this.log('Variant assignment reset');
		}
	}

	/**
	 * Get all active variants (for debugging)
	 */
	getActiveVariants(): string[] {
		return ['control', ...Object.keys(this.distribution).filter((v) => v !== 'control')];
	}

	/**
	 * Get current distribution (for debugging)
	 */
	getDistribution(): Record<string, number> {
		return { ...this.distribution };
	}

	/**
	 * Log debug messages
	 */
	private log(message: string): void {
		if (this.debugMode) {
			console.log(`[A/B Testing] ${message}`);
		}
	}

	/**
	 * Check if we should show debug info
	 */
	isDebugMode(): boolean {
		return this.debugMode;
	}
}

// Export singleton instance
export const hashManager = new HashManager();
