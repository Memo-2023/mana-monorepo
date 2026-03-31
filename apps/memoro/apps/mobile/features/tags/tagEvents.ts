/**
 * Einfaches Event-System für Tag-Änderungen
 * Ermöglicht die Kommunikation zwischen Komponenten, wenn Tags hinzugefügt oder entfernt werden
 */

// Typdefinitionen für unsere Event-Callbacks
type TagAddedCallback = (data: { memoId: string; tagId: string }) => void;
type TagRemovedCallback = (data: { memoId: string; tagId: string }) => void;
type TagsBatchUpdatedCallback = (data: { memoIds: string[]; tagIds: string[] }) => void;
type TagPinnedCallback = (data: { tagId: string; isPinned: boolean }) => void;
type TagOrderChangedCallback = (data: { reorderedTagIds: string[] }) => void;
type TagCreatedCallback = (data: { tagId: string; tag: any }) => void;
type MemoPinnedCallback = (data: { memoId: string; isPinned: boolean }) => void;
type BlueprintPinnedCallback = (data: { blueprintId: string; isPinned: boolean }) => void;

// Einfacher EventEmitter für React Native
class SimpleEventEmitter {
	private listeners: Record<string, Function[]> = {};

	// Event auslösen
	emit(eventName: string, data: any): void {
		const eventListeners = this.listeners[eventName];
		if (eventListeners) {
			eventListeners.forEach((listener) => {
				try {
					listener(data);
				} catch (error) {
					console.debug(`Fehler beim Ausführen des Event-Listeners für ${eventName}:`, error);
				}
			});
		}
	}

	// Event-Listener hinzufügen
	on(eventName: string, callback: Function): void {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push(callback);
	}

	// Event-Listener entfernen
	off(eventName: string, callback: Function): void {
		const eventListeners = this.listeners[eventName];
		if (eventListeners) {
			this.listeners[eventName] = eventListeners.filter((listener) => listener !== callback);
		}
	}
}

// Erstelle einen globalen EventEmitter
const tagEventEmitter = new SimpleEventEmitter();

// Event-Typen
export const TAG_EVENTS = {
	TAG_ADDED: 'tag_added',
	TAG_REMOVED: 'tag_removed',
	TAGS_BATCH_UPDATED: 'tags_batch_updated',
	TAG_PINNED: 'tag_pinned',
	TAG_ORDER_CHANGED: 'tag_order_changed',
	TAG_CREATED: 'tag_created',
	MEMO_PINNED: 'memo_pinned',
	BLUEPRINT_PINNED: 'blueprint_pinned',
};

// Funktionen zum Auslösen von Events
export const tagEvents = {
	// Benachrichtigt über das Hinzufügen eines Tags zu einem Memo
	emitTagAdded: (memoId: string, tagId: string) => {
		tagEventEmitter.emit(TAG_EVENTS.TAG_ADDED, { memoId, tagId });
	},

	// Benachrichtigt über das Entfernen eines Tags von einem Memo
	emitTagRemoved: (memoId: string, tagId: string) => {
		tagEventEmitter.emit(TAG_EVENTS.TAG_REMOVED, { memoId, tagId });
	},

	// Benachrichtigt über Batch-Aktualisierungen von Tags (mehrere Memos oder Tags)
	emitTagsBatchUpdated: (memoIds: string[], tagIds: string[]) => {
		tagEventEmitter.emit(TAG_EVENTS.TAGS_BATCH_UPDATED, { memoIds, tagIds });
	},

	// Benachrichtigt über das Anheften/Abheften eines Tags
	emitTagPinned: (tagId: string, isPinned: boolean) => {
		tagEventEmitter.emit(TAG_EVENTS.TAG_PINNED, { tagId, isPinned });
	},

	// Benachrichtigt über Änderungen der Tag-Reihenfolge
	emitTagOrderChanged: (reorderedTagIds: string[]) => {
		tagEventEmitter.emit(TAG_EVENTS.TAG_ORDER_CHANGED, { reorderedTagIds });
	},

	// Benachrichtigt über die Erstellung eines neuen Tags
	emitTagCreated: (tagId: string, tag: any) => {
		tagEventEmitter.emit(TAG_EVENTS.TAG_CREATED, { tagId, tag });
	},

	// Benachrichtigt über das Anheften/Abheften eines Memos
	emitMemoPinned: (memoId: string, isPinned: boolean) => {
		tagEventEmitter.emit(TAG_EVENTS.MEMO_PINNED, { memoId, isPinned });
	},

	// Benachrichtigt über das Anheften/Abheften eines Blueprints
	emitBlueprintPinned: (blueprintId: string, isPinned: boolean) => {
		tagEventEmitter.emit(TAG_EVENTS.BLUEPRINT_PINNED, { blueprintId, isPinned });
	},

	// Registriert einen Listener für Tag-Hinzufügungen
	onTagAdded: (callback: TagAddedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.TAG_ADDED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.TAG_ADDED, callback);
	},

	// Registriert einen Listener für Tag-Entfernungen
	onTagRemoved: (callback: TagRemovedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.TAG_REMOVED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.TAG_REMOVED, callback);
	},

	// Registriert einen Listener für Batch-Aktualisierungen
	onTagsBatchUpdated: (callback: TagsBatchUpdatedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.TAGS_BATCH_UPDATED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.TAGS_BATCH_UPDATED, callback);
	},

	// Registriert einen Listener für Tag-Pinning-Änderungen
	onTagPinned: (callback: TagPinnedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.TAG_PINNED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.TAG_PINNED, callback);
	},

	// Registriert einen Listener für Tag-Reihenfolge-Änderungen
	onTagOrderChanged: (callback: TagOrderChangedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.TAG_ORDER_CHANGED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.TAG_ORDER_CHANGED, callback);
	},

	// Registriert einen Listener für Tag-Erstellung
	onTagCreated: (callback: TagCreatedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.TAG_CREATED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.TAG_CREATED, callback);
	},

	// Registriert einen Listener für Memo-Pinning-Änderungen
	onMemoPinned: (callback: MemoPinnedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.MEMO_PINNED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.MEMO_PINNED, callback);
	},

	// Registriert einen Listener für Blueprint-Pinning-Änderungen
	onBlueprintPinned: (callback: BlueprintPinnedCallback) => {
		tagEventEmitter.on(TAG_EVENTS.BLUEPRINT_PINNED, callback);
		return () => tagEventEmitter.off(TAG_EVENTS.BLUEPRINT_PINNED, callback);
	},
};

export default tagEvents;
