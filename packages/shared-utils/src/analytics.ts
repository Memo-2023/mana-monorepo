/**
 * Umami Analytics Utility
 *
 * Provides type-safe event tracking for all ManaCore apps.
 * Events are automatically sent to Umami at stats.mana.how
 *
 * @example
 * ```typescript
 * import { trackEvent, trackClick } from '@manacore/shared-utils/analytics';
 *
 * // Track a custom event
 * trackEvent('signup_completed', { method: 'email' });
 *
 * // Track a button click
 * trackClick('cta_hero', 'Get Started');
 * ```
 */

// Umami types
declare global {
	interface Window {
		umami?: {
			track: (eventName: string, eventData?: Record<string, string | number | boolean>) => void;
		};
	}
}

/**
 * Check if Umami is available
 */
export function isUmamiAvailable(): boolean {
	return typeof window !== 'undefined' && typeof window.umami?.track === 'function';
}

/**
 * Track a custom event
 *
 * @param eventName - Name of the event (snake_case recommended)
 * @param data - Optional event data/properties
 *
 * @example
 * trackEvent('image_generated', { model: 'flux', style: 'realistic' });
 */
export function trackEvent(
	eventName: string,
	data?: Record<string, string | number | boolean>
): void {
	if (!isUmamiAvailable()) {
		return;
	}

	try {
		window.umami!.track(eventName, data);
	} catch (error) {
		console.warn('[Analytics] Failed to track event:', eventName, error);
	}
}

/**
 * Track a button/link click
 *
 * @param elementId - Identifier for the element (e.g., 'cta_hero', 'nav_pricing')
 * @param label - Human-readable label
 *
 * @example
 * trackClick('cta_hero', 'Start Free Trial');
 */
export function trackClick(elementId: string, label?: string): void {
	trackEvent('click', { element: elementId, label: label || elementId });
}

/**
 * Track a page/section view
 *
 * @param section - Section identifier
 *
 * @example
 * trackView('pricing_section');
 */
export function trackView(section: string): void {
	trackEvent('view', { section });
}

/**
 * Track form submission
 *
 * @param formId - Form identifier
 * @param success - Whether submission was successful
 *
 * @example
 * trackFormSubmit('contact_form', true);
 */
export function trackFormSubmit(formId: string, success: boolean): void {
	trackEvent('form_submit', { form: formId, success });
}

/**
 * Track search queries
 *
 * @param query - Search query (consider privacy - don't track full queries)
 * @param resultsCount - Number of results
 *
 * @example
 * trackSearch('react hooks', 42);
 */
export function trackSearch(query: string, resultsCount: number): void {
	// Only track query length for privacy
	trackEvent('search', { query_length: query.length, results: resultsCount });
}

/**
 * Track errors
 *
 * @param errorType - Type of error
 * @param message - Error message (sanitized)
 *
 * @example
 * trackError('api_error', 'Failed to fetch data');
 */
export function trackError(errorType: string, message?: string): void {
	trackEvent('error', {
		type: errorType,
		message: message?.substring(0, 100) || 'unknown',
	});
}

// =============================================================================
// App-Specific Event Helpers
// =============================================================================

/**
 * Auth Events
 */
export const AuthEvents = {
	login: (method: 'email' | 'google' | 'github' = 'email') => trackEvent('login', { method }),
	logout: () => trackEvent('logout'),
	signup: (method: 'email' | 'google' | 'github' = 'email') => trackEvent('signup', { method }),
	signupCompleted: () => trackEvent('signup_completed'),
	passwordReset: () => trackEvent('password_reset'),
};

/**
 * Landing Page Events
 */
export const LandingEvents = {
	ctaClick: (location: 'hero' | 'pricing' | 'features' | 'footer' | string) =>
		trackEvent('cta_click', { location }),
	pricingViewed: () => trackEvent('pricing_viewed'),
	pricingPlanSelected: (plan: string) => trackEvent('pricing_plan_selected', { plan }),
	demoStarted: () => trackEvent('demo_started'),
	featureExplored: (feature: string) => trackEvent('feature_explored', { feature }),
	faqOpened: (question: string) =>
		trackEvent('faq_opened', { question: question.substring(0, 50) }),
	contactFormSubmitted: () => trackEvent('contact_form_submitted'),
	newsletterSubscribed: () => trackEvent('newsletter_subscribed'),
};

/**
 * Chat App Events
 */
export const ChatEvents = {
	conversationCreated: () => trackEvent('conversation_created'),
	messageSent: (modelId?: string) =>
		trackEvent('message_sent', modelId ? { model: modelId } : undefined),
	modelChanged: (modelId: string) => trackEvent('model_changed', { model: modelId }),
	conversationDeleted: () => trackEvent('conversation_deleted'),
	conversationShared: () => trackEvent('conversation_shared'),
};

/**
 * Picture App Events
 */
