/**
 * Domain Event Catalog — Typed event definitions for all modules.
 *
 * Each module section defines payload interfaces and a string-literal
 * union of event types. The top-level ManaEvent union covers every
 * possible event so the EventStore and Projection Engine can work
 * with full type safety.
 *
 * Pilot modules: Todo, Calendar, Drink, Nutriphi, Places.
 */

import type { DomainEvent } from './types';

// ── Todo ────────────────────────────────────────────

export interface TaskCreatedPayload {
	taskId: string;
	title: string;
	dueDate?: string;
	priority?: number;
	projectId?: string;
	labelIds?: string[];
}

export interface TaskCompletedPayload {
	taskId: string;
	title: string;
	projectId?: string;
	wasOverdue: boolean;
}

export interface TaskUncompletedPayload {
	taskId: string;
	title: string;
}

export interface TaskUpdatedPayload {
	taskId: string;
	fields: string[];
}

export interface TaskDeletedPayload {
	taskId: string;
	title: string;
}

export interface TaskRescheduledPayload {
	taskId: string;
	title: string;
	oldDate?: string;
	newDate: string;
}

export interface SubtasksUpdatedPayload {
	taskId: string;
	total: number;
	completed: number;
}

export interface ReminderSetPayload {
	taskId: string;
	reminderId: string;
	minutesBefore: number;
	type?: string;
}

export interface ReminderDeletedPayload {
	taskId: string;
	reminderId: string;
}

export type TodoEventType =
	| 'TaskCreated'
	| 'TaskCompleted'
	| 'TaskUncompleted'
	| 'TaskUpdated'
	| 'TaskDeleted'
	| 'TaskRescheduled'
	| 'SubtasksUpdated'
	| 'ReminderSet'
	| 'ReminderDeleted';

// ── Calendar ────────────────────────────────────────

export interface CalendarEventCreatedPayload {
	eventId: string;
	title: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	isRecurring: boolean;
	calendarId: string;
	location?: string;
}

export interface CalendarEventUpdatedPayload {
	eventId: string;
	fields: string[];
}

export interface CalendarEventDeletedPayload {
	eventId: string;
	title: string;
	wasRecurring: boolean;
}

export interface CalendarEventMovedPayload {
	eventId: string;
	title: string;
	oldStart: string;
	newStart: string;
}

export type CalendarEventType =
	| 'CalendarEventCreated'
	| 'CalendarEventUpdated'
	| 'CalendarEventDeleted'
	| 'CalendarEventMoved';

// ── Drink ───────────────────────────────────────────

export interface DrinkLoggedPayload {
	entryId: string;
	drinkType: string;
	quantityMl: number;
	name: string;
	date: string;
	time: string;
	fromPreset: boolean;
}

export interface DrinkEntryDeletedPayload {
	entryId: string;
	drinkType: string;
	quantityMl: number;
}

export interface DrinkEntryUndonePayload {
	entryId: string;
}

export type DrinkEventType = 'DrinkLogged' | 'DrinkEntryDeleted' | 'DrinkEntryUndone';

// ── Nutriphi ────────────────────────────────────────

export interface MealLoggedPayload {
	mealId: string;
	mealType: string;
	inputType: string;
	description: string;
	calories?: number;
	protein?: number;
	date: string;
}

export interface MealFromPhotoLoggedPayload {
	mealId: string;
	mealType: string;
	photoMediaId: string;
	confidence: number;
	calories?: number;
}

export interface MealDeletedPayload {
	mealId: string;
	mealType: string;
}

export interface NutritionGoalSetPayload {
	goalId: string;
	dailyCalories: number;
	dailyProtein?: number;
	dailyCarbs?: number;
	dailyFat?: number;
}

export type NutriphiEventType =
	| 'MealLogged'
	| 'MealFromPhotoLogged'
	| 'MealDeleted'
	| 'NutritionGoalSet';

// ── Places ──────────────────────────────────────────

