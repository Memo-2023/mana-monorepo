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
// Module Tracker
// =============================================================================

type EventData = Record<string, string | number | boolean>;

/**
 * Creates a module-scoped tracker that automatically includes `module` in every event.
 * This resolves event name collisions in the unified app (e.g. `view_changed` from todo vs calendar).
 */
function createModuleTracker(module: string) {
	return (event: string, data?: EventData) => trackEvent(event, { ...data, module });
}

// =============================================================================
// App-Specific Event Helpers
// =============================================================================

const track = {
	auth: createModuleTracker('auth'),
	landing: createModuleTracker('landing'),
	chat: createModuleTracker('chat'),
	picture: createModuleTracker('picture'),
	todo: createModuleTracker('todo'),
	calendar: createModuleTracker('calendar'),
	times: createModuleTracker('times'),
	contacts: createModuleTracker('contacts'),
	cards: createModuleTracker('cards'),
	manacore: createModuleTracker('manacore'),
	context: createModuleTracker('context'),
	skilltree: createModuleTracker('skilltree'),
	nutriphi: createModuleTracker('nutriphi'),
	planta: createModuleTracker('planta'),
	questions: createModuleTracker('questions'),
	photos: createModuleTracker('photos'),
	storage: createModuleTracker('storage'),
	mukke: createModuleTracker('mukke'),
	zitare: createModuleTracker('zitare'),
	presi: createModuleTracker('presi'),
	subscription: createModuleTracker('subscription'),
	memoro: createModuleTracker('memoro'),
	app: createModuleTracker('app'),
};

/**
 * Auth Events
 */
export const AuthEvents = {
	login: (method: 'email' | 'google' | 'github' = 'email') => track.auth('login', { method }),
	logout: () => track.auth('logout'),
	signup: (method: 'email' | 'google' | 'github' = 'email') => track.auth('signup', { method }),
	signupCompleted: () => track.auth('signup_completed'),
	passwordReset: () => track.auth('password_reset'),
};

/**
 * Landing Page Events
 */
export const LandingEvents = {
	ctaClick: (location: 'hero' | 'pricing' | 'features' | 'footer' | string) =>
		track.landing('cta_click', { location }),
	pricingViewed: () => track.landing('pricing_viewed'),
	pricingPlanSelected: (plan: string) => track.landing('pricing_plan_selected', { plan }),
	demoStarted: () => track.landing('demo_started'),
	featureExplored: (feature: string) => track.landing('feature_explored', { feature }),
	faqOpened: (question: string) =>
		track.landing('faq_opened', { question: question.substring(0, 50) }),
	contactFormSubmitted: () => track.landing('contact_form_submitted'),
	newsletterSubscribed: () => track.landing('newsletter_subscribed'),
};

/**
 * Chat App Events
 */
export const ChatEvents = {
	conversationCreated: () => track.chat('conversation_created'),
	messageSent: (modelId?: string) =>
		track.chat('message_sent', modelId ? { model: modelId } : undefined),
	modelChanged: (modelId: string) => track.chat('model_changed', { model: modelId }),
	conversationDeleted: () => track.chat('conversation_deleted'),
	conversationShared: () => track.chat('conversation_shared'),
};

/**
 * Picture App Events
 */
export const PictureEvents = {
	imageGenerated: (model: string, style?: string) =>
		track.picture('image_generated', { model, ...(style && { style }) }),
	imageDownloaded: () => track.picture('image_downloaded'),
	imageFavorited: () => track.picture('image_favorited'),
	imageShared: () => track.picture('image_shared'),
	modelSelected: (model: string) => track.picture('model_selected', { model }),
	styleSelected: (style: string) => track.picture('style_selected', { style }),
	generationFailed: (reason?: string) =>
		track.picture('generation_failed', { reason: reason || 'unknown' }),
};

/**
 * Todo App Events
 */
export const TodoEvents = {
	taskCreated: (hasDeadline = false) => track.todo('task_created', { has_deadline: hasDeadline }),
	taskCompleted: () => track.todo('task_completed'),
	taskDeleted: () => track.todo('task_deleted'),
	taskUncompleted: () => track.todo('task_uncompleted'),
	subtaskCompleted: () => track.todo('subtask_completed'),
	projectCreated: () => track.todo('project_created'),
	projectDeleted: () => track.todo('project_deleted'),
	labelCreated: () => track.todo('label_created'),
	viewChanged: (view: string) => track.todo('view_changed', { view }),
	quickAddUsed: () => track.todo('quick_add_used'),
	filterUsed: (filterType: string) => track.todo('filter_used', { filter: filterType }),
	reminderCreated: (type: 'relative' | 'absolute') => track.todo('reminder_created', { type }),
	recurringTaskCreated: (pattern: string) => track.todo('recurring_task_created', { pattern }),
	taskReordered: () => track.todo('task_reordered'),
	keyboardShortcutUsed: (shortcut: string) => track.todo('keyboard_shortcut_used', { shortcut }),
	taskEdited: () => track.todo('task_edited'),
	dueDateSet: () => track.todo('due_date_set'),
	priorityChanged: (priority: string) => track.todo('priority_changed', { priority }),
};

