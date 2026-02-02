export { SessionService, REDIS_SESSION_PROVIDER } from './session.service';
export { SessionModule } from './session.module';
export { RedisSessionProvider, REDIS_CLIENT } from './redis-session.provider';
export type {
	UserSession,
	LoginResult,
	SessionStats,
	SessionModuleOptions,
	SessionStorageMode,
} from './types';
export { SESSION_MODULE_OPTIONS, DEFAULT_SESSION_EXPIRY_MS } from './types';