export interface PlaceCreatedPayload {
	placeId: string;
	name: string;
	category?: string;
	lat: number;
	lng: number;
}

export interface PlaceDeletedPayload {
	placeId: string;
	name: string;
}

export interface PlaceVisitedPayload {
	placeId: string;
	name: string;
	visitCount: number;
}

export interface LocationLoggedPayload {
	logId: string;
	lat: number;
	lng: number;
	placeId?: string;
	accuracy?: number;
}

export interface TrackingStartedPayload {
	timestamp: string;
}

export interface TrackingStoppedPayload {
	durationMs: number;
	logCount: number;
}

export type PlacesEventType =
	| 'PlaceCreated'
	| 'PlaceDeleted'
	| 'PlaceVisited'
	| 'LocationLogged'
	| 'TrackingStarted'
	| 'TrackingStopped';

// ── System Events (Goals, Companion) ────────────────

export interface GoalReachedPayload {
	goalId: string;
	title: string;
	value: number;
	target: number;
	period: string;
}

export interface GoalProgressPayload {
	goalId: string;
	title: string;
	value: number;
	target: number;
}

export type SystemEventType = 'GoalReached' | 'GoalProgress';

// ── Union of all event types ────────────────────────

export type ManaEventType =
	| TodoEventType
	| CalendarEventType
	| DrinkEventType
	| NutriphiEventType
	| PlacesEventType
	| SystemEventType;

/**
 * Discriminated union of all domain events.
 * Use this for the EventStore subscriber and Projection handlers.
 */
export type ManaEvent =
	// Todo
	| DomainEvent<'TaskCreated', TaskCreatedPayload>
	| DomainEvent<'TaskCompleted', TaskCompletedPayload>
	| DomainEvent<'TaskUncompleted', TaskUncompletedPayload>
	| DomainEvent<'TaskUpdated', TaskUpdatedPayload>
	| DomainEvent<'TaskDeleted', TaskDeletedPayload>
	| DomainEvent<'TaskRescheduled', TaskRescheduledPayload>
	| DomainEvent<'SubtasksUpdated', SubtasksUpdatedPayload>
	| DomainEvent<'ReminderSet', ReminderSetPayload>
	| DomainEvent<'ReminderDeleted', ReminderDeletedPayload>
	// Calendar
	| DomainEvent<'CalendarEventCreated', CalendarEventCreatedPayload>
	| DomainEvent<'CalendarEventUpdated', CalendarEventUpdatedPayload>
	| DomainEvent<'CalendarEventDeleted', CalendarEventDeletedPayload>
	| DomainEvent<'CalendarEventMoved', CalendarEventMovedPayload>
	// Drink
	| DomainEvent<'DrinkLogged', DrinkLoggedPayload>
	| DomainEvent<'DrinkEntryDeleted', DrinkEntryDeletedPayload>
	| DomainEvent<'DrinkEntryUndone', DrinkEntryUndonePayload>
	// Nutriphi
	| DomainEvent<'MealLogged', MealLoggedPayload>
	| DomainEvent<'MealFromPhotoLogged', MealFromPhotoLoggedPayload>
	| DomainEvent<'MealDeleted', MealDeletedPayload>
	| DomainEvent<'NutritionGoalSet', NutritionGoalSetPayload>
	// Places
	| DomainEvent<'PlaceCreated', PlaceCreatedPayload>
	| DomainEvent<'PlaceDeleted', PlaceDeletedPayload>
	| DomainEvent<'PlaceVisited', PlaceVisitedPayload>
	| DomainEvent<'LocationLogged', LocationLoggedPayload>
	| DomainEvent<'TrackingStarted', TrackingStartedPayload>
	| DomainEvent<'TrackingStopped', TrackingStoppedPayload>
	// System
	| DomainEvent<'GoalReached', GoalReachedPayload>
	| DomainEvent<'GoalProgress', GoalProgressPayload>;
