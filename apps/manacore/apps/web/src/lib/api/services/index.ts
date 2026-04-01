/**
 * Dashboard API Services
 *
 * Re-exports all app-specific services for the dashboard.
 */

export { todoService, type Task, type Project, type Label, type Subtask } from './todo';
export { calendarService, type Calendar, type CalendarEvent } from './calendar';
export { chatService, type Conversation, type Message, type AiModel } from './chat';
export { contactsService, type Contact, type ContactActivity } from './contacts';
export { zitareService, type Favorite, type Quote, type QuoteList } from './zitare';
export { pictureService, type GeneratedImage, type GenerationStats } from './picture';
export { cardsService, type Deck, type Card, type LearningProgress } from './cards';
export { clockService, type Timer, type Alarm, type ClockStats } from './clock';
export { storageService, type StorageFile, type StorageStats } from './storage';
export { mukkeService, type Song, type MukkeStats } from './mukke';
export { presiService, type PresiDeck, type PresiStats } from './presi';
export {
	contextService,
	type ContextSpace,
	type ContextDocument,
	type TokenBalance,
} from './context';