/**
 * Calendar App Events
 */
export const CalendarEvents = {
	eventCreated: (isRecurring = false) =>
		track.calendar('event_created', { recurring: isRecurring }),
	eventUpdated: () => track.calendar('event_updated'),
	eventDeleted: () => track.calendar('event_deleted'),
	calendarCreated: () => track.calendar('calendar_created'),
	calendarDeleted: () => track.calendar('calendar_deleted'),
	calendarShared: () => track.calendar('calendar_shared'),
	viewChanged: (view: string) => track.calendar('view_changed', { view }),
	reminderSet: (minutesBefore: number) =>
		track.calendar('reminder_set', { minutes: minutesBefore }),
	eventDragged: () => track.calendar('event_dragged'),
};

/**
 * Times App Events (formerly Clock)
 */
export const ClockEvents = {
	timerStarted: (type: 'pomodoro' | 'stopwatch' | 'countdown') =>
		track.times('timer_started', { type }),
	timerCompleted: (type: 'pomodoro' | 'stopwatch' | 'countdown', duration: number) =>
		track.times('timer_completed', { type, duration_seconds: duration }),
	timerCanceled: () => track.times('timer_canceled'),
	focusSessionStarted: () => track.times('focus_session_started'),
	focusSessionCompleted: (duration: number) =>
		track.times('focus_session_completed', { duration_minutes: duration }),
};

/**
 * Contacts App Events
 */
export const ContactsEvents = {
	contactCreated: () => track.contacts('contact_created'),
	contactUpdated: () => track.contacts('contact_updated'),
	contactDeleted: () => track.contacts('contact_deleted'),
	contactFavorited: () => track.contacts('contact_favorited'),
	contactArchived: () => track.contacts('contact_archived'),
	contactImported: (source: 'google' | 'csv' | 'vcard', count?: number) =>
		track.contacts('contact_imported', {
			source,
			...(count !== undefined && { count }),
		}),
	contactExported: (format: 'csv' | 'vcard') => track.contacts('contact_exported', { format }),
	tagCreated: () => track.contacts('tag_created'),
	searchPerformed: () => track.contacts('search_performed'),
};

/**
 * Cards App Events
 */
export const CardsEvents = {
	deckCreated: () => track.cards('deck_created'),
	deckDeleted: () => track.cards('deck_deleted'),
	deckStudied: (cardsCount: number) => track.cards('deck_studied', { cards: cardsCount }),
	cardCreated: () => track.cards('card_created'),
	cardDeleted: () => track.cards('card_deleted'),
	cardReviewed: (rating: 1 | 2 | 3 | 4 | 5) => track.cards('card_reviewed', { rating }),
	aiCardsGenerated: (count: number) => track.cards('ai_cards_generated', { count }),
};

/**
 * ManaCore Platform Events
 */
export const ManaCoreEvents = {
	appOpened: (appId: string) => track.manacore('app_opened', { app: appId }),
	navClicked: (destination: string) => track.manacore('nav_clicked', { destination }),
	onboardingStarted: () => track.manacore('onboarding_started'),
	onboardingStepCompleted: (step: string, stepNumber: number) =>
		track.manacore('onboarding_step_completed', { step, step_number: stepNumber }),
	onboardingCompleted: () => track.manacore('onboarding_completed'),
	onboardingSkipped: (atStep: number) => track.manacore('onboarding_skipped', { at_step: atStep }),
	dashboardEditToggled: (editing: boolean) => track.manacore('dashboard_edit_toggled', { editing }),
	widgetAdded: (widgetType: string) => track.manacore('widget_added', { widget_type: widgetType }),
	widgetRemoved: (widgetType: string) =>
		track.manacore('widget_removed', { widget_type: widgetType }),
	widgetResized: (widgetType: string, size: string) =>
		track.manacore('widget_resized', { widget_type: widgetType, size }),
	creditsTabViewed: (tab: string) => track.manacore('credits_tab_viewed', { tab }),
	profileUpdated: () => track.manacore('profile_updated'),
};

/**
 * Context App Events
 */
export const ContextEvents = {
	documentCreated: (type: string) => track.context('document_created', { type }),
	documentDeleted: () => track.context('document_deleted'),
	documentPinned: (pinned: boolean) => track.context('document_pinned', { pinned }),
	spaceCreated: () => track.context('space_created'),
	spaceDeleted: () => track.context('space_deleted'),
	aiGenerated: () => track.context('ai_generated'),
};

