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

// Register module entities (side-effect imports)
import '$lib/modules/todo/entity';
import '$lib/modules/calendar/entity';
import '$lib/modules/contacts/entity';
