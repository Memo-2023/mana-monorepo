/**
 * IFrame Pool for performance optimization
 * Reuses iframe elements to avoid constant creation/destruction
 */
class IFramePool {
	private pool: HTMLIFrameElement[] = [];
	private inUse: Set<HTMLIFrameElement> = new Set();
	private maxSize: number = 10;
	private minSize: number = 2;

	constructor() {
		// Pre-create minimum number of iframes only in browser
		if (typeof document !== 'undefined') {
			this.warmUp();
		}
	}

	/**
	 * Pre-create iframes for immediate use
	 */
	private warmUp() {
		for (let i = 0; i < this.minSize; i++) {
			this.pool.push(this.createIFrame());
		}
	}

	/**
	 * Create a new iframe element
	 */
	private createIFrame(): HTMLIFrameElement {
		if (typeof document === 'undefined') {
			// Return dummy object for SSR
			return {} as HTMLIFrameElement;
		}
		const iframe = document.createElement('iframe');

		// Security settings
		iframe.setAttribute('sandbox', 'allow-same-origin');
		iframe.setAttribute('loading', 'lazy');

		// Styling
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = 'none';
		iframe.style.background = 'transparent';

		// Accessibility
		iframe.setAttribute('title', 'Card Content');

		return iframe;
	}

	/**
	 * Acquire an iframe from the pool
	 */
	acquire(): HTMLIFrameElement {
		let iframe: HTMLIFrameElement;

		// Try to get from pool
		if (this.pool.length > 0) {
			iframe = this.pool.pop()!;
		} else if (this.inUse.size < this.maxSize) {
			// Create new if under max limit
			iframe = this.createIFrame();
		} else {
			// Fallback: create new iframe (will exceed max)
			console.warn('IFrame pool exceeded maximum size');
			iframe = this.createIFrame();
		}

		// Mark as in use
		this.inUse.add(iframe);

		// Reset iframe
		this.resetIFrame(iframe);

		return iframe;
	}

	/**
	 * Release an iframe back to the pool
	 */
	release(iframe: HTMLIFrameElement) {
		if (typeof document === 'undefined') {
			return;
		}
		// Remove from DOM if attached
		if (iframe.parentNode) {
			iframe.parentNode.removeChild(iframe);
		}

		// Remove from in-use set
		this.inUse.delete(iframe);

		// Clean up iframe
		this.cleanIFrame(iframe);

		// Return to pool if not exceeding max
		if (this.pool.length < this.maxSize) {
			this.pool.push(iframe);
		}
		// Otherwise let it be garbage collected
	}

	/**
	 * Reset iframe for reuse
	 */
	private resetIFrame(iframe: HTMLIFrameElement) {
		if (typeof document === 'undefined' || !iframe.srcdoc) {
			return;
		}
		// Clear content
		iframe.srcdoc = '';
		iframe.src = 'about:blank';

		// Clear event listeners
		iframe.onload = null;
		iframe.onerror = null;

		// Reset styles that might have been changed
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.opacity = '1';
		iframe.style.visibility = 'visible';
	}

	/**
	 * Clean iframe before returning to pool
	 */
	private cleanIFrame(iframe: HTMLIFrameElement) {
		if (typeof document === 'undefined') {
			return;
		}
		try {
			// Clear iframe content
			const doc = iframe.contentDocument || iframe.contentWindow?.document;
			if (doc) {
				doc.open();
				doc.write('');
				doc.close();
			}
		} catch (e) {
			// Cross-origin restriction, ignore
		}

		// Reset iframe
		this.resetIFrame(iframe);
	}

	/**
	 * Get pool statistics
	 */
	getStats() {
		return {
			poolSize: this.pool.length,
			inUse: this.inUse.size,
			total: this.pool.length + this.inUse.size,
			maxSize: this.maxSize
		};
	}

	/**
	 * Clear the entire pool
	 */
	clear() {
		// Clean all pooled iframes
		this.pool.forEach((iframe) => {
			this.cleanIFrame(iframe);
		});
		this.pool = [];

		// Clean all in-use iframes
		this.inUse.forEach((iframe) => {
			if (iframe.parentNode) {
				iframe.parentNode.removeChild(iframe);
			}
			this.cleanIFrame(iframe);
		});
		this.inUse.clear();
	}

	/**
	 * Adjust pool size limits
	 */
	configure(options: { maxSize?: number; minSize?: number }) {
		if (options.maxSize !== undefined) {
			this.maxSize = Math.max(1, options.maxSize);
		}
		if (options.minSize !== undefined) {
			this.minSize = Math.max(0, Math.min(options.minSize, this.maxSize));
		}

		// Adjust current pool if needed
		while (this.pool.length > this.maxSize) {
			this.pool.pop();
		}
		while (this.pool.length < this.minSize) {
			this.pool.push(this.createIFrame());
		}
	}
}

// Create singleton instance
export const iframePool = new IFramePool();

// Clean up on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		iframePool.clear();
	});
}
