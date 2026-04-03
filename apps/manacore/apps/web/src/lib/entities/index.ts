// Types
export type { EntityDescriptor, EntityDisplayData, DropResult } from './types';

// Registry
export {
	registerEntity,
	getEntity,
	getEntityByDragType,
	canDrop,
	executeDrop,
	getAllEntities,
} from './registry';

// Register module entities eagerly — these are lightweight descriptor files
// with no heavy dependencies (stores are only called at drop time, not import time).
import '$lib/modules/todo/entity';
import '$lib/modules/calendar/entity';
import '$lib/modules/contacts/entity';

// Re-export for consumers that previously used lazy registration
export function ensureEntitiesRegistered(): void {
	// No-op — entities are now registered at import time
}
