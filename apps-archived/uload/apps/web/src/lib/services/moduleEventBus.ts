/**
 * Event Bus for module communication
 * Allows modules to communicate without direct coupling
 */

export interface ModuleEvent {
	type: string;
	moduleId: string;
	data?: any;
	timestamp: number;
}

export type EventHandler = (event: ModuleEvent) => void;

class ModuleEventBus {
	private listeners: Map<string, Set<EventHandler>> = new Map();
	private eventHistory: ModuleEvent[] = [];
	private maxHistorySize: number = 100;
	private debug: boolean = false;

	/**
	 * Subscribe to an event
	 */
	on(eventType: string, handler: EventHandler): () => void {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}

		this.listeners.get(eventType)!.add(handler);

		if (this.debug) {
			console.log(`[EventBus] Subscribed to ${eventType}`);
		}

		// Return unsubscribe function
		return () => {
			this.off(eventType, handler);
		};
	}

	/**
	 * Subscribe to an event (only once)
	 */
	once(eventType: string, handler: EventHandler): () => void {
		const wrappedHandler: EventHandler = (event) => {
			handler(event);
			this.off(eventType, wrappedHandler);
		};

		return this.on(eventType, wrappedHandler);
	}

	/**
	 * Unsubscribe from an event
	 */
	off(eventType: string, handler: EventHandler) {
		const handlers = this.listeners.get(eventType);
		if (handlers) {
			handlers.delete(handler);
			if (handlers.size === 0) {
				this.listeners.delete(eventType);
			}
		}

		if (this.debug) {
			console.log(`[EventBus] Unsubscribed from ${eventType}`);
		}
	}

	/**
	 * Emit an event
	 */
	emit(eventType: string, data: Omit<ModuleEvent, 'type' | 'timestamp'>): void {
		const event: ModuleEvent = {
			type: eventType,
			...data,
			timestamp: Date.now(),
		};

		// Add to history
		this.addToHistory(event);

		// Notify all listeners
		const handlers = this.listeners.get(eventType);
		if (handlers) {
			handlers.forEach((handler) => {
				try {
					handler(event);
				} catch (error) {
					console.error(`[EventBus] Error in event handler for ${eventType}:`, error);
				}
			});
		}

		// Also notify wildcard listeners
		const wildcardHandlers = this.listeners.get('*');
		if (wildcardHandlers) {
			wildcardHandlers.forEach((handler) => {
				try {
					handler(event);
				} catch (error) {
					console.error('[EventBus] Error in wildcard handler:', error);
				}
			});
		}

		if (this.debug) {
			console.log(`[EventBus] Emitted ${eventType}:`, data);
		}
	}

	/**
	 * Emit an event and wait for responses
	 */
	async request<T = any>(
		eventType: string,
		data: Omit<ModuleEvent, 'type' | 'timestamp'>,
		timeout: number = 5000
	): Promise<T[]> {
		return new Promise((resolve, reject) => {
			const responses: T[] = [];
			const responseEvent = `${eventType}:response`;
			let timeoutId: NodeJS.Timeout;

			// Set up response listener
			const unsubscribe = this.on(responseEvent, (event) => {
				if (event.data) {
					responses.push(event.data);
				}
			});

			// Set up timeout
			timeoutId = setTimeout(() => {
				unsubscribe();
				resolve(responses);
			}, timeout);

			// Emit the request
			this.emit(eventType, data);

			// Clean up on first response (for single responses)
			// For multiple responses, rely on timeout
			if (responses.length > 0) {
				clearTimeout(timeoutId);
				unsubscribe();
				resolve(responses);
			}
		});
	}

	/**
	 * Clear all listeners
	 */
	clear() {
		this.listeners.clear();
		this.eventHistory = [];

		if (this.debug) {
			console.log('[EventBus] Cleared all listeners and history');
		}
	}

	/**
	 * Get event history
	 */
	getHistory(eventType?: string): ModuleEvent[] {
		if (eventType) {
			return this.eventHistory.filter((event) => event.type === eventType);
		}
		return [...this.eventHistory];
	}

	/**
	 * Clear event history
	 */
	clearHistory() {
		this.eventHistory = [];
	}

	/**
	 * Add event to history
	 */
	private addToHistory(event: ModuleEvent) {
		this.eventHistory.push(event);

		// Trim history if it exceeds max size
		if (this.eventHistory.length > this.maxHistorySize) {
			this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
		}
	}

	/**
	 * Enable/disable debug mode
	 */
	setDebug(enabled: boolean) {
		this.debug = enabled;
	}

	/**
	 * Get statistics
	 */
	getStats() {
		const stats: Record<string, number> = {};
		this.listeners.forEach((handlers, eventType) => {
			stats[eventType] = handlers.size;
		});

		return {
			listeners: stats,
			totalListeners: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
			eventTypes: this.listeners.size,
			historySize: this.eventHistory.length,
		};
	}
}

// Create singleton instance
export const moduleEventBus = new ModuleEventBus();

// Common event types
export const MODULE_EVENTS = {
	// Module lifecycle
	MODULE_MOUNTED: 'module:mounted',
	MODULE_DESTROYED: 'module:destroyed',
	MODULE_UPDATED: 'module:updated',

	// Module interactions
	MODULE_CLICKED: 'module:clicked',
	MODULE_HOVERED: 'module:hovered',
	MODULE_FOCUSED: 'module:focused',

	// Data events
	DATA_CHANGED: 'data:changed',
	DATA_LOADED: 'data:loaded',
	DATA_ERROR: 'data:error',

	// Communication
	REQUEST_DATA: 'request:data',
	PROVIDE_DATA: 'provide:data',

	// State changes
	STATE_CHANGED: 'state:changed',
	VISIBILITY_CHANGED: 'visibility:changed',

	// User actions
	ACTION_TRIGGERED: 'action:triggered',
	LINK_CLICKED: 'link:clicked',

	// Card-level events
	CARD_SAVED: 'card:saved',
	CARD_DELETED: 'card:deleted',
	CARD_CONVERTED: 'card:converted',
} as const;

// Type for module event types
export type ModuleEventType = (typeof MODULE_EVENTS)[keyof typeof MODULE_EVENTS];

// Enable debug mode in development
if (import.meta.env.DEV) {
	moduleEventBus.setDebug(true);

	// Expose to window for debugging
	if (typeof window !== 'undefined') {
		(window as any).__MODULE_EVENT_BUS__ = moduleEventBus;
	}
}