/**
 * SkillTree App Events
 */
export const SkillTreeEvents = {
	skillCreated: (branch: string) => track.skilltree('skill_created', { branch }),
	skillDeleted: () => track.skilltree('skill_deleted'),
	xpAdded: (xp: number, leveledUp: boolean) =>
		track.skilltree('xp_added', { xp, leveled_up: leveledUp }),
};

/**
 * NutriPhi App Events
 */
export const NutriPhiEvents = {
	mealAdded: (mealType: string, inputType: string) =>
		track.nutriphi('meal_added', { meal_type: mealType, input_type: inputType }),
	mealDeleted: () => track.nutriphi('meal_deleted'),
	photoAnalyzed: () => track.nutriphi('photo_analyzed'),
	textAnalyzed: () => track.nutriphi('text_analyzed'),
	goalsUpdated: () => track.nutriphi('goals_updated'),
	favoriteSaved: () => track.nutriphi('favorite_saved'),
	favoriteUsed: () => track.nutriphi('favorite_used'),
};

/**
 * Planta App Events
 */
export const PlantaEvents = {
	plantAnalyzed: () => track.planta('plant_analyzed'),
	plantCreated: () => track.planta('plant_created'),
	plantDeleted: () => track.planta('plant_deleted'),
	plantWatered: () => track.planta('plant_watered'),
};

/**
 * Questions App Events
 */
export const QuestionsEvents = {
	questionCreated: (depth: string) => track.questions('question_created', { depth }),
	questionDeleted: () => track.questions('question_deleted'),
	researchStarted: (depth: string) => track.questions('research_started', { depth }),
	collectionCreated: () => track.questions('collection_created'),
	collectionDeleted: () => track.questions('collection_deleted'),
};

/**
 * Photos App Events
 */
export const PhotosEvents = {
	photoUploaded: () => track.photos('photo_uploaded'),
	photoFavorited: (favorited: boolean) => track.photos('photo_favorited', { favorited }),
	photoDeleted: () => track.photos('photo_deleted'),
	albumCreated: () => track.photos('album_created'),
	albumDeleted: () => track.photos('album_deleted'),
	photosAddedToAlbum: (count: number) => track.photos('photos_added_to_album', { count }),
	photoRemovedFromAlbum: () => track.photos('photo_removed_from_album'),
	filtersApplied: () => track.photos('filters_applied'),
};

/**
 * Storage App Events
 */
export const StorageEvents = {
	fileDownloaded: () => track.storage('file_downloaded'),
	fileDeleted: () => track.storage('file_deleted'),
	fileFavorited: (favorited: boolean) => track.storage('file_favorited', { favorited }),
	folderDeleted: () => track.storage('folder_deleted'),
	folderFavorited: (favorited: boolean) => track.storage('folder_favorited', { favorited }),
	shareLinkCopied: () => track.storage('share_link_copied'),
	shareLinkDeleted: () => track.storage('share_link_deleted'),
	trashRestored: (type: string) => track.storage('trash_restored', { type }),
	trashEmptied: () => track.storage('trash_emptied'),
	searchPerformed: (resultsCount: number) =>
		track.storage('search_performed', { results: resultsCount }),
	viewModeChanged: (mode: string) => track.storage('view_mode_changed', { mode }),
};

/**
 * Mukke App Events
 */
export const MukkeEvents = {
	songUploaded: () => track.mukke('song_uploaded'),
	songUploadFailed: () => track.mukke('song_upload_failed'),
	songPlayed: () => track.mukke('song_played'),
	songFavorited: (favorited: boolean) => track.mukke('song_favorited', { favorited }),
	songDeleted: () => track.mukke('song_deleted'),
	playlistCreated: () => track.mukke('playlist_created'),
	playlistDeleted: () => track.mukke('playlist_deleted'),
	playlistPlayAll: () => track.mukke('playlist_play_all'),
	playlistShufflePlay: () => track.mukke('playlist_shuffle_play'),
	projectCreated: () => track.mukke('project_created'),
	projectDeleted: () => track.mukke('project_deleted'),
	projectExported: (format: string) => track.mukke('project_exported', { format }),
};

/**
 * Zitare App Events
 */
