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
	taskUncompleted: () => trackEvent('task_uncompleted'),
	subtaskCompleted: () => trackEvent('subtask_completed'),
	projectCreated: () => trackEvent('project_created'),
	projectDeleted: () => trackEvent('project_deleted'),
	labelCreated: () => trackEvent('label_created'),
	viewChanged: (view: string) => trackEvent('view_changed', { view }),
	quickAddUsed: () => trackEvent('quick_add_used'),
	filterUsed: (filterType: string) => trackEvent('filter_used', { filter: filterType }),
};

/**
 * Calendar App Events
 */
export const CalendarEvents = {
	eventCreated: (isRecurring = false) => trackEvent('event_created', { recurring: isRecurring }),
	eventUpdated: () => trackEvent('event_updated'),
	eventDeleted: () => trackEvent('event_deleted'),
	calendarCreated: () => trackEvent('calendar_created'),
	calendarDeleted: () => trackEvent('calendar_deleted'),
	calendarShared: () => trackEvent('calendar_shared'),
	viewChanged: (view: string) => trackEvent('view_changed', { view }),
	reminderSet: (minutesBefore: number) => trackEvent('reminder_set', { minutes: minutesBefore }),
	eventDragged: () => trackEvent('event_dragged'),
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
	contactFavorited: () => trackEvent('contact_favorited'),
	contactArchived: () => trackEvent('contact_archived'),
	contactImported: (source: 'google' | 'csv' | 'vcard', count?: number) =>
		trackEvent('contact_imported', { source, ...(count !== undefined && { count }) }),
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
 * ManaCore Platform Events
 */
export const ManaCoreEvents = {
	appOpened: (appId: string) => trackEvent('app_opened', { app: appId }),
	navClicked: (destination: string) => trackEvent('nav_clicked', { destination }),
	onboardingStarted: () => trackEvent('onboarding_started'),
	onboardingStepCompleted: (step: string, stepNumber: number) =>
		trackEvent('onboarding_step_completed', { step, step_number: stepNumber }),
	onboardingCompleted: () => trackEvent('onboarding_completed'),
	onboardingSkipped: (atStep: number) => trackEvent('onboarding_skipped', { at_step: atStep }),
	dashboardEditToggled: (editing: boolean) => trackEvent('dashboard_edit_toggled', { editing }),
	widgetAdded: (widgetType: string) => trackEvent('widget_added', { widget_type: widgetType }),
	widgetRemoved: (widgetType: string) => trackEvent('widget_removed', { widget_type: widgetType }),
	widgetResized: (widgetType: string, size: string) =>
		trackEvent('widget_resized', { widget_type: widgetType, size }),
	creditsTabViewed: (tab: string) => trackEvent('credits_tab_viewed', { tab }),
	profileUpdated: () => trackEvent('profile_updated'),
};

/**
 * Context App Events
 */
export const ContextEvents = {
	documentCreated: (type: string) => trackEvent('document_created', { type }),
	documentDeleted: () => trackEvent('document_deleted'),
	documentPinned: (pinned: boolean) => trackEvent('document_pinned', { pinned }),
	spaceCreated: () => trackEvent('space_created'),
	spaceDeleted: () => trackEvent('space_deleted'),
	aiGenerated: () => trackEvent('ai_generated'),
};

/**
 * SkillTree App Events
 */
export const SkillTreeEvents = {
	skillCreated: (branch: string) => trackEvent('skill_created', { branch }),
	skillDeleted: () => trackEvent('skill_deleted'),
	xpAdded: (xp: number, leveledUp: boolean) =>
		trackEvent('xp_added', { xp, leveled_up: leveledUp }),
};

/**
 * Planta App Events
 */
export const PlantaEvents = {
	plantAnalyzed: () => trackEvent('plant_analyzed'),
	plantCreated: () => trackEvent('plant_created'),
	plantDeleted: () => trackEvent('plant_deleted'),
	plantWatered: () => trackEvent('plant_watered'),
};

/**
 * Questions App Events
 */
export const QuestionsEvents = {
	questionCreated: (depth: string) => trackEvent('question_created', { depth }),
	questionDeleted: () => trackEvent('question_deleted'),
	researchStarted: (depth: string) => trackEvent('research_started', { depth }),
	collectionCreated: () => trackEvent('collection_created'),
	collectionDeleted: () => trackEvent('collection_deleted'),
};

/**
 * Photos App Events
 */
export const PhotosEvents = {
	photoUploaded: () => trackEvent('photo_uploaded'),
	photoFavorited: (favorited: boolean) => trackEvent('photo_favorited', { favorited }),
	photoDeleted: () => trackEvent('photo_deleted'),
	albumCreated: () => trackEvent('album_created'),
	albumDeleted: () => trackEvent('album_deleted'),
	photosAddedToAlbum: (count: number) => trackEvent('photos_added_to_album', { count }),
	photoRemovedFromAlbum: () => trackEvent('photo_removed_from_album'),
	filtersApplied: () => trackEvent('filters_applied'),
};

/**
 * Storage App Events
 */
export const StorageEvents = {
	fileDownloaded: () => trackEvent('file_downloaded'),
	fileDeleted: () => trackEvent('file_deleted'),
	fileFavorited: (favorited: boolean) => trackEvent('file_favorited', { favorited }),
	folderDeleted: () => trackEvent('folder_deleted'),
	folderFavorited: (favorited: boolean) => trackEvent('folder_favorited', { favorited }),
	shareLinkCopied: () => trackEvent('share_link_copied'),
	shareLinkDeleted: () => trackEvent('share_link_deleted'),
	trashRestored: (type: string) => trackEvent('trash_restored', { type }),
	trashEmptied: () => trackEvent('trash_emptied'),
	searchPerformed: (resultsCount: number) =>
		trackEvent('search_performed', { results: resultsCount }),
	viewModeChanged: (mode: string) => trackEvent('view_mode_changed', { mode }),
};

/**
 * Mukke App Events
 */
export const MukkeEvents = {
	songUploaded: () => trackEvent('song_uploaded'),
	songUploadFailed: () => trackEvent('song_upload_failed'),
	songPlayed: () => trackEvent('song_played'),
	songFavorited: (favorited: boolean) => trackEvent('song_favorited', { favorited }),
	songDeleted: () => trackEvent('song_deleted'),
	playlistCreated: () => trackEvent('playlist_created'),
	playlistDeleted: () => trackEvent('playlist_deleted'),
	playlistPlayAll: () => trackEvent('playlist_play_all'),
	playlistShufflePlay: () => trackEvent('playlist_shuffle_play'),
	projectCreated: () => trackEvent('project_created'),
	projectDeleted: () => trackEvent('project_deleted'),
	projectExported: (format: string) => trackEvent('project_exported', { format }),
};

/**
 * Zitare App Events
 */
export const ZitareEvents = {
	randomQuoteLoaded: () => trackEvent('random_quote_loaded'),
	quoteShared: (category: string) => trackEvent('quote_shared', { category }),
	quoteFavorited: (category: string) => trackEvent('quote_favorited', { category }),
	quoteUnfavorited: () => trackEvent('quote_unfavorited'),
	categoryViewed: (category: string) => trackEvent('category_viewed', { category }),
	searchPerformed: (resultsCount: number) =>
		trackEvent('search_performed', { results: resultsCount }),
	listCreated: () => trackEvent('list_created'),
	listDeleted: () => trackEvent('list_deleted'),
	quoteLanguageChanged: (language: string) => trackEvent('quote_language_changed', { language }),
};

/**
 * Presi App Events
 */
export const PresiEvents = {
	deckCreated: () => trackEvent('deck_created'),
	deckDeleted: () => trackEvent('deck_deleted'),
	slideCreated: () => trackEvent('slide_created'),
	slideEdited: () => trackEvent('slide_edited'),
	slideDeleted: () => trackEvent('slide_deleted'),
	slideReordered: (direction: 'up' | 'down') => trackEvent('slide_reordered', { direction }),
	presentationStarted: (slideCount: number) =>
		trackEvent('presentation_started', { slide_count: slideCount }),
	presentationExited: (duration: number, slidesViewed: number) =>
		trackEvent('presentation_exited', { duration_seconds: duration, slides_viewed: slidesViewed }),
	shareLinkCreated: () => trackEvent('share_link_created'),
	shareLinkCopied: () => trackEvent('share_link_copied'),
	shareLinkDeleted: () => trackEvent('share_link_deleted'),
	sharedDeckViewed: () => trackEvent('shared_deck_viewed'),
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
