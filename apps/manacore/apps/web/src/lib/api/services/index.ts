/**
 * Dashboard API Services
 *
 * Re-exports all app-specific services for the dashboard.
 */

export { todoService, type Task, type Project } from './todo';
export { calendarService, type Calendar, type CalendarEvent } from './calendar';
export { chatService, type Conversation, type Message, type AiModel } from './chat';
export { contactsService, type Contact, type ContactActivity } from './contacts';
export { zitareService, type Favorite, type Quote, type QuoteList } from './zitare';
