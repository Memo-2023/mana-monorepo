export type {
	AnyToolSpec,
	Logger,
	ModuleId,
	PolicyHint,
	ToolContext,
	ToolScope,
	ToolSpec,
} from './types.ts';

export {
	__resetRegistryForTests,
	getRegistry,
	getTool,
	getToolsByModule,
	registerTool,
} from './registry.ts';

export type {
	SyncChange,
	SyncClientConfig,
	SyncFieldChange,
	SyncPullResponse,
	SyncPushRequest,
} from './sync-client.ts';

export { pullAll, push, pushInsert } from './sync-client.ts';

export {
	MasterKeyClient,
	MasterKeyFetchError,
	ZeroKnowledgeUserError,
	type MasterKeyClientConfig,
} from './master-key-client.ts';

export { decryptRecordFields, encryptRecordFields } from '@mana/shared-crypto';

/**
 * Consumers call this to register every bundled tool at once. It is a
 * side-effect-bearing import that pulls in all module files. If a consumer
 * only wants a subset, it can import the individual module barrels directly.
 */
export { registerAllModules } from './modules/index.ts';
