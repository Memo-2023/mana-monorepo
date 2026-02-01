/**
 * @manacore/matrix-bot-common
 *
 * Shared utilities and base classes for Matrix bots.
 * Reduces code duplication across 19 Matrix bots.
 *
 * @example
 * ```typescript
 * import {
 *   BaseMatrixService,
 *   HealthController,
 *   MatrixMessageService,
 *   KeywordCommandDetector,
 *   markdownToHtml,
 *   SessionHelper,
 *   UserListMapper,
 * } from '@manacore/matrix-bot-common';
 * ```
 */

// Base Matrix Service
export {
	BaseMatrixService,
	type MatrixBotConfig,
	type MatrixRoomEvent,
	type MatrixMessageEvent,
	isTextMessage,
	isAudioMessage,
	isImageMessage,
	isFileMessage,
} from './base';

// Health Controller
export {
	HealthController,
	HEALTH_SERVICE_NAME,
	createHealthProvider,
	type HealthResponse,
} from './health';

// Message Service
export {
	MatrixMessageService,
	type MatrixMessageContent,
	type SendMessageOptions,
} from './message';

// Markdown Utilities
export {
	markdownToHtml,
	escapeHtml,
	formatNumberedList,
	formatBulletList,
} from './markdown';

// Keyword Detection
export {
	KeywordCommandDetector,
	COMMON_KEYWORDS,
	type KeywordCommand,
	type KeywordDetectorOptions,
} from './keywords';

// Session Helper
export { SessionHelper, createSessionHelper } from './session';

// List Mapper
export { UserListMapper, UserIdListMapper } from './list-mapper';