export const PictureEvents = {
	imageGenerated: (model: string, style?: string) =>
		trackEvent('image_generated', { model, ...(style && { style }) }),
	imageDownloaded: () => trackEvent('image_downloaded'),
	imageFavorited: () => trackEvent('image_favorited'),
	imageShared: () => trackEvent('image_shared'),
	modelSelected: (model: string) => trackEvent('model_selected', { model }),
	styleSelected: (style: string) => trackEvent('style_selected', { style }),
	generationFailed: (reason?: string) =>
		trackEvent('generation_failed', { reason: reason || 'unknown' }),
};

/**
 * Todo App Events
 */
export const TodoEvents = {
	taskCreated: (hasDeadline = false) => trackEvent('task_created', { has_deadline: hasDeadline }),
	taskCompleted: () => trackEvent('task_completed'),
	taskDeleted: () => trackEvent('task_deleted'),
	projectCreated: () => trackEvent('project_created'),
	labelCreated: () => trackEvent('label_created'),
	viewChanged: (view: 'inbox' | 'today' | 'upcoming' | 'project') =>
		trackEvent('view_changed', { view }),
};

/**
 * Calendar App Events
 */
export const CalendarEvents = {
	eventCreated: (isRecurring = false) => trackEvent('event_created', { recurring: isRecurring }),
	eventUpdated: () => trackEvent('event_updated'),
	eventDeleted: () => trackEvent('event_deleted'),
	calendarCreated: () => trackEvent('calendar_created'),
	calendarShared: () => trackEvent('calendar_shared'),
	viewChanged: (view: 'day' | 'week' | 'month' | 'agenda') => trackEvent('view_changed', { view }),
	reminderSet: (minutesBefore: number) => trackEvent('reminder_set', { minutes: minutesBefore }),
};

/**
 * Clock App Events
 */
export const ClockEvents = {
	timerStarted: (type: 'pomodoro' | 'stopwatch' | 'countdown') =>
		trackEvent('timer_started', { type }),
	timerCompleted: (type: 'pomodoro' | 'stopwatch' | 'countdown', duration: number) =>
		trackEvent('timer_completed', { type, duration_seconds: duration }),
	timerCanceled: () => trackEvent('timer_canceled'),
	focusSessionStarted: () => trackEvent('focus_session_started'),
	focusSessionCompleted: (duration: number) =>
		trackEvent('focus_session_completed', { duration_minutes: duration }),
};

/**
 * Contacts App Events
 */
export const ContactsEvents = {
	contactCreated: () => trackEvent('contact_created'),
	contactUpdated: () => trackEvent('contact_updated'),
	contactDeleted: () => trackEvent('contact_deleted'),
	contactImported: (source: 'google' | 'csv' | 'vcard') =>
		trackEvent('contact_imported', { source }),
	contactExported: (format: 'csv' | 'vcard') => trackEvent('contact_exported', { format }),
	tagCreated: () => trackEvent('tag_created'),
	searchPerformed: () => trackEvent('search_performed'),
};

/**
 * ManaDeck App Events
 */
export const ManaDeckEvents = {
	deckCreated: () => trackEvent('deck_created'),
	deckStudied: (cardsCount: number) => trackEvent('deck_studied', { cards: cardsCount }),
	cardCreated: () => trackEvent('card_created'),
	cardReviewed: (rating: 1 | 2 | 3 | 4 | 5) => trackEvent('card_reviewed', { rating }),
	aiCardsGenerated: (count: number) => trackEvent('ai_cards_generated', { count }),
};

/**
 * Subscription/Payment Events
 */
export const SubscriptionEvents = {
	pricingViewed: () => trackEvent('pricing_viewed'),
	planSelected: (plan: string) => trackEvent('plan_selected', { plan }),
	checkoutStarted: (plan: string) => trackEvent('checkout_started', { plan }),
	checkoutCompleted: (plan: string) => trackEvent('checkout_completed', { plan }),
	checkoutAbandoned: (plan: string) => trackEvent('checkout_abandoned', { plan }),
	subscriptionCanceled: (plan: string) => trackEvent('subscription_canceled', { plan }),
	trialStarted: () => trackEvent('trial_started'),
	trialEnded: (converted: boolean) => trackEvent('trial_ended', { converted }),
};

/**
 * General App Events
 */
export const AppEvents = {
	appOpened: (app: string) => trackEvent('app_opened', { app }),
	themeChanged: (theme: 'light' | 'dark' | 'system') => trackEvent('theme_changed', { theme }),
	languageChanged: (language: string) => trackEvent('language_changed', { language }),
	feedbackSubmitted: (type: 'bug' | 'feature' | 'other') =>
		trackEvent('feedback_submitted', { type }),
	helpOpened: () => trackEvent('help_opened'),
	settingsOpened: () => trackEvent('settings_opened'),
	shareClicked: (platform: string) => trackEvent('share_clicked', { platform }),
};
