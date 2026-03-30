/**
 * Widget Component Registry
 *
 * Maps widget types to their Svelte components.
 * Shared between WidgetContainer (grid layout) and TilePanel (tiling layout).
 */

import type { WidgetType } from '$lib/types/dashboard';
import type { Component } from 'svelte';

import CreditsWidget from './widgets/CreditsWidget.svelte';
import QuickActionsWidget from './widgets/QuickActionsWidget.svelte';
import TransactionsWidget from './widgets/TransactionsWidget.svelte';
import TasksTodayWidget from './widgets/TasksTodayWidget.svelte';
import TasksUpcomingWidget from './widgets/TasksUpcomingWidget.svelte';
import CalendarEventsWidget from './widgets/CalendarEventsWidget.svelte';
import ChatRecentWidget from './widgets/ChatRecentWidget.svelte';
import ContactsFavoritesWidget from './widgets/ContactsFavoritesWidget.svelte';
import ZitareQuoteWidget from './widgets/ZitareQuoteWidget.svelte';
import PictureRecentWidget from './widgets/PictureRecentWidget.svelte';
import ManadeckProgressWidget from './widgets/ManadeckProgressWidget.svelte';
import ClockTimersWidget from './widgets/ClockTimersWidget.svelte';
import StorageUsageWidget from './widgets/StorageUsageWidget.svelte';
import MukkeLibraryWidget from './widgets/MukkeLibraryWidget.svelte';
import PresiDecksWidget from './widgets/PresiDecksWidget.svelte';
import ContextDocsWidget from './widgets/ContextDocsWidget.svelte';

export const widgetComponents: Record<WidgetType, Component> = {
	credits: CreditsWidget,
	'quick-actions': QuickActionsWidget,
	transactions: TransactionsWidget,
	'tasks-today': TasksTodayWidget,
	'tasks-upcoming': TasksUpcomingWidget,
	'calendar-events': CalendarEventsWidget,
	'chat-recent': ChatRecentWidget,
	'contacts-favorites': ContactsFavoritesWidget,
	'zitare-quote': ZitareQuoteWidget,
	'picture-recent': PictureRecentWidget,
	'manadeck-progress': ManadeckProgressWidget,
	'clock-timers': ClockTimersWidget,
	'storage-usage': StorageUsageWidget,
	'mukke-library': MukkeLibraryWidget,
	'presi-decks': PresiDecksWidget,
	'context-docs': ContextDocsWidget,
};
