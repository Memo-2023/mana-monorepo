// Types
export type { AppDescriptor, ViewLoader, EntityDisplayData, DropResult, ViewProps } from './types';

// Registry
export {
	registerApp,
	getApp,
	getAppByDragType,
	canDrop,
	executeDrop,
	getAllApps,
} from './registry';

// Register all apps eagerly — descriptors are lightweight with lazy imports
import './apps';
