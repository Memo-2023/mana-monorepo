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
	type IConfigService,
	type MatrixBotConfig,
	type MatrixRoomEvent,
	type MatrixMessageEvent,
	isTextMessage,
	isAudioMessage,
	isImageMessage,
	isFileMessage,
} from './base/index.js';

// Health Controller
export {
	HealthController,
	HEALTH_SERVICE_NAME,
	createHealthProvider,
	type HealthResponse,
} from './health/index.js';

// Message Service
export {
	MatrixMessageService,
	type MatrixMessageContent,
	type SendMessageOptions,
} from './message/index.js';

// Markdown Utilities
export { markdownToHtml, escapeHtml, formatNumberedList, formatBulletList } from './markdown/index.js';

// Keyword Detection
export {
	KeywordCommandDetector,
	COMMON_KEYWORDS,
	type KeywordCommand,
	type KeywordDetectorOptions,
} from './keywords/index.js';

// Session Helper
export { SessionHelper, createSessionHelper } from './session/index.js';

// List Mapper
export { UserListMapper, UserIdListMapper } from './list-mapper/index.js';

// Credit Commands
export {
	handleCreditCommand,
	sendPaymentSuccessNotification,
	isCreditCommand,
	CREDIT_COMMANDS,
	type CreditCommand,
	type CreditCommandsHost,
} from './credit/index.js';

// Gift Commands
export {
	handleGiftCommand,
	isGiftCommand,
	GIFT_COMMANDS,
	type GiftCommand,
	type GiftCommandsHost,
} from './gift/index.js';
