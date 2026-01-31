/**
 * @manacore/bot-services
 *
 * Shared business logic services for Matrix bots and the Gateway.
 * These services are transport-agnostic and can be used by:
 * - Individual Matrix bots (standalone)
 * - The Gateway bot (all-in-one)
 * - REST APIs
 * - CLI tools
 *
 * @example
 * ```typescript
 * import { TodoModule, TodoService } from '@manacore/bot-services/todo';
 * import { AiModule, AiService } from '@manacore/bot-services/ai';
 *
 * // In NestJS module
 * @Module({
 *   imports: [
 *     TodoModule.register({ storagePath: './data/todos.json' }),
 *     AiModule.register({ baseUrl: 'http://ollama:11434' }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

// ===== Core Services =====

// Todo
export { TodoModule, TodoModuleOptions, TodoService, TODO_STORAGE_PROVIDER } from './todo';
export type {
	Task,
	Project,
	TodoData,
	CreateTaskInput,
	UpdateTaskInput,
	TaskFilter,
	TodoStats,
	ParsedTaskInput,
} from './todo';

// Calendar
export {
	CalendarModule,
	CalendarModuleOptions,
	CalendarService,
	CALENDAR_STORAGE_PROVIDER,
} from './calendar';
export type {
	CalendarEvent,
	Calendar,
	CalendarData,
	CreateEventInput,
	UpdateEventInput,
	EventFilter,
	ParsedEventInput,
} from './calendar';

// AI (Ollama)
export { AiModule, AiModuleOptions, AiService } from './ai';
export type {
	OllamaModel,
	ChatMessage,
	ChatOptions,
	ChatResult,
	ChatResponseMeta,
	AiServiceConfig,
	UserAiSession,
	SystemPromptPreset,
} from './ai';
export { SYSTEM_PROMPTS, VISION_MODELS, NON_CHAT_MODELS } from './ai';

// Clock
export { ClockModule, ClockModuleOptions, ClockService } from './clock';
export type {
	Timer,
	Alarm,
	WorldClock,
	TimezoneResult,
	CreateTimerInput,
	CreateAlarmInput,
	CreateWorldClockInput,
	ClockServiceConfig,
	TimeTrackingSummary,
} from './clock';

// Session (User authentication via mana-core-auth)
export {
	SessionModule,
	SessionService,
	SESSION_MODULE_OPTIONS,
	DEFAULT_SESSION_EXPIRY_MS,
} from './session';
export type { UserSession, LoginResult, SessionStats, SessionModuleOptions } from './session';

// Transcription (Speech-to-Text via mana-stt)
export { TranscriptionModule, TranscriptionService, STT_MODULE_OPTIONS } from './transcription';
export type {
	SttResponse,
	TranscriptionOptions,
	TranscriptionModuleOptions,
} from './transcription';

// ===== Placeholder Services (to be implemented) =====

export { NutritionModule } from './nutrition';
export type { NutritionServiceConfig, Meal, NutritionSummary } from './nutrition';

export { QuotesModule } from './quotes';
export type { QuotesServiceConfig, Quote } from './quotes';

export { StatsModule } from './stats';
export type { StatsServiceConfig, AnalyticsReport } from './stats';

export { DocsModule } from './docs';
export type { DocsServiceConfig, ProjectDoc } from './docs';

// ===== Shared Utilities =====

export { FileStorageProvider, MemoryStorageProvider } from './shared';
export type {
	StorageProvider,
	BaseEntity,
	UserEntity,
	ServiceConfig,
	Result,
	PaginationOptions,
	PaginatedResult,
	DateRange,
	Priority,
	ServiceStats,
} from './shared';
export {
	generateId,
	getTodayISO,
	startOfDay,
	endOfDay,
	addDays,
	formatDateDE,
	formatTimeDE,
	isToday,
	isTomorrow,
	parseGermanDateKeyword,
	getRelativeDateLabel,
} from './shared';
export { PRIORITY_VALUES } from './shared';
