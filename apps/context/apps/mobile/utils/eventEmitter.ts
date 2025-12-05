// Einfacher Event-Emitter für die App
type EventCallback = (...args: any[]) => void;

class EventEmitter {
	private events: Record<string, EventCallback[]> = {};

	// Event registrieren
	on(event: string, callback: EventCallback): void {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(callback);
	}

	// Event deregistrieren
	off(event: string, callback: EventCallback): void {
		if (!this.events[event]) return;
		this.events[event] = this.events[event].filter((cb) => cb !== callback);
	}

	// Event auslösen
	emit(event: string, ...args: any[]): void {
		if (!this.events[event]) return;
		this.events[event].forEach((callback) => {
			try {
				callback(...args);
			} catch (error) {
				console.error(`Fehler beim Ausführen des Event-Handlers für ${event}:`, error);
			}
		});
	}
}

// Singleton-Instanz
export const eventEmitter = new EventEmitter();

// Event-Namen als Konstanten
export const EVENTS = {
	TOKEN_BALANCE_UPDATED: 'TOKEN_BALANCE_UPDATED',
};
