/**
 * Dashboard Widget System Types
 *
 * Defines the type system for the configurable cross-app dashboard.
 */

/**
 * Available widget types - each represents a different data source
 */
export type WidgetType =
	| 'credits' // Credits balance from mana-core-auth
	| 'quick-actions' // Quick action links
	| 'transactions' // Recent credit transactions
	| 'tasks-today' // Todo API: today's tasks
	| 'tasks-upcoming' // Todo API: upcoming 7 days
	| 'calendar-events' // Calendar API: upcoming events
	| 'chat-recent' // Chat API: recent conversations
	| 'contacts-favorites' // Contacts API: favorite contacts
	| 'zitare-quote'; // Zitare API: favorite quotes

/**
 * Widget size - maps to CSS Grid columns
 * - small: 4 cols (1/3 width on desktop)
 * - medium: 6 cols (1/2 width on desktop)
 * - large: 8 cols (2/3 width on desktop)
 * - full: 12 cols (full width)
 */
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

/**
 * Individual widget instance configuration
 */
export interface WidgetConfig {
	/** Unique instance ID (e.g., "tasks-today-1") */
	id: string;
	/** Widget type */
	type: WidgetType;
	/** i18n key for title (e.g., "dashboard.widgets.credits.title") */
	title: string;
	/** Grid size */
	size: WidgetSize;
	/** Grid position */
	position: {
		/** Column (0-11 for 12-col grid) */
		x: number;
		/** Row index */
		y: number;
	};
	/** Show/hide toggle */
	visible: boolean;
	/** Widget-specific settings */
	settings?: Record<string, unknown>;
}

/**
 * Complete dashboard state
 */
export interface DashboardConfig {
	/** List of widget configurations */
	widgets: WidgetConfig[];
	/** Number of grid columns (default: 12) */
	gridColumns: number;
	/** ISO timestamp of last modification */
	lastModified: string;
}

/**
 * Widget loading state
 */
export type WidgetLoadState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic widget data state wrapper
 */
export interface WidgetDataState<T> {
	/** Current loading state */
	state: WidgetLoadState;
	/** Fetched data (null if not loaded or error) */
	data: T | null;
	/** Error message (null if no error) */
	error: string | null;
	/** Number of retry attempts made */
	retryCount: number;
	/** ISO timestamp of last fetch attempt */
	lastFetch: string | null;
}

/**
 * Widget metadata for the widget picker
 */
export interface WidgetMeta {
	type: WidgetType;
	/** i18n key for display name */
	nameKey: string;
	/** i18n key for description */
	descriptionKey: string;
	/** Icon identifier */
	icon: string;
	/** Default size for new instances */
	defaultSize: WidgetSize;
	/** Whether multiple instances are allowed */
	allowMultiple: boolean;
	/** Required backend (for status display) */
	requiredBackend?: 'todo' | 'calendar' | 'chat' | 'contacts' | 'zitare' | 'mana-core-auth';
}

/**
 * Widget registry - metadata for all available widgets
 */
export const WIDGET_REGISTRY: WidgetMeta[] = [
	{
		type: 'credits',
		nameKey: 'dashboard.widgets.credits.title',
		descriptionKey: 'dashboard.widgets.credits.description',
		icon: '💰',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'mana-core-auth',
	},
	{
		type: 'quick-actions',
		nameKey: 'dashboard.widgets.quick_actions.title',
		descriptionKey: 'dashboard.widgets.quick_actions.description',
		icon: '⚡',
		defaultSize: 'medium',
		allowMultiple: false,
	},
	{
		type: 'transactions',
		nameKey: 'dashboard.widgets.transactions.title',
		descriptionKey: 'dashboard.widgets.transactions.description',
		icon: '📊',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'mana-core-auth',
	},
	{
		type: 'tasks-today',
		nameKey: 'dashboard.widgets.tasks_today.title',
		descriptionKey: 'dashboard.widgets.tasks_today.description',
		icon: '✅',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'todo',
	},
	{
		type: 'tasks-upcoming',
		nameKey: 'dashboard.widgets.tasks_upcoming.title',
		descriptionKey: 'dashboard.widgets.tasks_upcoming.description',
		icon: '📅',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'todo',
	},
	{
		type: 'calendar-events',
		nameKey: 'dashboard.widgets.calendar.title',
		descriptionKey: 'dashboard.widgets.calendar.description',
		icon: '🗓️',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'calendar',
	},
	{
		type: 'chat-recent',
		nameKey: 'dashboard.widgets.chat.title',
		descriptionKey: 'dashboard.widgets.chat.description',
		icon: '💬',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'chat',
	},
	{
		type: 'contacts-favorites',
		nameKey: 'dashboard.widgets.contacts.title',
		descriptionKey: 'dashboard.widgets.contacts.description',
		icon: '👥',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'contacts',
	},
	{
		type: 'zitare-quote',
		nameKey: 'dashboard.widgets.zitare.title',
		descriptionKey: 'dashboard.widgets.zitare.description',
		icon: '💡',
		defaultSize: 'medium',
		allowMultiple: false,
		requiredBackend: 'zitare',
	},
];

/**
 * Get widget metadata by type
 */
export function getWidgetMeta(type: WidgetType): WidgetMeta | undefined {
	return WIDGET_REGISTRY.find((w) => w.type === type);
}

/**
 * Size to Tailwind class mapping
 */
export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
	small: 'col-span-12 sm:col-span-6 lg:col-span-4',
	medium: 'col-span-12 lg:col-span-6',
	large: 'col-span-12 lg:col-span-8',
	full: 'col-span-12',
};
