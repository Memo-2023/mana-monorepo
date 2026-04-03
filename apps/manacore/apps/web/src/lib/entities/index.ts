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

// Lazy entity registration — avoids circular imports at module load time.
let registered = false;

export function ensureEntitiesRegistered(): void {
	if (registered) return;
	registered = true;
	import('$lib/modules/todo/entity');
	import('$lib/modules/calendar/entity');
	import('$lib/modules/contacts/entity');
}