export const ZitareEvents = {
	randomQuoteLoaded: () => track.zitare('random_quote_loaded'),
	quoteShared: (category: string) => track.zitare('quote_shared', { category }),
	quoteFavorited: (category: string) => track.zitare('quote_favorited', { category }),
	quoteUnfavorited: () => track.zitare('quote_unfavorited'),
	categoryViewed: (category: string) => track.zitare('category_viewed', { category }),
	searchPerformed: (resultsCount: number) =>
		track.zitare('search_performed', { results: resultsCount }),
	listCreated: () => track.zitare('list_created'),
	listDeleted: () => track.zitare('list_deleted'),
	quoteLanguageChanged: (language: string) => track.zitare('quote_language_changed', { language }),
};

/**
 * Presi App Events
 */
export const PresiEvents = {
	deckCreated: () => track.presi('deck_created'),
	deckDeleted: () => track.presi('deck_deleted'),
	slideCreated: () => track.presi('slide_created'),
	slideEdited: () => track.presi('slide_edited'),
	slideDeleted: () => track.presi('slide_deleted'),
	slideReordered: (direction: 'up' | 'down') => track.presi('slide_reordered', { direction }),
	presentationStarted: (slideCount: number) =>
		track.presi('presentation_started', { slide_count: slideCount }),
	presentationExited: (duration: number, slidesViewed: number) =>
		track.presi('presentation_exited', {
			duration_seconds: duration,
			slides_viewed: slidesViewed,
		}),
	shareLinkCreated: () => track.presi('share_link_created'),
	shareLinkCopied: () => track.presi('share_link_copied'),
	shareLinkDeleted: () => track.presi('share_link_deleted'),
	sharedDeckViewed: () => track.presi('shared_deck_viewed'),
};

/**
 * Subscription/Payment Events
 */
export const SubscriptionEvents = {
	pricingViewed: () => track.subscription('pricing_viewed'),
	planSelected: (plan: string) => track.subscription('plan_selected', { plan }),
	checkoutStarted: (plan: string) => track.subscription('checkout_started', { plan }),
	checkoutCompleted: (plan: string) => track.subscription('checkout_completed', { plan }),
	checkoutAbandoned: (plan: string) => track.subscription('checkout_abandoned', { plan }),
	subscriptionCanceled: (plan: string) => track.subscription('subscription_canceled', { plan }),
	trialStarted: () => track.subscription('trial_started'),
	trialEnded: (converted: boolean) => track.subscription('trial_ended', { converted }),
};

/**
 * Memoro App Events
 */
export const MemoroEvents = {
	memoCreated: (mediaType?: string) =>
		track.memoro('memo_created', mediaType ? { media_type: mediaType } : undefined),
	memoDeleted: () => track.memoro('memo_deleted'),
	memoCombined: (count: number) => track.memoro('memo_combined', { memo_count: count }),
	memoQuestioned: () => track.memoro('memo_questioned'),
	recordingStarted: () => track.memoro('recording_started'),
	recordingCompleted: (durationSeconds: number) =>
		track.memoro('recording_completed', { duration_seconds: durationSeconds }),
	recordingAppended: () => track.memoro('recording_appended'),
	transcriptionRetried: () => track.memoro('transcription_retried'),
	headlineRetried: () => track.memoro('headline_retried'),
	spaceCreated: () => track.memoro('space_created'),
	spaceDeleted: () => track.memoro('space_deleted'),
	spaceLeft: () => track.memoro('space_left'),
	memoLinkedToSpace: () => track.memoro('memo_linked_to_space'),
	memoUnlinkedFromSpace: () => track.memoro('memo_unlinked_from_space'),
	inviteSent: () => track.memoro('invite_sent'),
	inviteAccepted: () => track.memoro('invite_accepted'),
	inviteDeclined: () => track.memoro('invite_declined'),
	meetingBotCreated: (platform: string) => track.memoro('meeting_bot_created', { platform }),
	meetingBotStopped: () => track.memoro('meeting_bot_stopped'),
	recordingToMemo: () => track.memoro('recording_to_memo'),
	blueprintSelected: (blueprintId: string) =>
		track.memoro('blueprint_selected', { blueprint_id: blueprintId }),
	playbackStarted: () => track.memoro('playback_started'),
	settingsUpdated: (setting: string) => track.memoro('settings_updated', { setting }),
	themeChanged: (theme: string) => track.memoro('theme_changed', { theme }),
};

/**
 * General App Events (cross-module, e.g. theme/language changes)
 */
export const AppEvents = {
	appOpened: (app: string) => track.app('app_opened', { app }),
	themeChanged: (theme: 'light' | 'dark' | 'system') => track.app('theme_changed', { theme }),
	languageChanged: (language: string) => track.app('language_changed', { language }),
	feedbackSubmitted: (type: 'bug' | 'feature' | 'other') =>
		track.app('feedback_submitted', { type }),
	helpOpened: () => track.app('help_opened'),
	settingsOpened: () => track.app('settings_opened'),
	shareClicked: (platform: string) => track.app('share_clicked', { platform }),
};
