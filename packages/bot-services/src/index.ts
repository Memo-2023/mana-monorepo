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
export {
	TodoModule,
	TodoModuleOptions,
	TodoService,
	TODO_STORAGE_PROVIDER,
	TodoApiService,
} from './todo/index.js';
export type {
	Task,
	Project,
	TodoData,
	CreateTaskInput,
	UpdateTaskInput,
	TaskFilter,
	TodoStats,
	ParsedTaskInput,
} from './todo/index.js';

// Calendar
export {
	CalendarModule,
	CalendarModuleOptions,
	CalendarService,
	CalendarApiService,
	CALENDAR_STORAGE_PROVIDER,
} from './calendar/index.js';
export type {
	CalendarEvent,
	Calendar,
	CalendarData,
	CreateEventInput,
	UpdateEventInput,
	EventFilter,
	ParsedEventInput,
} from './calendar/index.js';

// AI (Ollama)
export { AiModule, AiModuleOptions, AiService } from './ai/index.js';
export type {
	OllamaModel,
	ChatMessage,
	ChatOptions,
	ChatResult,
	ChatResponseMeta,
	AiServiceConfig,
	UserAiSession,
	SystemPromptPreset,
} from './ai/index.js';
export { SYSTEM_PROMPTS, VISION_MODELS, NON_CHAT_MODELS } from './ai/index.js';

// Clock
export { ClockModule, ClockModuleOptions, ClockService } from './clock/index.js';
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
} from './clock/index.js';

// Session (User authentication via mana-core-auth)
export {
	SessionModule,
	SessionService,
	RedisSessionProvider,
	REDIS_SESSION_PROVIDER,
	REDIS_CLIENT,
	SESSION_MODULE_OPTIONS,
	DEFAULT_SESSION_EXPIRY_MS,
	formatAuthErrorMessage,
	AUTH_ERROR_MESSAGES,
	// Deprecated - kept for backwards compatibility
	formatLoginRequiredMessage,
	LOGIN_MESSAGES,
} from './session/index.js';
export type {
	UserSession,
	LoginResult,
	SessionStats,
	SessionModuleOptions,
	SessionStorageMode,
} from './session/index.js';

// Transcription (Speech-to-Text via mana-stt)
export {
	TranscriptionModule,
	TranscriptionService,
	STT_MODULE_OPTIONS,
} from './transcription/index.js';
export type {
	SttResponse,
	TranscriptionOptions,
	TranscriptionModuleOptions,
} from './transcription/index.js';

// Credit (Credit balance and formatting for Matrix bots)
export {
	CreditModule,
	CreditService,
	CREDIT_MODULE_OPTIONS,
	CreditErrorCode,
} from './credit/index.js';
export type {
	CreditBalance,
	CreditValidationResult,
	CreditConsumeResult,
	CreditModuleOptions,
	CreditStatusMessage,
	CreditPackage,
	PaymentLinkResult,
	PurchaseStatus,
	PurchaseStatusResult,
} from './credit/index.js';

// Gift (Gift code management for Matrix bots)
export { GiftModule, GiftService, GIFT_MODULE_OPTIONS } from './gift/index.js';
export type {
	GiftCodeType,
	GiftCodeStatus,
	CreateGiftOptions,
	CreateGiftResult,
	GiftCodeInfo,
	RedeemGiftResult,
	CreatedGiftItem,
	ReceivedGiftItem,
	GiftModuleOptions,
	GiftStatusMessage,
} from './gift/index.js';

// I18n (Multi-language support for Matrix bots)
export { I18nModule, I18nService, I18N_OPTIONS, LANGUAGE_NAMES } from './i18n/index.js';
export type {
	Language,
	I18nOptions,
	BotTranslations,
	CommonTranslations,
	TodoTranslations,
	CalendarTranslations,
	ContactsTranslations,
	ClockTranslations,
	GiftTranslations,
} from './i18n/index.js';
export { de as deTranslations, en as enTranslations } from './i18n/index.js';

// ===== Placeholder Services (to be implemented) =====

export { NutritionModule } from './nutrition/index.js';
export type { NutritionServiceConfig, Meal, NutritionSummary } from './nutrition/index.js';

export { QuotesModule } from './quotes/index.js';
export type { QuotesServiceConfig, Quote } from './quotes/index.js';

export { StatsModule } from './stats/index.js';
export type { StatsServiceConfig, AnalyticsReport } from './stats/index.js';

export { DocsModule } from './docs/index.js';
export type { DocsServiceConfig, ProjectDoc } from './docs/index.js';

// ===== Shared Utilities =====

export { FileStorageProvider, MemoryStorageProvider } from './shared/index.js';
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
} from './shared/index.js';
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
} from './shared/index.js';
export { PRIORITY_VALUES } from './shared/index.js';
